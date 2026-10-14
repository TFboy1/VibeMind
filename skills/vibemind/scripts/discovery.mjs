import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { isUtf8 } from 'node:buffer';

export const REPOSITORY = 'nilbuild/developer-roadmap';
export const DEFAULT_MIRRORS = [
  { url: 'https://gh-proxy.org/', api: true },
  { url: 'https://ghproxy.net/', api: false },
  { url: 'https://ghfast.top/', api: false },
];
export const DEFAULT_PREFERENCES = { frequency: 'normal', roadmaps: ['*'] };
export const RELATIONS = ['prerequisite', 'next_step', 'alternative', 'cross_domain'];
export const STATUSES = ['candidate', 'invited', 'accepted', 'deferred', 'dismissed'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nodePattern = /^[A-Za-z0-9_-]+$/;
const versionPattern = /^[a-f0-9]{40}$/;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const error = (code, message) => { throw Object.assign(new Error(message), { code }); };
const bytes = value => Buffer.byteLength(JSON.stringify(value), 'utf8');

export function fields(value, keys, label = '输入') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) error('INVALID_INPUT', label + '必须是对象。');
  if (Object.keys(value).some(key => !keys.includes(key))) error('INVALID_INPUT', label + '包含不支持的字段。');
}
export function string(value, label, maximum = 4096) {
  if (typeof value !== 'string' || !value.trim() || Buffer.byteLength(value, 'utf8') > maximum) error('INVALID_INPUT', label + '必须是限额内的非空 UTF-8 字符串。');
}
function strings(value, label, maximum = 20) {
  if (!Array.isArray(value) || value.length > maximum) error('INVALID_INPUT', label + '必须是限额内的字符串数组。');
  for (const item of value) string(item, label);
}
function score(value, label) {
  if (!Number.isFinite(value) || value < 0 || value > 1) error('INVALID_INPUT', label + '必须在 0..1 之间。');
}
export function validatePreferences(value) {
  fields(value, ['frequency', 'roadmaps'], 'learningPreferences');
  if (!['off', 'normal'].includes(value.frequency)) error('INVALID_INPUT', 'frequency 必须是 off 或 normal。');
  strings(value.roadmaps, 'roadmaps', 200);
  if (value.roadmaps.some(item => item !== '*' && !slugPattern.test(item)) || (value.roadmaps.includes('*') && value.roadmaps.length !== 1)) error('INVALID_INPUT', 'roadmaps 使用路线 slug，或单独的 *。');
}
export function validateMirrors(value) {
  if (!Array.isArray(value) || value.length > 8) error('INVALID_INPUT', 'roadmapMirrors 最多八项；空数组禁用镜像。');
  for (const mirror of value) {
    fields(mirror, ['url', 'api'], '镜像');
    string(mirror.url, '镜像 URL', 1024);
    let url;
    try { url = new URL(mirror.url); } catch { error('INVALID_INPUT', '镜像 URL 无效。'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || typeof mirror.api !== 'boolean') error('INVALID_INPUT', '镜像必须是无凭据、查询参数和片段的 HTTPS 基础 URL，并声明 api。');
  }
}
export function validateSession(value) {
  fields(value, ['host', 'sessionId'], 'session');
  string(value.host, 'session.host', 256); string(value.sessionId, 'session.sessionId', 1024);
}
export function validateConstraints(value = {}) {
  fields(value, ['event', 'urgent', 'directImplementation'], 'constraints');
  if (value.event !== undefined && !['manual', 'task_completed', 'in_progress'].includes(value.event)) error('INVALID_INPUT', 'event 无效。');
  for (const key of ['urgent', 'directImplementation']) if (value[key] !== undefined && typeof value[key] !== 'boolean') error('INVALID_INPUT', key + '必须是布尔值。');
}
export function validateDiscovery(input) {
  fields(input, ['action', 'taskSummary', 'roadmaps', 'queries', 'anchors', 'observations', 'constraints', 'source', 'version', 'matches'], 'discover');
  if (bytes(input) > 512 * 1024) error('INPUT_TOO_LARGE', 'discover 输入超过 512 KiB。');
  if (!['search', 'recommend'].includes(input.action)) error('INVALID_INPUT', 'action 必须是 search 或 recommend。');
  string(input.taskSummary, 'taskSummary', 128 * 1024);
  if (input.roadmaps !== undefined) {
    strings(input.roadmaps, 'roadmaps', 3);
    if (input.roadmaps.some(item => !slugPattern.test(item))) error('INVALID_INPUT', '路线必须是有效 slug。');
  }
  if (input.queries !== undefined) strings(input.queries, 'queries', 12);
  if (input.observations !== undefined) strings(input.observations, 'observations');
  if (input.anchors !== undefined) {
    if (!Array.isArray(input.anchors) || input.anchors.length > 20) error('INVALID_INPUT', 'anchors 最多二十项。');
    for (const anchor of input.anchors) {
      fields(anchor, ['conceptId', 'topic', 'basis'], 'anchor');
      if (Boolean(anchor.conceptId) === Boolean(anchor.topic)) error('INVALID_INPUT', 'anchor 必须指定 conceptId 或 topic 之一。');
      string(anchor.conceptId ?? anchor.topic, 'anchor');
      if (anchor.basis !== undefined) string(anchor.basis, 'anchor.basis');
    }
  }
  validateConstraints(input.constraints);
  if (input.source !== undefined) {
    fields(input.source, ['host', 'sessionId', 'taskId', 'codeRevision'], 'source');
    for (const value of Object.values(input.source)) string(value, 'source');
    if (bytes(input.source) > 4096) error('INPUT_TOO_LARGE', 'source 超过 4 KiB。');
  }
  if (input.action === 'recommend') {
    if (!versionPattern.test(input.version ?? '') || !Array.isArray(input.matches) || input.matches.length > 8) error('INVALID_INPUT', 'recommend 需要上次 search 的 version，最多八个 matches。');
    const ids = new Set();
    for (const match of input.matches) {
      fields(match, ['catalogId', 'relation', 'anchor', 'reason', 'learningGoal', 'proposedAction', 'relevance', 'gap', 'gapEvidence', 'prerequisite', 'memoryConceptId', 'memoryTopic'], 'match');
      parseCatalogId(match.catalogId);
      if (ids.has(match.catalogId)) error('INVALID_INPUT', 'matches 不能重复。');
      ids.add(match.catalogId);
      if (!RELATIONS.includes(match.relation)) error('INVALID_INPUT', 'relation 无效。');
      for (const key of ['anchor', 'reason', 'learningGoal', 'proposedAction']) string(match[key], key);
      score(match.relevance, 'relevance');
      if (match.gap !== undefined) score(match.gap, 'gap');
      if (match.gapEvidence !== undefined) string(match.gapEvidence, 'gapEvidence');
      if (match.memoryConceptId && match.memoryTopic) error('INVALID_INPUT', 'memoryConceptId 与 memoryTopic 不能同时提供。');
      for (const key of ['memoryConceptId', 'memoryTopic']) if (match[key] !== undefined) string(match[key], key);
      if (match.prerequisite !== undefined) {
        fields(match.prerequisite, ['status', 'verified', 'basis'], 'prerequisite');
        if (!['ready', 'unknown', 'missing'].includes(match.prerequisite.status) || typeof match.prerequisite.verified !== 'boolean') error('INVALID_INPUT', '前置状态无效。');
        if (match.prerequisite.basis !== undefined) string(match.prerequisite.basis, 'prerequisite.basis');
        if (match.prerequisite.verified && !match.prerequisite.basis) error('INVALID_INPUT', '已核实的前置状态需要依据。');
      }
    }
  } else if (input.matches !== undefined || input.version !== undefined) error('INVALID_INPUT', 'matches/version 仅用于 recommend。');
}
export function parseCatalogId(value) {
  string(value, 'catalogId', 512);
  const parts = value.split('/');
  if (parts.length !== 3 || parts[0] !== 'roadmap' || !slugPattern.test(parts[1]) || !nodePattern.test(parts[2])) error('INVALID_INPUT', 'catalogId 必须是 roadmap/路线/节点ID。');
  return { roadmap: parts[1], nodeId: parts[2] };
}
export const opportunityId = (projectId, catalogId, taskKey) => digest([projectId, catalogId, taskKey]);
export const taskKeyOf = input => input.source?.taskId ?? digest([input.taskSummary.normalize('NFKC').trim(), input.source?.codeRevision ?? 'unknown']);
export const sourceUrl = (version, topic) => 'https://raw.githubusercontent.com/' + REPOSITORY + '/' + version + '/' + topic.path.split('/').map(encodeURIComponent).join('/');
export const cacheLocation = () => {
  const directory = process.env.VIBEMIND_CACHE ?? path.join(os.homedir(), '.cache', 'vibemind', 'roadmap');
  if (!path.isAbsolute(directory)) error('USAGE', 'VIBEMIND_CACHE 必须是绝对目录。');
  return directory;
};

function safeCache(directory, file) {
  for (let current = directory;; current = path.dirname(current)) {
    if (fs.existsSync(current) && (fs.lstatSync(current).isSymbolicLink() || !fs.lstatSync(current).isDirectory())) error('UNSAFE_PATH', '缓存目录不能是链接或文件。');
    if (path.dirname(current) === current) break;
  }
  if (fs.existsSync(file) && (fs.lstatSync(file).isSymbolicLink() || !fs.lstatSync(file).isFile())) error('UNSAFE_PATH', '缓存文件不能是链接。');
}

// Reader owns only public-source cache. It never opens the learner database.
export function createRoadmapReader({ cacheDir = cacheLocation(), mirrors = DEFAULT_MIRRORS, fetchImpl = globalThis.fetch, requestMs = 8000, budgetMs = 30000, now = Date.now } = {}) {
  validateMirrors(mirrors);
  const diagnostics = [];
  const budget = AbortSignal.timeout(budgetMs);
  let active = 0;
  const waiters = [];
  async function request(url, maximum) {
    if (active >= 4) await new Promise(resolve => waiters.push(resolve));
    else active++;
    try {
      budget.throwIfAborted();
      const response = await fetchImpl(url, { signal: AbortSignal.any([budget, AbortSignal.timeout(requestMs)]), headers: { 'User-Agent': 'VibeMind/0.5.0 (https://github.com/TFboy1/VibeMind)', Accept: 'application/json, text/plain' } });
      if (!response.ok) error('SOURCE_HTTP_ERROR', 'HTTP ' + response.status);
      if (Number(response.headers.get('content-length')) > maximum) { await response.body?.cancel(); error('SOURCE_TOO_LARGE', '响应超过限额。'); }
      const chunks = [];
      let total = 0;
      if (!response.body) error('INVALID_SOURCE', '响应没有正文。');
      const reader = response.body.getReader();
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        total += part.value.length;
        if (total > maximum) { await reader.cancel(); error('SOURCE_TOO_LARGE', '响应超过限额。'); }
        chunks.push(Buffer.from(part.value));
      }
      const body = Buffer.concat(chunks, total);
      if (!isUtf8(body)) error('INVALID_SOURCE', '资料必须是 UTF-8。');
      return body.toString('utf8');
    } finally {
      const next = waiters.shift();
      if (next) next(); else active--;
    }
  }
  async function get(key, url, validate, { api = true, immutable = false, maximum = 8 * 1024 * 1024 } = {}) {
    const file = path.join(cacheDir, digest(key) + '.json');
    let cached;
    try {
      safeCache(cacheDir, file);
      if (fs.existsSync(file) && fs.statSync(file).size <= maximum + 65536) {
        const bytes = fs.readFileSync(file);
        if (!isUtf8(bytes)) error('INVALID_SOURCE', '缓存编码无效。');
        cached = JSON.parse(bytes.toString('utf8'));
        if (cached.key !== key || cached.hash !== digest(cached.data) || !Number.isFinite(Date.parse(cached.fetchedAt))) error('INVALID_SOURCE', '缓存校验失败。');
        cached.entryCount = Array.isArray(cached.data) ? cached.data.length : undefined;
        cached.data = validate(cached.data);
      }
    } catch (failure) { cached = undefined; diagnostics.push({ code: 'CACHE_INVALID', message: failure.message }); }
    if (cached && (immutable || now() - Date.parse(cached.fetchedAt) < 86400000)) return { ...cached, stale: false, cached: true };
    const urls = [url, ...mirrors.filter(item => !api || item.api).map(item => item.url.replace(/\/?$/, '/') + url)];
    for (const target of urls) {
      try {
        const body = await request(target, maximum);
        let data;
        if (api) {
          try { data = JSON.parse(body.replace(/^\uFEFF/, '')); } catch { error('INVALID_SOURCE', 'API 未返回 JSON，可能是错误页面。'); }
        } else data = body;
        const rawData = data;
        data = validate(data);
        const result = { key, data, hash: digest(data), entryCount: Array.isArray(rawData) ? rawData.length : undefined, fetchedAt: new Date(now()).toISOString(), fetchedFrom: target, stale: false, cached: false };
        try {
          safeCache(cacheDir, file); fs.mkdirSync(cacheDir, { recursive: true, mode: 0o700 }); safeCache(cacheDir, file);
          const temporary = file + '.' + randomUUID() + '.tmp';
          try { fs.writeFileSync(temporary, JSON.stringify({ ...result, data: rawData, hash: digest(rawData) }), { encoding: 'utf8', flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
          finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
        } catch (failure) { diagnostics.push({ code: 'CACHE_WRITE_FAILED', message: failure.message }); }
        return result;
      } catch (failure) {
        diagnostics.push({ code: failure.code ?? 'SOURCE_UNAVAILABLE', url: target, message: String(failure.message).slice(0, 512) });
        if (budget.aborted) break;
      }
    }
    if (cached) {
      diagnostics.push({ code: 'STALE_CACHE', key, fetchedAt: cached.fetchedAt });
      return { ...cached, stale: true, cached: true };
    }
    error('SOURCE_UNAVAILABLE', '资料来源均不可用，且没有可用缓存。');
  }
  const apiUrl = suffix => 'https://api.github.com/repos/' + REPOSITORY + '/' + suffix;
  async function head() {
    return get('head', apiUrl('commits/master'), value => {
      if (!versionPattern.test(value?.sha ?? '')) error('INVALID_SOURCE', '上游版本无效。');
      return { sha: value.sha };
    });
  }
  async function routes(version) {
    return get('routes:' + version, apiUrl('contents/roadmaps?ref=' + version), value => {
      if (!Array.isArray(value) || !value.length) error('INVALID_SOURCE', '路线目录无效。');
      const result = value.filter(item => item.type === 'dir').map(item => {
        if (!slugPattern.test(item.name ?? '') || item.path !== 'roadmaps/' + item.name) error('INVALID_SOURCE', '路线路径无效。');
        return { id: item.name, title: item.name.replaceAll('-', ' '), url: 'https://roadmap.sh/' + item.name };
      });
      if (!result.length || new Set(result.map(item => item.id)).size !== result.length) error('INVALID_SOURCE', '路线为空或重复。');
      return result;
    });
  }
  async function topics(version, roadmap) {
    if (!slugPattern.test(roadmap)) error('INVALID_INPUT', '路线 slug 无效。');
    const prefix = 'roadmaps/' + roadmap + '/content/';
    const normalizeTopics = value => {
      if (!Array.isArray(value)) error('INVALID_SOURCE', '主题目录无效。');
      const result = value.filter(item => item.type === 'file' && item.name?.endsWith('.md')).flatMap(item => {
        const match = /^(.+)@([A-Za-z0-9_-]+)\.md$/.exec(item.name);
        if (item.path !== prefix + item.name || /[\/\\]/.test(item.name) || !versionPattern.test(item.sha ?? '')) error('INVALID_SOURCE', '主题路径或校验值无效。');
        if (!match) return [];
        return [{ catalogId: 'roadmap/' + roadmap + '/' + match[2], roadmap, nodeId: match[2], title: match[1].replaceAll('-', ' '), path: item.path, blobSha: item.sha, version, sourceUrl: sourceUrl(version, item), roadmapUrl: 'https://roadmap.sh/' + roadmap }];
      });
      if (new Set(result.map(item => item.catalogId)).size !== result.length) error('INVALID_SOURCE', '主题节点 ID 重复。');
      return result;
    };
    const directory = await get('topics:' + version + ':' + roadmap, apiUrl('contents/' + prefix + '?ref=' + version), normalizeTopics);
    if (directory.entryCount < 1000) return directory;
    // GitHub's contents endpoint caps a directory at 1,000 entries.
    const tree = await get('tree:' + version, apiUrl('git/trees/' + version + '?recursive=1'), value => {
      if (!Array.isArray(value?.tree) || value.truncated !== false) error('INVALID_SOURCE', '上游树目录不完整，不能宣称完整覆盖。');
      return value.tree;
    });
    const entries = tree.data.filter(item => item.type === 'blob' && item.path?.startsWith(prefix) && !item.path.slice(prefix.length).includes('/'))
      .map(item => ({ ...item, type: 'file', name: item.path.slice(prefix.length) }));
    return { ...tree, data: normalizeTopics(entries) };
  }
  async function document(topic) {
    return get('document:' + topic.version + ':' + topic.catalogId, topic.sourceUrl, value => {
      if (typeof value !== 'string' || !value.trim() || /^\s*(?:<!doctype|<html|<head|<body)\b/i.test(value)) error('INVALID_SOURCE', '主题内容无效或是 HTML 错误页。');
      const data = Buffer.from(value, 'utf8');
      const sha = createHash('sha1').update(Buffer.from('blob ' + data.length + '\0')).update(data).digest('hex');
      if (sha !== topic.blobSha) error('SOURCE_CHECKSUM_MISMATCH', '主题内容与目录 blob SHA 不一致。');
      return value;
    }, { api: false, immutable: true, maximum: 128 * 1024 });
  }
  function cachedSummary(topic) {
    const key = 'document:' + topic.version + ':' + topic.catalogId;
    const file = path.join(cacheDir, digest(key) + '.json');
    try {
      safeCache(cacheDir, file);
      if (!fs.existsSync(file) || fs.statSync(file).size > 1024 * 1024) return '';
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (value.key !== key || value.hash !== digest(value.data) || typeof value.data !== 'string') return '';
      return value.data.slice(0, 2048);
    } catch { return ''; }
  }
  return { head, routes, topics, document, cachedSummary, diagnostics, cacheDir };
}

export async function searchTopics(topics, queries, limit = 30) {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:', { allowExtension: false });
  try {
    db.exec('CREATE VIRTUAL TABLE lookup USING fts5(title, roadmap, nodeId, summary, tokenize="unicode61");');
    const insert = db.prepare('INSERT INTO lookup(rowid,title,roadmap,nodeId,summary) VALUES (?,?,?,?,?)');
    topics.forEach((item, i) => insert.run(i + 1, item.title, item.roadmap.replaceAll('-', ' '), item.nodeId, item.summary ?? ''));
    const terms = [...new Set(queries.flatMap(query => query.normalize('NFKC').match(/[\p{L}\p{N}_]+/gu) ?? []))].slice(0, 64);
    if (!terms.length) return [];
    const query = terms.map(term => '"' + term + '"').join(' OR ');
    return db.prepare('SELECT rowid, bm25(lookup, 4, 1, 0, 2) AS rank FROM lookup WHERE lookup MATCH ? ORDER BY rank, rowid LIMIT ?').all(query, limit)
      .map(row => ({ ...topics[row.rowid - 1], lexicalRank: row.rank }));
  } finally { db.close(); }
}

export function scanProject(project) {
  const facts = [], diagnostics = [], queue = [{ directory: project, depth: 0 }];
  let total = 0, directories = 0;
  const names = new Set(['package.json', 'pyproject.toml', 'requirements.txt', 'Dockerfile', 'compose.yml', 'compose.yaml', 'docker-compose.yml', 'docker-compose.yaml']);
  while (queue.length && directories++ < 64 && total < 512 * 1024) {
    const { directory, depth } = queue.shift();
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch (failure) { diagnostics.push({ code: 'SCAN_FAILED', path: path.relative(project, directory), message: failure.message }); continue; }
    for (const item of entries) {
      if (item.isSymbolicLink() || item.name.startsWith('.') || ['node_modules', 'dist', 'build', 'target', 'venv', '__pycache__'].includes(item.name)) continue;
      const file = path.join(directory, item.name), location = path.relative(project, file);
      if (item.isDirectory() && depth < 2) queue.push({ directory: file, depth: depth + 1 });
      if (!item.isFile() || !names.has(item.name)) continue;
      facts.push({ kind: 'manifest', name: item.name, location });
      if (!['package.json', 'pyproject.toml', 'requirements.txt'].includes(item.name)) continue;
      try {
        const stat = fs.lstatSync(file);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 128 * 1024 || total + stat.size > 512 * 1024) { diagnostics.push({ code: 'SCAN_LIMIT', path: location }); continue; }
        const buffer = fs.readFileSync(file); total += buffer.length;
        if (!isUtf8(buffer)) error('INVALID_INPUT', '清单不是 UTF-8。');
        const body = buffer.toString('utf8').replace(/^\uFEFF/, '');
        let dependencies = [];
        if (item.name === 'package.json') {
          const manifest = JSON.parse(body);
          dependencies = [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})];
        } else if (item.name === 'requirements.txt') dependencies = body.split(/\r?\n/).flatMap(line => /^([A-Za-z][A-Za-z0-9_.-]*)(?:\[[^\]]*\])?(?:\s*[<>=!~].*)?\s*$/.exec(line.trim())?.[1] ?? []);
        else {
          // Hints only: TOML remains the host's responsibility, no new parser dependency.
          dependencies = [...body.matchAll(/["']([A-Za-z][A-Za-z0-9_.-]*)(?:\[[^\]]*\])?[<>=!~][^"']*["']/g)].map(match => match[1]);
        }
        for (const name of new Set(dependencies)) facts.push({ kind: item.name === 'pyproject.toml' ? 'dependency_hint' : 'dependency', name, location });
      } catch (failure) { diagnostics.push({ code: 'SCAN_FAILED', path: location, message: failure.message }); }
    }
  }
  return { facts: facts.slice(0, 300), diagnostics, bytesRead: total, truncated: facts.length > 300 || queue.length > 0 };
}

export function invitationPolicy({ mode, initialized, migrationRequired, preferences, session, sessionState, constraints = {} }) {
  const reasons = [];
  if (!initialized) reasons.push('not_initialized');
  if (mode === 'paused') reasons.push('paused');
  if (migrationRequired) reasons.push('migration_required');
  if (preferences.frequency === 'off') reasons.push('frequency_off');
  if (!session) reasons.push('session_unknown');
  if (constraints.event !== 'task_completed') reasons.push('not_task_completed');
  if (constraints.urgent) reasons.push('urgent');
  if (constraints.directImplementation) reasons.push('direct_implementation');
  if (sessionState?.invited) reasons.push('session_limit');
  if (sessionState?.suppressed) reasons.push('session_suppressed');
  return { eligible: reasons.length === 0, reasons, requiresReservation: true };
}

export function buildRecommendation(input, topic, document, history, projectId) {
  const match = input.matches.find(item => item.catalogId === topic.catalogId);
  const prerequisite = match.prerequisite ?? { status: 'unknown', verified: false };
  const factors = {
    relevance: match.relevance,
    gap: match.gapEvidence ? (match.gap ?? 1) : history.alreadyExplained ? 0.25 : 0.5,
    prerequisite: prerequisite.verified ? prerequisite.status === 'ready' ? 1 : prerequisite.status === 'missing' ? 0 : 0.5 : 0.5,
    timing: input.constraints?.urgent || input.constraints?.directImplementation ? 0 : input.constraints?.event === 'in_progress' ? 0.5 : 1,
  };
  const score = Number((0.35 * factors.relevance + 0.25 * factors.gap + 0.20 * factors.prerequisite + 0.20 * factors.timing).toFixed(6));
  const taskKey = taskKeyOf(input);
  const constraints = input.constraints ?? {};
  const candidate = {
    id: opportunityId(projectId, topic.catalogId, taskKey), catalogId: topic.catalogId, roadmap: topic.roadmap, nodeId: topic.nodeId, taskKey,
    title: /^#\s+(.+)$/m.exec(document.data.replace(/^\uFEFF/, ''))?.[1] ?? topic.title,
    reason: match.reason, learningGoal: match.learningGoal, proposedAction: match.proposedAction,
    relation: match.relation, anchor: match.anchor, relationBasis: 'host_inference', score, factors, prerequisite, constraints,
    source: { canonicalUrl: topic.sourceUrl, version: topic.version, fetchedFrom: document.fetchedFrom, fetchedAt: document.fetchedAt, stale: Boolean(document.stale) },
    ...(match.gapEvidence ? { gapEvidence: match.gapEvidence } : {}),
    ...(history.conceptId ? { memoryConceptId: history.conceptId } : {}),
  };
  const filteredReason = factors.relevance === 0 ? 'project_irrelevant' : prerequisite.verified && prerequisite.status === 'missing' ? 'prerequisite_missing' : null;
  return { ...candidate, mastery: 'unknown', history, gapEvidence: match.gapEvidence ?? null, filteredReason, recordCandidate: candidate };
}
