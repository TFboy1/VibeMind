import { isDeepStrictEqual } from 'node:util';
import { fields, string, validateSession, validateConstraints, validatePreferences, parseCatalogId, opportunityId, invitationPolicy, DEFAULT_PREFERENCES, RELATIONS, STATUSES } from './discovery.mjs';

const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
export const GROWTH_SCHEMA = [
  'CREATE TABLE learning_preferences (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL CHECK(json_valid(value))) STRICT;',
  'INSERT INTO learning_preferences VALUES (1, \'{"frequency":"normal","roadmaps":["*"]}\');',
  'CREATE TABLE growth_opportunities (project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, id TEXT NOT NULL, catalog_id TEXT NOT NULL, task_key TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN (\'candidate\',\'invited\',\'accepted\',\'deferred\',\'dismissed\')), candidate TEXT NOT NULL CHECK(json_valid(candidate)), feedback TEXT NOT NULL DEFAULT \'[]\' CHECK(json_valid(feedback)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(project_id,id), UNIQUE(project_id,catalog_id,task_key)) STRICT;',
  'CREATE INDEX growth_by_status ON growth_opportunities(project_id,status,id);',
  'CREATE TABLE growth_sessions (project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, host TEXT NOT NULL, session_id TEXT NOT NULL, invited INTEGER NOT NULL DEFAULT 0 CHECK(invited IN (0,1)), suppressed INTEGER NOT NULL DEFAULT 0 CHECK(suppressed IN (0,1)), opportunity_id TEXT, PRIMARY KEY(project_id,host,session_id)) STRICT;',
].join('\n');

export function preferencesOf(db) {
  if (!db || db.prepare('PRAGMA user_version').get().user_version < 3) return { ...DEFAULT_PREFERENCES, roadmaps: ['*'] };
  const row = db.prepare('SELECT value FROM learning_preferences WHERE id=1').get();
  if (!row) fail('INVALID_DATABASE', '数据库缺少学习偏好；不会重置。');
  const value = JSON.parse(row.value); validatePreferences(value); return value;
}
export function sessionOf(db, projectId, session) {
  if (!db || !projectId || !session || db.prepare('PRAGMA user_version').get().user_version < 3) return null;
  return db.prepare('SELECT invited,suppressed,opportunity_id AS opportunityId FROM growth_sessions WHERE project_id=? AND host=? AND session_id=?').get(projectId, session.host, session.sessionId) ?? null;
}
export function growthSnapshot(db, projectId) {
  if (db.prepare('PRAGMA user_version').get().user_version < 3) return {};
  return {
    growthOpportunities: db.prepare('SELECT * FROM growth_opportunities WHERE project_id=? ORDER BY id').all(projectId),
    growthSessions: db.prepare('SELECT * FROM growth_sessions WHERE project_id=? ORDER BY host,session_id').all(projectId),
  };
}
export function growthHead(db, projectId) {
  if (!db || db.prepare('PRAGMA user_version').get().user_version < 3) return { opportunityCount: 0 };
  return { opportunityCount: db.prepare('SELECT count(*) AS n FROM growth_opportunities WHERE project_id=?').get(projectId).n };
}

export function validateCandidate(value, projectId) {
  fields(value, ['id', 'catalogId', 'roadmap', 'nodeId', 'taskKey', 'title', 'reason', 'learningGoal', 'proposedAction', 'relation', 'anchor', 'relationBasis', 'score', 'factors', 'prerequisite', 'constraints', 'source', 'memoryConceptId', 'gapEvidence'], '成长候选');
  const reference = parseCatalogId(value.catalogId);
  for (const key of ['id', 'taskKey', 'title', 'reason', 'learningGoal', 'proposedAction', 'anchor']) string(value[key], key);
  if (reference.roadmap !== value.roadmap || reference.nodeId !== value.nodeId || value.id !== opportunityId(projectId, value.catalogId, value.taskKey)) fail('INVALID_INPUT', '候选身份必须与来源节点、项目及任务键一致；重新 discover。');
  if (!RELATIONS.includes(value.relation) || value.relationBasis !== 'host_inference') fail('INVALID_INPUT', '关系必须声明为宿主推断。');
  fields(value.factors, ['relevance', 'gap', 'prerequisite', 'timing'], 'factors');
  for (const factor of ['relevance', 'gap', 'prerequisite', 'timing']) if (!Number.isFinite(value.factors[factor]) || value.factors[factor] < 0 || value.factors[factor] > 1) fail('INVALID_INPUT', '排序因子必须在 0..1 之间。');
  const score = Number((0.35 * value.factors.relevance + 0.25 * value.factors.gap + 0.20 * value.factors.prerequisite + 0.20 * value.factors.timing).toFixed(6));
  if (value.score !== score) fail('INVALID_INPUT', '候选得分与排序因子不一致。');
  fields(value.prerequisite, ['status', 'verified', 'basis'], 'prerequisite');
  if (!['ready', 'unknown', 'missing'].includes(value.prerequisite.status) || typeof value.prerequisite.verified !== 'boolean') fail('INVALID_INPUT', '前置状态无效。');
  if (value.prerequisite.basis !== undefined) string(value.prerequisite.basis, 'prerequisite.basis');
  if (value.prerequisite.verified && !value.prerequisite.basis) fail('INVALID_INPUT', '已核实前置需要依据。');
  validateConstraints(value.constraints);
  fields(value.source, ['canonicalUrl', 'version', 'fetchedFrom', 'fetchedAt', 'stale'], '候选来源');
  if (!/^[a-f0-9]{40}$/.test(value.source.version ?? '') || !Number.isFinite(Date.parse(value.source.fetchedAt)) || typeof value.source.stale !== 'boolean') fail('INVALID_INPUT', '来源版本或时间无效。');
  let canonical, actual, pathname;
  try { canonical = new URL(value.source.canonicalUrl); actual = new URL(value.source.fetchedFrom); pathname = decodeURIComponent(canonical.pathname); } catch { fail('INVALID_INPUT', '来源 URL 无效。'); }
  const prefix = '/nilbuild/developer-roadmap/' + value.source.version + '/roadmaps/' + value.roadmap + '/content/';
  if (canonical.origin !== 'https://raw.githubusercontent.com' || canonical.search || canonical.hash || !pathname.startsWith(prefix) || pathname.slice(prefix.length).includes('/') || !pathname.endsWith('@' + value.nodeId + '.md') || actual.protocol !== 'https:' || actual.username || actual.password) fail('INVALID_INPUT', '来源必须对应固定版本的官方节点。');
  if (value.memoryConceptId !== undefined) string(value.memoryConceptId, 'memoryConceptId');
  if (value.gapEvidence !== undefined) string(value.gapEvidence, 'gapEvidence');
  if (value.factors.gap > 0.5 && !value.gapEvidence) fail('INVALID_INPUT', '高于未知基线的缺口分数需要真实观察依据。');
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > 64 * 1024) fail('INPUT_TOO_LARGE', '候选超过 64 KiB；不保存教程正文。');
}
export function validateGrowth(value, projectId, source = {}) {
  fields(value, ['candidates', 'session', 'invite', 'feedback', 'suppressSession'], 'growth');
  if (!Object.keys(value).some(key => key !== 'session')) fail('INVALID_INPUT', 'growth 需要候选、邀请、反馈或停止邀请。');
  if (value.candidates !== undefined) {
    if (!Array.isArray(value.candidates) || value.candidates.length > 30) fail('INVALID_INPUT', 'candidates 最多三十项。');
    const ids = new Set();
    for (const candidate of value.candidates) {
      validateCandidate(candidate, projectId);
      if (ids.has(candidate.id)) fail('INVALID_INPUT', '候选 ID 重复。');
      ids.add(candidate.id);
    }
  }
  if (value.session !== undefined) {
    validateSession(value.session);
    if ((source.host && source.host !== value.session.host) || (source.sessionId && source.sessionId !== value.session.sessionId)) fail('INVALID_INPUT', 'session 必须与记录 source 一致。');
  }
  if (value.invite !== undefined) string(value.invite, 'invite');
  if (value.feedback !== undefined) {
    fields(value.feedback, ['opportunityId', 'outcome', 'summary'], 'feedback');
    string(value.feedback.opportunityId, 'feedback.opportunityId');
    if (!['accepted', 'deferred', 'dismissed'].includes(value.feedback.outcome)) fail('INVALID_INPUT', '反馈状态无效。');
    if (value.feedback.summary !== undefined) string(value.feedback.summary, 'feedback.summary');
  }
  if (value.suppressSession !== undefined && value.suppressSession !== true) fail('INVALID_INPUT', 'suppressSession 只能为 true；本会话不重新启用邀请。');
  if ((value.invite !== undefined || value.feedback !== undefined || value.suppressSession) && !value.session) fail('INVALID_INPUT', '邀请、反馈和停止邀请需要真实 session。');
  if (value.invite && (value.feedback || value.suppressSession)) fail('INVALID_INPUT', '不能同批邀请并反馈/停止。');
}

export function applyGrowth(db, projectId, mode, value) {
  let changed = false;
  const timestamp = new Date().toISOString();
  for (const candidate of value.candidates ?? []) {
    const previous = db.prepare('SELECT candidate FROM growth_opportunities WHERE project_id=? AND id=?').get(projectId, candidate.id);
    if (previous && isDeepStrictEqual(JSON.parse(previous.candidate), candidate)) continue;
    db.prepare('INSERT INTO growth_opportunities(project_id,id,catalog_id,task_key,status,candidate,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(project_id,id) DO UPDATE SET candidate=excluded.candidate,updated_at=excluded.updated_at')
      .run(projectId, candidate.id, candidate.catalogId, candidate.taskKey, 'candidate', JSON.stringify(candidate), timestamp, timestamp);
    changed = true;
  }
  const session = value.session;
  const ensureSession = () => {
    db.prepare('INSERT OR IGNORE INTO growth_sessions(project_id,host,session_id) VALUES (?,?,?)').run(projectId, session.host, session.sessionId);
  };
  const opportunity = id => {
    const row = db.prepare('SELECT * FROM growth_opportunities WHERE project_id=? AND id=?').get(projectId, id);
    if (!row) fail('OPPORTUNITY_NOT_FOUND', '当前项目没有此机会。');
    return row;
  };
  if (value.invite) {
    const row = opportunity(value.invite), candidate = JSON.parse(row.candidate);
    const policy = invitationPolicy({ mode, initialized: true, migrationRequired: false, preferences: preferencesOf(db), session, sessionState: sessionOf(db, projectId, session), constraints: candidate.constraints });
    const preferences = preferencesOf(db);
    if (!preferences.roadmaps.includes('*') && !preferences.roadmaps.includes(candidate.roadmap)) policy.reasons.push('roadmap_disabled');
    if (row.status !== 'candidate') policy.reasons.push('already_handled');
    if (candidate.factors.relevance === 0 || (candidate.prerequisite.verified && candidate.prerequisite.status === 'missing')) policy.reasons.push('filtered_candidate');
    if (policy.reasons.length) fail('INVITATION_BLOCKED', '不发邀请：' + policy.reasons.join(', ') + '。');
    ensureSession();
    db.prepare('UPDATE growth_sessions SET invited=1,opportunity_id=? WHERE project_id=? AND host=? AND session_id=?').run(row.id, projectId, session.host, session.sessionId);
    db.prepare('UPDATE growth_opportunities SET status=?,updated_at=? WHERE project_id=? AND id=?').run('invited', timestamp, projectId, row.id);
    changed = true;
  }
  if (value.feedback) {
    const row = opportunity(value.feedback.opportunityId);
    const feedback = JSON.parse(row.feedback);
    const observation = { ...value.feedback, session };
    const last = feedback.at(-1);
    const comparable = last && { ...last };
    if (comparable) delete comparable.recordedAt;
    if (!isDeepStrictEqual(comparable, observation)) {
      feedback.push({ ...observation, recordedAt: timestamp });
      if (Buffer.byteLength(JSON.stringify(feedback), 'utf8') > 128 * 1024) fail('INPUT_TOO_LARGE', '反馈历史超过 128 KiB，未部分保存。');
      db.prepare('UPDATE growth_opportunities SET status=?,feedback=?,updated_at=? WHERE project_id=? AND id=?').run(value.feedback.outcome, JSON.stringify(feedback), timestamp, projectId, row.id);
      changed = true;
    }
  }
  if (value.suppressSession || ['deferred', 'dismissed'].includes(value.feedback?.outcome)) {
    const previous = sessionOf(db, projectId, session);
    if (!previous?.suppressed) {
      ensureSession();
      db.prepare('UPDATE growth_sessions SET suppressed=1 WHERE project_id=? AND host=? AND session_id=?').run(projectId, session.host, session.sessionId);
      changed = true;
    }
  }
  return changed;
}

export function listOpportunities(db, projectId, options, storeId) {
  if (!db || db.prepare('PRAGMA user_version').get().user_version < 3) fail('MIGRATION_REQUIRED', '成长机会需要格式 3；先明确 migrate。');
  const limit = options.limit ?? 20;
  if (options.status !== undefined && !STATUSES.includes(options.status)) fail('USAGE', '机会状态无效。');
  if (options.roadmap !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.roadmap)) fail('USAGE', '路线 slug 无效。');
  let after = '';
  if (options.cursor) {
    try {
      const value = JSON.parse(Buffer.from(options.cursor, 'base64url').toString('utf8'));
      fields(value, ['storeId', 'projectId', 'status', 'roadmap', 'after']);
      if (value.storeId !== storeId || value.projectId !== projectId || value.status !== (options.status ?? null) || value.roadmap !== (options.roadmap ?? null) || typeof value.after !== 'string') throw new Error();
      after = value.after;
    } catch { fail('INVALID_CURSOR', '分页标记与库、项目或过滤条件不一致。'); }
  }
  const rows = db.prepare('SELECT * FROM growth_opportunities WHERE project_id=? AND id>? AND (? IS NULL OR status=?) AND (? IS NULL OR json_extract(candidate,\'$.roadmap\')=?) ORDER BY id LIMIT ?')
    .all(projectId, after, options.status ?? null, options.status ?? null, options.roadmap ?? null, options.roadmap ?? null, limit + 1);
  return {
    opportunities: rows.slice(0, limit).map(row => ({ ...JSON.parse(row.candidate), status: row.status, feedback: JSON.parse(row.feedback), createdAt: row.created_at, updatedAt: row.updated_at })),
    nextCursor: rows.length > limit ? Buffer.from(JSON.stringify({ storeId, projectId, status: options.status ?? null, roadmap: options.roadmap ?? null, after: rows[limit - 1].id }), 'utf8').toString('base64url') : null,
  };
}
