import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import test from 'node:test';
import { execute, LIMITS, locate, renderContext } from '../skills/vibemind/scripts/vibemind.mjs';

const mutations = ['record', 'record-user', 'pause', 'resume', 'correct', 'purge'];
function writeInput(home, cwd, input = {}) {
  const current = execute('status', { home, cwd });
  return { expectedRevision: current.revision, expectedStoreId: current.storeId, expectedProjectId: current.projectId,
    operationId: randomUUID(), ...(input.removeAliases?.length ? { expectedGraphRevision: current.graphRevision } : {}), ...input };
}

const script = fileURLToPath(new URL('../skills/vibemind/scripts/vibemind.mjs', import.meta.url));
const empty = { schemaVersion: 1, revision: 0, mode: 'active', profile: '', projectMap: '', cards: [], decisions: [] };
const card = { id: 'cors-card', title: '当前跨域配置', content: 'Vue 请求 FastAPI；CORS 原理已经解释。' };
const decision = { id: 'access', title: '访问规则', stage: 'implementation', content: '等待实施授权，不能当作已经授权。' };
const explanation = {
  cards: [card], concepts: [{ id: 'cors', title: '跨域资源共享', aliases: ['CORS', '跨域'] }],
  evidence: [{ id: 'cors-explained', conceptId: 'cors', cardId: card.id, kind: 'explained', scope: '同源策略与 CORS 的基本原理', summary: '已结合 Vue/FastAPI 解释来源限制；无用户独立应用证据。', codeLocation: 'api/main.py:12' }],
};

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibemind-test-'));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('vibemind-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const home = path.join(root, '用户 记忆');
  const makeProject = name => {
    const cwd = path.join(root, name);
    fs.mkdirSync(path.join(cwd, '.git'), { recursive: true });
    return cwd;
  };
  const a = makeProject('中文 项目 A'), b = makeProject('项目 B');
  const call = (command, input, options = {}) => {
    const args = { home, ...(['init', 'status', 'context', 'get', ...mutations].includes(command) && !options.projectId ? { cwd: a } : {}), ...(command === 'init' ? { sharing: 'full' } : {}), ...options };
    if (mutations.includes(command) && args.cwd && (input === undefined && ['pause', 'resume'].includes(command) || input && typeof input === 'object' && !Array.isArray(input))) input = writeInput(home, args.cwd, input);
    return execute(command, args, input);
  };
  const rows = sql => {
    const db = new DatabaseSync(path.join(home, 'memory.sqlite'), { readOnly: true });
    try { return db.prepare(sql).all().map(value => ({ ...value })); } finally { db.close(); }
  };
  return { root, home, a, b, makeProject, call, rows, input: (input, cwd = a) => writeInput(home, cwd, input) };
}
function run(f, command, input, flags = [], executable = script) {
  const args = [...flags];
  if (['init', ...mutations].includes(command) && !args.includes('--cwd')) args.push('--cwd', f.a);
  if (command === 'init' && !args.includes('--sharing')) args.push('--sharing', 'full');
  if (mutations.includes(command) && input !== undefined) {
    const bom = Buffer.isBuffer(input) && input.toString('utf8').startsWith('\uFEFF');
    try {
      const value = Buffer.isBuffer(input) ? isUtf8(input) && JSON.parse(input.toString('utf8').replace(/^\uFEFF/, '')) : input;
      if (value && typeof value === 'object') {
        const cwd = args[args.indexOf('--cwd') + 1];
        const payload = writeInput(f.home, cwd, value);
        input = bom ? Buffer.from('\uFEFF' + JSON.stringify(payload), 'utf8') : payload;
      }
    } catch { /* 保留非法编码/JSON，让真实 CLI 拒绝。 */ }
  }
  const value = spawnSync(process.execPath, [executable, command, ...args], {
    cwd: f.a, env: { ...process.env, VIBEMIND_HOME: f.home }, encoding: 'utf8',
    input: input === undefined || Buffer.isBuffer(input) ? input : JSON.stringify(input), timeout: 15_000,
  });
  assert.equal(value.error, undefined, value.error?.message);
  return value;
}
function ok(value) {
  assert.equal(value.status, 0, value.stderr);
  const result = JSON.parse(value.stdout);
  assert.equal(result.ok, true);
  return result;
}
function rejected(value, code) {
  assert.equal(value.status, 1, value.stdout);
  assert.equal(value.stdout, '');
  const result = JSON.parse(value.stderr.split('\n').find(line => line.startsWith('{"ok":false')));
  assert.equal(result.error.code, code, result.error.message);
}
const rejects = (action, code) => assert.throws(action, error => error.code === code);
function disk(root) {
  const result = {};
  function walk(directory) {
    for (const name of fs.readdirSync(directory)) {
      const file = path.join(directory, name), stat = fs.lstatSync(file);
      if (stat.isDirectory()) walk(file);
      else result[path.relative(root, file)] = stat.isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file).toString('hex');
    }
  }
  walk(root);
  return result;
}

test('首次读取不创建身份、数据库或启用伴学', t => {
  const f = fixture(t), before = disk(f.root);
  assert.equal(f.call('status').initialized, false);
  rejects(() => f.call('context'), 'NOT_INITIALIZED');
  assert.deepEqual(f.call('projects').projects, []);
  assert.equal(f.call('user').userRevision, 0);
  assert.equal(f.call('knowledge', undefined, { topic: 'CORS' }).alreadyExplained, false);
  assert.deepEqual(disk(f.root), before);
});
test('仅身份写入项目目录；init 和相同更新幂等，暂停不会被 init 撤销', t => {
  const f = fixture(t);
  assert.equal(f.call('init').revision, 0);
  assert.deepEqual(fs.readdirSync(path.join(f.a, '.vibemind')), ['project.json']);
  f.call('pause');
  assert.equal(f.call('init').mode, 'paused');
  assert.equal(f.call('pause').changed, false);
  assert.equal(f.call('status').revision, 1);
  assert.equal(f.rows('SELECT * FROM snapshots').length, 1);
});
test('用户档案共享，项目观察、卡片和决定隔离，revision 独立', t => {
  const f = fixture(t);
  f.call('init'); f.call('init', undefined, { cwd: f.b });
  f.call('record-user', { expectedRevision: 0, profile: '中文；结合实际代码。' });
  f.call('record', { expectedRevision: 0, profile: 'A 的观察', projectMap: 'Vue → FastAPI', cards: [card], decisions: [decision] });
  const a = f.call('context'), b = f.call('context', undefined, { cwd: f.b });
  assert.equal(a.userProfile, b.userProfile); assert.equal(a.userRevision, 1);
  assert.equal(b.revision, 0); assert.equal(b.profile, '');
  assert.equal(b.pendingDecisions.length, 0); assert.equal(b.cardIndex.length, 0);
  rejects(() => f.call('record-user', { expectedRevision: 0, profile: '旧档案' }), 'CONFLICT');
});
test('A 局部解释后 B 按别名只跳过已覆盖范围，无应用证据仍不重讲', t => {
  const f = fixture(t), a = f.call('init');
  f.call('record', { expectedRevision: 0, ...explanation });
  f.call('init', undefined, { cwd: f.b });
  const b = f.call('context', undefined, { cwd: f.b, topic: 'CORS' });
  assert.equal(b.learning.alreadyExplained, true); assert.equal(b.learning.guidance, 'skip_covered_scope');
  assert.equal(b.learning.conceptId, 'cors');
  assert.equal(b.learning.explanationSummaries[0].projectId, a.projectId);
  assert.equal(b.learning.explanationSummaries[0].codeLocation, 'api/main.py:12');
  assert.equal(b.learning.explanationSummaries[0].scope, explanation.evidence[0].scope);
  assert.ok(!b.learning.evidence.some(value => value.kind === 'applied'));
  assert.match(renderContext(b), /缺少应用证据不是自动重讲/);
  assert.match(renderContext(b), /用户主动要求复习/);
  assert.match(renderContext(b), /只跳过已覆盖范围；未覆盖的基础内容仍需解释/);
  assert.equal(ok(run(f, 'knowledge', undefined, ['--topic', '跨域'])).alreadyExplained, true);
});
test('候选与子概念不误跳过；应用与解释证据互不覆盖', t => {
  const f = fixture(t); f.call('init');
  f.call('record', { expectedRevision: 0, ...explanation,
    concepts: [...explanation.concepts, { id: 'cors-preflight', title: 'CORS 预检' }], links: [{ conceptId: 'cors-preflight', cardId: card.id }],
  });
  const fuzzy = f.call('knowledge', undefined, { topic: '资源' });
  assert.equal(fuzzy.alreadyExplained, false); assert.equal(fuzzy.guidance, 'resolve_concept');
  assert.equal(fuzzy.candidates[0].id, 'cors');
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors-preflight' }).alreadyExplained, false);
  rejects(() => f.call('record', { expectedRevision: 1, evidence: [{ ...explanation.evidence[0], kind: 'applied' }] }), 'INVALID_INPUT');
  f.call('record', { expectedRevision: 1, evidence: [{ ...explanation.evidence[0], id: 'cors-applied', kind: 'applied', summary: '用户独立修正来源并说明原因。' }] });
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).evidence.length, 2);
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
});
test('显式撤销只影响来源项目，保留应用证据及快照，全部解释撤销后可重新讲解', t => {
  const f = fixture(t), a = f.call('init'); f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, ...explanation, evidence: [...explanation.evidence, { ...explanation.evidence[0], id: 'cors-applied', kind: 'applied' }] });
  f.call('record', { expectedRevision: 0, ...explanation }, { cwd: f.b });
  const before = disk(f.root);
  rejects(() => f.call('record', { expectedRevision: 1, retractEvidence: ['cors-explained'], evidence: explanation.evidence }), 'INVALID_INPUT');
  rejects(() => f.call('record', { expectedRevision: 0, retractEvidence: ['cors-explained'] }), 'CONFLICT');
  assert.deepEqual(disk(f.root), before);
  assert.equal(f.call('record', { expectedRevision: 1, retractEvidence: ['cors-explained'] }).revision, 2);
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
  f.call('record', { expectedRevision: 1, retractEvidence: ['cors-explained'] }, { cwd: f.b });
  const knowledge = f.call('knowledge', undefined, { conceptId: 'cors' });
  assert.equal(knowledge.alreadyExplained, false); assert.equal(knowledge.guidance, 'not_recorded');
  assert.deepEqual(knowledge.evidence.map(value => value.kind), ['applied']);
  assert.equal(knowledge.links.length, 2);
  const snapshot = f.rows('SELECT * FROM snapshots').find(value => value.scope === `project:${a.projectId}` && value.revision === 1);
  assert.equal(JSON.parse(snapshot.content).evidence.length, 2);
  assert.equal(f.call('record', { expectedRevision: 2, retractEvidence: ['cors-explained'] }).changed, false);
  rejects(() => f.call('record', { expectedRevision: 2, evidence: explanation.evidence }), 'INVALID_INPUT');
  f.call('record', { expectedRevision: 2, evidence: [{ ...explanation.evidence[0], id: 'cors-corrected' }] });
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
});
test('未关联概念也可显式纠正别名，旧归属进快照，冲突和后续错误完整回滚', t => {
  const f = fixture(t); f.call('init'); const b = f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, ...explanation, concepts: [{ ...explanation.concepts[0], aliases: ['跨源配置'] }] });
  const correction = { removeAliases: [{ conceptId: 'cors', alias: ' 跨源配置 ' }], concepts: [{ id: 'cors-origin', title: '允许来源配置', aliases: ['跨源配置'] }] };
  f.call('record', { expectedRevision: 0, ...correction }, { cwd: f.b });
  assert.equal(f.call('knowledge', undefined, { topic: '跨源配置' }).conceptId, 'cors-origin');
  const snapshot = f.rows('SELECT * FROM snapshots').find(value => value.scope === `project:${b.projectId}` && value.revision === 0);
  assert.ok(JSON.parse(snapshot.content).concepts.find(value => value.id === 'cors').aliases.includes('跨源配置'));
  const before = disk(f.root);
  rejects(() => f.call('record', { expectedRevision: 1, ...correction }, { cwd: f.b }), 'CONCEPT_CONFLICT');
  rejects(() => f.call('record', { expectedRevision: 1, removeAliases: [{ conceptId: 'cors', alias: 'CORS' }] }), 'INVALID_INPUT');
  rejects(() => f.call('record', { expectedRevision: 1, ...correction, concepts: [{ ...explanation.concepts[0], aliases: ['跨源配置'] }] }), 'INVALID_INPUT');
  rejects(() => f.call('record', { expectedRevision: 1, removeAliases: [{ conceptId: 'cors', alias: ' 跨域 ' }, { conceptId: 'cors', alias: '跨域' }] }), 'INVALID_INPUT');
  rejects(() => f.call('record', { expectedRevision: 1, removeAliases: [{ conceptId: 'cors-origin', alias: '跨源配置' }], links: [{ cardId: 'missing', conceptId: 'cors-origin' }] }, { cwd: f.b }), 'INVALID_INPUT');
  assert.deepEqual(disk(f.root), before);
  assert.equal(f.call('record', { expectedRevision: 1, removeAliases: [{ conceptId: 'cors', alias: '不存在的别名' }] }).changed, false);
});
test('两跳查询有边界，循环、上限及截断可处理', t => {
  const f = fixture(t); f.call('init');
  f.call('record', { expectedRevision: 0,
    cards: [{ id: 'ab', title: 'AB', content: 'A 与 B' }, { id: 'bc', title: 'BC', content: 'B 与 C' }],
    concepts: ['a', 'b', 'c'].map(id => ({ id, title: id.toUpperCase() })),
    links: [{ cardId: 'ab', conceptId: 'a' }, { cardId: 'ab', conceptId: 'b' }, { cardId: 'bc', conceptId: 'b' }, { cardId: 'bc', conceptId: 'c' }],
  });
  assert.deepEqual(f.call('knowledge', undefined, { conceptId: 'a', depth: 1 }).concepts.map(value => value.id), ['a', 'b']);
  assert.deepEqual(f.call('knowledge', undefined, { conceptId: 'a', depth: 2 }).concepts.map(value => value.id), ['a', 'b', 'c']);
  assert.equal(f.call('knowledge', undefined, { conceptId: 'a', limit: 1 }).truncated, true);
  for (const options of [{ depth: 3 }, { limit: 0 }, { limit: 101 }, { depth: 1.5 }]) rejects(() => f.call('knowledge', undefined, { topic: 'A', ...options }), 'USAGE');
});
test('UTF-8/BOM 输入、稳定 ID 合并、全部决定恢复、读取不写入', t => {
  const f = fixture(t); ok(run(f, 'init'));
  ok(run(f, 'record', Buffer.from('\uFEFF' + JSON.stringify({ expectedRevision: 0, profile: '观察'.repeat(20_000), cards: [card], decisions: [decision, { ...decision, id: 'done', stage: 'completed' }] }), 'utf8')));
  f.call('record', { expectedRevision: 1, cards: [{ ...card, content: '更新已有卡' }, { id: 'other', title: '其他', content: 'OTHER_BODY_' + '内容'.repeat(20_000) }] });
  assert.equal(f.call('record', { expectedRevision: 2, cards: [{ ...card, content: '更新已有卡' }] }).changed, false);
  const before = disk(f.root);
  const value = f.call('context');
  assert.equal(value.pendingDecisions.length, 1); assert.equal(value.pendingDecisions[0].stage, 'implementation');
  assert.equal(value.cardIndex.length, 2); assert.ok(!renderContext(value).includes('OTHER_BODY_'));
  f.call('context', undefined, { topic: '未知主题' }); f.call('status');
  assert.deepEqual(disk(f.root), before);
});
test('暂停拒绝学习写入，恢复保留解释与待授权决定', t => {
  const f = fixture(t); f.call('init');
  f.call('record', { expectedRevision: 0, ...explanation, decisions: [decision] }); f.call('pause');
  const before = disk(f.root);
  rejects(() => f.call('record', { expectedRevision: 2, profile: '不能保存' }), 'PAUSED');
  assert.equal(f.call('context', undefined, { topic: 'CORS' }).mode, 'paused');
  assert.deepEqual(disk(f.root), before);
  assert.equal(f.call('resume').mode, 'active');
  assert.equal(f.call('context').pendingDecisions[0].stage, 'implementation');
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
});
test('通用档案必须标明活跃来源，暂停来源连相同内容也拒绝，其他项目继续写入', t => {
  const f = fixture(t); f.call('init'); f.call('init', undefined, { cwd: f.b });
  rejects(() => execute('record-user', { home: f.home }, { expectedRevision: 0, profile: '来源未知' }), 'USAGE');
  f.call('record-user', { expectedRevision: 0, profile: '使用中文' }); f.call('pause');
  const before = disk(f.root);
  for (const profile of ['使用中文', '暂停后不能新增']) rejects(() => f.call('record-user', { expectedRevision: 1, profile }), 'PAUSED');
  assert.deepEqual(disk(f.root), before);
  f.call('record-user', { expectedRevision: 1, profile: '使用中文；短摘要' }, { cwd: f.b });
  assert.equal(f.call('user').userRevision, 2); assert.equal(f.call('status').mode, 'paused');
  assert.equal(f.call('status', undefined, { cwd: f.b }).revision, 0);
  assert.equal(ok(run(f, 'record-user', { expectedRevision: 2, profile: 'CLI 来源验证' }, ['--cwd', f.b])).userRevision, 3);
});
test('新写入按 UTF-8 和 JSON 转义字节限额拒绝，旧大档案仍可缩短并留快照', t => {
  const f = fixture(t); f.call('init');
  const before = disk(f.root);
  for (const profile of ['中'.repeat(Math.floor(LIMITS.textBytes / 3) + 1), '\0'.repeat(LIMITS.textBytes)]) {
    rejects(() => f.call('record-user', { expectedRevision: 0, profile }), 'INPUT_TOO_LARGE');
  }
  assert.deepEqual(disk(f.root), before);
  const oldProfile = '历史'.repeat(LIMITS.textBytes);
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { db.prepare('UPDATE user_profile SET revision = 7, profile = ? WHERE id = 1').run(oldProfile); } finally { db.close(); }
  assert.equal(f.call('user').userProfile, oldProfile);
  assert.equal(f.call('record-user', { expectedRevision: 7, profile: '保留有效偏好摘要' }).userRevision, 8);
  assert.equal(JSON.parse(f.rows("SELECT content FROM snapshots WHERE scope = 'user'")[0].content).userProfile, oldProfile);
});
test('多批合法写入不能突破项目容量，超限时概念、修订和快照一起回滚', t => {
  const f = fixture(t); f.call('init');
  for (let n = 0; n < 3; n++) f.call('record', { expectedRevision: n, cards: [{ id: `card-${n}`, title: '案例', content: 'x'.repeat(LIMITS.textBytes) }] });
  const before = disk(f.root);
  rejects(() => f.call('record', { expectedRevision: 3, cards: [{ id: 'card-3', title: '新增', content: 'x'.repeat(LIMITS.textBytes) }], concepts: [{ id: 'rollback', title: '不得保留' }] }), 'INPUT_TOO_LARGE');
  assert.deepEqual(disk(f.root), before); assert.equal(f.call('status').revision, 3);
  assert.equal(f.rows('SELECT * FROM concepts').length, 0);
  assert.equal(f.call('record', { expectedRevision: 3, cards: [{ id: 'card-3', title: '新增', content: '简短摘要' }] }).revision, 4);
});
test('旧大项目允许缩减；精简暂停回执不截断未完成决定，完整历史仍可读', t => {
  const f = fixture(t), dir = path.join(f.a, '.vibemind'); fs.mkdirSync(dir);
  const legacy = { ...empty, projectMap: 'x'.repeat(LIMITS.stateBytes + 1000) };
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(legacy), 'utf8'); f.call('init');
  assert.equal(f.call('context').projectMap, legacy.projectMap);
  rejects(() => f.call('record', { expectedRevision: 0, profile: '不能增加容量' }), 'INPUT_TOO_LARGE');
  f.call('record', { expectedRevision: 0, projectMap: '已缩减的项目地图' });
  const oversized = { ...empty, revision: 2, decisions: [{ ...decision, content: 'x'.repeat(LIMITS.responseBytes) }] };
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { db.prepare('UPDATE projects SET state = ?').run(JSON.stringify(oversized)); } finally { db.close(); }
  assert.equal(f.call('pause').mode, 'paused');
  assert.equal(f.call('status').pendingDecisionCount, 1);
  assert.equal(f.call('context').mode, 'paused');
  assert.equal(f.call('context').pendingDecisions[0].content.length, LIMITS.responseBytes);
});
test('旧记录初始化响应超限时身份不被写入，旧文件和未完成决定保留', t => {
  const f = fixture(t), dir = path.join(f.a, '.vibemind'); fs.mkdirSync(dir);
  const bytes = JSON.stringify({ ...empty, decisions: [{ ...decision, content: 'x'.repeat(LIMITS.responseBytes) }] });
  fs.writeFileSync(path.join(dir, 'state.json'), bytes, 'utf8');
  rejects(() => f.call('init'), 'RESPONSE_TOO_LARGE');
  assert.deepEqual(fs.readdirSync(dir), ['state.json']);
  assert.equal(fs.readFileSync(path.join(dir, 'state.json'), 'utf8'), bytes);
  assert.deepEqual(f.call('projects').projects, []);
});
test('失败事务回滚概念、证据、项目及快照，非法输入无变更', t => {
  const f = fixture(t); f.call('init'); f.call('record', { expectedRevision: 0, ...explanation });
  const before = disk(f.root);
  rejects(() => f.call('record', { expectedRevision: 1, profile: '不能保留', concepts: [{ id: 'new', title: '新概念', aliases: ['CORS'] }] }), 'CONCEPT_CONFLICT');
  rejects(() => f.call('record', { expectedRevision: 1, concepts: [{ id: 'orphan', title: '孤儿' }], evidence: [{ ...explanation.evidence[0], id: 'invalid', conceptId: 'orphan', cardId: 'missing' }] }), 'INVALID_INPUT');
  const invalid = [{ expectedRevision: 0, profile: '旧版本' }, { expectedRevision: 1 }, { expectedRevision: 1, mode: 'active' }, { expectedRevision: 1, cards: [card, card] }, { expectedRevision: 1, decisions: [{ ...decision, stage: 'approved' }] }];
  for (const input of invalid) rejects(() => f.call('record', input), input.expectedRevision === 0 ? 'CONFLICT' : 'INVALID_INPUT');
  assert.deepEqual(disk(f.root), before); assert.equal(f.rows('SELECT * FROM concepts').length, 1);
  assert.equal(JSON.parse(f.rows('SELECT content FROM snapshots')[0].content).state.revision, 0);
});
test('迁移保留旧 JSON/BOM/备份、暂停与决定；不自动提升为通用档案', t => {
  const f = fixture(t), dir = path.join(f.a, '.vibemind');
  fs.mkdirSync(path.join(dir, 'backups'), { recursive: true });
  const bytes = Buffer.from('\uFEFF' + JSON.stringify({ ...empty, revision: 7, mode: 'paused', profile: '此项目观察', cards: [card], decisions: [decision] }), 'utf8');
  fs.writeFileSync(path.join(dir, 'state.json'), bytes); fs.writeFileSync(path.join(dir, 'backups', 'old.json'), bytes);
  assert.equal(f.call('status').migrationRequired, true); assert.equal(fs.existsSync(f.home), false);
  assert.equal(f.call('init').revision, 7); assert.equal(f.call('init').mode, 'paused');
  const value = f.call('context', undefined, { topic: 'CORS' });
  assert.equal(value.userProfile, ''); assert.equal(value.profile, '此项目观察');
  assert.equal(value.learning.alreadyExplained, false); assert.equal(value.learning.needsLegacyReview, true);
  assert.equal(value.learning.legacyCards[0].content, card.content);
  assert.deepEqual(fs.readFileSync(path.join(dir, 'state.json')), bytes); assert.deepEqual(fs.readFileSync(path.join(dir, 'backups', 'old.json')), bytes);
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(empty), 'utf8');
  rejects(() => f.call('init'), 'LEGACY_CHANGED'); rejects(() => f.call('context'), 'LEGACY_CHANGED');
});
test('损坏、未知版本及无效 UTF-8 旧记录拒绝迁移，不重置', t => {
  const f = fixture(t); fs.mkdirSync(path.join(f.a, '.vibemind'));
  for (const [bytes, code] of [[Buffer.from('{bad', 'utf8'), 'INVALID_STATE'], [Buffer.from([0xff]), 'INVALID_STATE'], [Buffer.from(JSON.stringify({ ...empty, schemaVersion: 2 }), 'utf8'), 'UNSUPPORTED_SCHEMA']]) {
    fs.writeFileSync(path.join(f.a, '.vibemind', 'state.json'), bytes); rejects(() => f.call('init'), code);
    assert.equal(fs.existsSync(f.home), false); assert.equal(fs.existsSync(path.join(f.a, '.vibemind', 'project.json')), false);
    assert.deepEqual(fs.readFileSync(path.join(f.a, '.vibemind', 'state.json')), bytes);
  }
});
test('移动接续、复制需新身份；删除目录仍按 ID 查看历史', t => {
  const f = fixture(t), initial = f.call('init'); f.call('record', { expectedRevision: 0, ...explanation });
  const moved = path.join(f.root, '移动项目'); fs.renameSync(f.a, moved);
  assert.equal(f.call('context', undefined, { cwd: moved }).revision, 1);
  assert.equal(f.call('init', undefined, { cwd: moved }).projectId, initial.projectId);
  const copy = path.join(f.root, '复制项目');
  fs.mkdirSync(path.join(copy, '.git'), { recursive: true });
  fs.mkdirSync(path.join(copy, '.vibemind'));
  fs.copyFileSync(path.join(moved, '.vibemind', 'project.json'), path.join(copy, '.vibemind', 'project.json'));
  rejects(() => f.call('context', undefined, { cwd: copy }), 'PROJECT_ID_CONFLICT');
  rejects(() => f.call('init', undefined, { cwd: copy }), 'PROJECT_ID_CONFLICT');
  assert.notEqual(f.call('init', undefined, { cwd: copy, newProject: true }).projectId, initial.projectId);
  assert.equal(f.call('context', undefined, { cwd: copy }).cardIndex.length, 0);
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
  assert.equal(f.call('projects').projects.length, 2);
  assert.ok(moved.startsWith(f.root + path.sep)); fs.rmSync(moved, { recursive: true });
  assert.equal(f.call('context', undefined, { projectId: initial.projectId }).cardIndex.length, 1);
  rejects(() => f.call('record', { expectedRevision: 1, profile: '非法目标' }, { projectId: initial.projectId }), 'USAGE');
});
test('移动后的旧路径被无关目录和不同项目复用时仍按原身份接续', t => {
  const f = fixture(t), initial = f.call('init'); f.call('record', { expectedRevision: 0, ...explanation });
  const moved = path.join(f.root, '移动后的项目'); fs.renameSync(f.a, moved); fs.mkdirSync(f.a);
  for (const command of ['status', 'context']) assert.equal(f.call(command, undefined, { cwd: moved }).revision, 1);
  const other = f.call('init', undefined, { newProject: true }); assert.notEqual(other.projectId, initial.projectId);
  assert.equal(f.call('init', undefined, { cwd: moved }).projectId, initial.projectId);
  assert.equal(f.call('context', undefined, { cwd: moved }).learning, undefined);
  assert.equal(f.call('context', undefined, { cwd: moved, topic: 'CORS' }).learning.alreadyExplained, true);
});
test('源码子目录恢复；嵌套 Git、worktree、更近半初始化目录隔离', t => {
  const f = fixture(t); f.call('init');
  const source = path.join(f.a, 'src', 'api'); fs.mkdirSync(source, { recursive: true });
  assert.equal(locate(source).project, f.a);
  const nested = path.join(source, 'nested'); fs.mkdirSync(path.join(nested, '.git'), { recursive: true });
  assert.equal(f.call('status', undefined, { cwd: nested }).initialized, false);
  const worktree = path.join(f.a, 'worktree'); fs.mkdirSync(worktree); fs.writeFileSync(path.join(worktree, '.git'), 'gitdir: unused\n', 'utf8');
  assert.equal(f.call('status', undefined, { cwd: worktree }).initialized, false);
  const child = path.join(f.a, 'child'); fs.mkdirSync(path.join(child, '.vibemind'), { recursive: true });
  assert.equal(f.call('status', undefined, { cwd: child }).initialized, false);
});
test('符号链接目录和损坏数据库拒绝访问，外部数据不变', t => {
  const f = fixture(t), outside = path.join(f.root, 'outside');
  fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'sentinel'), '保持', 'utf8');
  fs.symlinkSync(outside, path.join(f.a, '.vibemind'), 'junction'); rejects(() => f.call('init'), 'UNSAFE_PATH');
  fs.symlinkSync(outside, f.home, 'junction'); rejects(() => f.call('user'), 'UNSAFE_PATH');
  assert.deepEqual(fs.readdirSync(outside), ['sentinel']);
  const badHome = path.join(f.root, 'bad-db'); fs.mkdirSync(badHome); fs.writeFileSync(path.join(badHome, 'memory.sqlite'), '损坏数据库', 'utf8');
  rejects(() => execute('record-user', { home: badHome, cwd: f.b }, { expectedRevision: 0, expectedStoreId: randomUUID(), expectedProjectId: randomUUID(), operationId: randomUUID(), profile: '不能重置' }), 'INVALID_DATABASE');
  assert.equal(fs.readFileSync(path.join(badHome, 'memory.sqlite'), 'utf8'), '损坏数据库');
});
test('身份原子替换失败和初始化锁不能绕过，失败可重试', t => {
  const f = fixture(t), rename = fs.renameSync;
  fs.renameSync = () => { throw new Error('模拟身份替换失败'); };
  try { rejects(() => f.call('init'), 'WRITE_FAILED'); } finally { fs.renameSync = rename; }
  assert.deepEqual(fs.readdirSync(path.join(f.a, '.vibemind')), []);
  assert.deepEqual(f.call('projects').projects, []);
  f.call('init'); fs.writeFileSync(path.join(f.a, '.vibemind', '.lock'), JSON.stringify({ pid: process.pid }), 'utf8');
  rejects(() => f.call('init'), 'LOCKED'); assert.equal(f.call('status').locked, true);
});
test('在线备份可重新打开读取；已有目的文件不被覆盖', async t => {
  const f = fixture(t); f.call('init'); f.call('record', { expectedRevision: 0, ...explanation });
  const output = path.join(f.root, '独立备份.sqlite'); await f.call('backup', undefined, { output });
  const db = new DatabaseSync(output, { readOnly: true });
  try {
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM evidence').get().n, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM snapshots').get().n, 1);
  } finally { db.close(); }
  const bytes = fs.readFileSync(output);
  await assert.rejects(f.call('backup', undefined, { output }), error => error.code === 'BACKUP_FAILED');
  assert.deepEqual(fs.readFileSync(output), bytes);
});
test('CLI 参数/编码、junction 安装和 stdin 导入正确', t => {
  const f = fixture(t), before = disk(f.root);
  rejected(run(f, 'init', undefined, ['--topic', '错误']), 'USAGE'); rejected(run(f, 'invalid'), 'USAGE');
  rejected(run(f, 'record', Buffer.from([0xff])), 'INVALID_INPUT');
  rejected(run(f, 'knowledge', undefined, ['--topic', 'CORS', '--limit', 'NaN']), 'USAGE');
  assert.deepEqual(disk(f.root), before);
  const installed = path.join(f.root, '技能安装'); fs.symlinkSync(path.dirname(script), installed, 'junction');
  ok(run(f, 'init', undefined, [], path.join(installed, 'vibemind.mjs')));
  const program = `import { locate } from ${JSON.stringify(pathToFileURL(script).href)}; process.stdout.write(JSON.stringify(locate(process.argv[2])));`;
  const value = spawnSync(process.execPath, ['--input-type=module', '-', f.a], { input: program, encoding: 'utf8', timeout: 10_000 });
  assert.equal(value.status, 0, value.stderr); assert.equal(JSON.parse(value.stdout).project, f.a);
});
test('两个 CLI 进程旧版本提交一个成功，另一个拒绝；重读后合并', async t => {
  const f = fixture(t); f.call('init');
  const writer = profile => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, 'record', '--cwd', f.a], { env: { ...process.env, VIBEMIND_HOME: f.home } });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', value => { stdout += value; }); child.stderr.setEncoding('utf8').on('data', value => { stderr += value; });
    child.once('error', reject); child.once('close', status => resolve({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify(f.input({ expectedRevision: 0, profile })), 'utf8');
  });
  const results = await Promise.all(['一', '二'].map(writer));
  assert.equal(results.filter(value => value.status === 0).length, 1); rejected(results.find(value => value.status === 1), 'CONFLICT');
  const current = f.call('context'); f.call('record', { expectedRevision: current.revision, profile: current.profile + '；已整合' });
  assert.equal(f.call('context').revision, 2);
});

test('首次数据库被两个项目进程同时初始化时，两份身份和记录均保留', async t => {
  const f = fixture(t);
  const initialize = cwd => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, 'init', '--cwd', cwd], { env: { ...process.env, VIBEMIND_HOME: f.home } });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', value => { stdout += value; }); child.stderr.setEncoding('utf8').on('data', value => { stderr += value; });
    child.once('error', reject); child.once('close', status => resolve({ status, stdout, stderr })); child.stdin.end();
  });
  const values = (await Promise.all([f.a, f.b].map(initialize))).map(ok);
  assert.notEqual(values[0].projectId, values[1].projectId);
  assert.equal(f.call('projects').projects.length, 2);
});

test('同项目首次初始化竞争只产生一个身份，冲突结束后幂等接续', async t => {
  const f = fixture(t);
  const initialize = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, 'init', '--cwd', f.a], { env: { ...process.env, VIBEMIND_HOME: f.home } });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', value => { stdout += value; }); child.stderr.setEncoding('utf8').on('data', value => { stderr += value; });
    child.once('error', reject); child.once('close', status => resolve({ status, stdout, stderr })); child.stdin.end();
  });
  const results = await Promise.all([initialize(), initialize()]);
  const successful = results.filter(value => value.status === 0).map(ok);
  assert.ok(successful.length >= 1);
  for (const result of results.filter(value => value.status !== 0)) rejected(result, 'LOCKED');
  const current = execute('init', { cwd: f.a, home: f.home });
  assert.ok(successful.every(value => value.projectId === current.projectId && value.storeId === current.storeId));
  assert.equal(f.rows('SELECT * FROM projects').length, 1);
  const identityFile = path.join(f.a, '.vibemind', 'project.json');
  const before = fs.readFileSync(identityFile);
  fs.unlinkSync(identityFile);
  const attached = execute('init', { cwd: f.a, home: f.home, attachProjectId: current.projectId.toUpperCase() });
  assert.equal(attached.projectId, current.projectId); assert.deepEqual(fs.readFileSync(identityFile), before);
});

test('明确建立独立身份后，同路径旧历史不会阻断新项目幂等接续', t => {
  const f = fixture(t), old = f.call('init');
  f.call('record', { expectedRevision: 0, cards: [card] });
  fs.unlinkSync(path.join(f.a, '.vibemind', 'project.json'));
  const current = f.call('init', undefined, { newProject: true });
  assert.notEqual(current.projectId, old.projectId); assert.equal(current.revision, 0);
  assert.equal(f.call('init').projectId, current.projectId);
  assert.equal(f.call('context', undefined, { projectId: old.projectId }).cardIndex.length, 1);
  assert.equal(f.call('projects').projects.length, 2);
});

test('旧中文卡按明确英文 ID 核对后补充解释事实，不自动判为已解释', t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.a, '.vibemind'));
  const legacyCard = { id: 'old-card', title: '跨域', content: '已解释同源限制与允许来源；用户独立应用未知。' };
  fs.writeFileSync(path.join(f.a, '.vibemind', 'state.json'), JSON.stringify({ ...empty, cards: [legacyCard] }), 'utf8');
  f.call('init'); f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, concepts: explanation.concepts }, { cwd: f.b });
  const pending = f.call('knowledge', undefined, { conceptId: 'cors' });
  assert.equal(pending.needsLegacyReview, true); assert.equal(pending.alreadyExplained, false);
  assert.equal(pending.legacyCards[0].content, legacyCard.content);
  f.call('record', { expectedRevision: 0, evidence: [{ ...explanation.evidence[0], cardId: legacyCard.id, summary: '已核对旧卡明确记录的实际讲解范围。' }] });
  assert.equal(f.call('context', undefined, { cwd: f.b, conceptId: 'cors' }).learning.alreadyExplained, true);
});

test('损坏身份不重置，合法 UUID 大小写一致，未知数据库版本保留', t => {
  const f = fixture(t), initial = f.call('init'), file = path.join(f.a, '.vibemind', 'project.json');
  fs.writeFileSync(file, JSON.stringify({ schemaVersion: 1, projectId: initial.projectId.toUpperCase() }), 'utf8');
  assert.equal(f.call('status').projectId, initial.projectId);
  fs.writeFileSync(file, '{bad identity', 'utf8');
  const before = disk(f.root);
  rejects(() => f.call('init'), 'INVALID_IDENTITY'); rejects(() => f.call('context'), 'INVALID_IDENTITY');
  assert.deepEqual(disk(f.root), before);
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  db.exec('PRAGMA user_version = 99'); db.close();
  const bytes = fs.readFileSync(path.join(f.home, 'memory.sqlite'));
  rejects(() => f.call('user'), 'UNSUPPORTED_DATABASE');
  assert.deepEqual(fs.readFileSync(path.join(f.home, 'memory.sqlite')), bytes);
});

test('后来安装不同目录的 CLI，仍接续同一库并保持暂停', t => {
  const f = fixture(t), original = f.call('init');
  f.call('record', { expectedRevision: 0, ...explanation }); f.call('pause');
  const later = path.join(f.root, 'later-host.mjs');
  fs.writeFileSync(later, fs.readFileSync(script, 'utf8'), 'utf8');
  const current = ok(run(f, 'context', undefined, ['--cwd', f.a, '--json'], later));
  assert.equal(current.storeId, original.storeId);
  assert.equal(current.projectId, original.projectId);
  assert.equal(current.mode, 'paused');
  assert.equal(current.cardIndex.length, 1);
  assert.equal(f.call('init').changed, false);
});

test('已有项目切到不存在或错误库，不空建也不替换身份', t => {
  const f = fixture(t); f.call('init'); f.call('record', { expectedRevision: 0, ...explanation });
  const wrongHome = path.join(f.root, 'wrong-memory'), before = disk(f.root);
  rejects(() => execute('init', { home: wrongHome, cwd: f.a }), 'MEMORY_NOT_FOUND');
  assert.deepEqual(disk(f.root), before);
  const other = f.makeProject('other-store-project');
  execute('init', { home: wrongHome, cwd: other });
  const wrongBefore = disk(f.root);
  assert.equal(execute('status', { home: wrongHome, cwd: f.a }).reason, 'store_mismatch');
  rejects(() => execute('init', { home: wrongHome, cwd: f.a }), 'STORE_MISMATCH');
  rejects(() => execute('record', { home: wrongHome, cwd: f.a }, f.input({ profile: '不能误写' })), 'STORE_MISMATCH');
  assert.deepEqual(disk(f.root), wrongBefore);
  assert.equal(f.call('context').cardIndex.length, 1);
});

test('项目事务失败仅留下恢复计划；重试不遗留孤立身份', t => {
  const f = fixture(t); f.call('init');
  const c = f.makeProject('incomplete');
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { db.exec("CREATE TRIGGER reject_project BEFORE INSERT ON projects BEGIN SELECT RAISE(ABORT, 'injected'); END;"); }
  finally { db.close(); }
  rejects(() => execute('init', { home: f.home, cwd: c }), 'INVALID_DATABASE');
  assert.equal(fs.existsSync(path.join(c, '.vibemind', 'project.json')), false);
  assert.equal(execute('status', { home: f.home, cwd: c }).reason, 'initialization_pending');
  assert.equal(f.call('projects').projects.length, 1);
  const repair = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { repair.exec('DROP TRIGGER reject_project'); } finally { repair.close(); }
  assert.equal(execute('init', { home: f.home, cwd: c }).initialized, true);
  assert.equal(fs.existsSync(path.join(c, '.vibemind', 'init.pending.json')), false);
});

test('数据库提交后身份发布失败，init 接续同一已提交项目', t => {
  const f = fixture(t); f.call('init');
  const c = f.makeProject('committed-before-identity'), rename = fs.renameSync;
  fs.renameSync = (from, to) => {
    if (to === path.join(c, '.vibemind', 'project.json')) throw new Error('injected identity publish failure');
    return rename(from, to);
  };
  try { rejects(() => execute('init', { home: f.home, cwd: c }), 'WRITE_FAILED'); }
  finally { fs.renameSync = rename; }
  const pending = JSON.parse(fs.readFileSync(path.join(c, '.vibemind', 'init.pending.json'), 'utf8'));
  assert.equal(f.call('projects').projects.length, 2);
  assert.equal(execute('status', { home: f.home, cwd: c }).initializationPending, true);
  const recovered = execute('init', { home: f.home, cwd: c });
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.projectId, pending.projectId);
  assert.equal(f.call('projects').projects.length, 2);
});

test('恢复计划期间身份被别人改写，拒绝覆盖新身份', t => {
  const f = fixture(t); f.call('init');
  const c = f.makeProject('changed-identity'), rename = fs.renameSync;
  fs.renameSync = (from, to) => {
    if (to === path.join(c, '.vibemind', 'project.json')) throw new Error('injected');
    return rename(from, to);
  };
  try { rejects(() => execute('init', { home: f.home, cwd: c }), 'WRITE_FAILED'); } finally { fs.renameSync = rename; }
  fs.writeFileSync(path.join(c, '.vibemind', 'project.json'), JSON.stringify({ schemaVersion: 1, projectId: randomUUID() }), 'utf8');
  const before = disk(f.root);
  rejects(() => execute('init', { home: f.home, cwd: c }), 'INIT_RECOVERY_REQUIRED');
  assert.deepEqual(disk(f.root), before);
});

test('迟到的恢复被版本拒绝；旧暂停回执重试不翻转当前模式', t => {
  const f = fixture(t); f.call('init');
  const oldResume = f.input(), pauseRequest = f.input();
  execute('pause', { home: f.home, cwd: f.a }, pauseRequest);
  rejects(() => execute('resume', { home: f.home, cwd: f.a }, oldResume), 'CONFLICT');
  assert.equal(f.call('status').mode, 'paused');
  f.call('resume');
  const replay = execute('pause', { home: f.home, cwd: f.a }, pauseRequest);
  assert.equal(replay.replayed, true);
  assert.equal(f.call('status').mode, 'active');
  assert.equal(f.call('status').revision, 2);
});

test('丢响应重试返回同一提交回执，字段顺序/UUID大小写不造成重复', t => {
  const f = fixture(t); f.call('init');
  const request = f.input({ expectedRevision: 0, profile: '一次提交', source: { host: 'codex', taskId: 'one' } });
  const first = execute('record', { home: f.home, cwd: f.a }, request);
  const reordered = Object.fromEntries(Object.entries(request).reverse());
  reordered.operationId = reordered.operationId.toUpperCase();
  reordered.expectedStoreId = reordered.expectedStoreId.toUpperCase();
  const repeated = execute('record', { home: f.home, cwd: f.a }, reordered);
  assert.equal(repeated.replayed, true); assert.equal(repeated.revision, first.revision);
  assert.equal(f.rows('SELECT * FROM snapshots').length, 1);
  assert.equal(f.rows('SELECT * FROM operations').length, 1);
  assert.equal(f.call('operation', undefined, { operationId: request.operationId }).receipt.revision, 1);
  rejects(() => execute('record', { home: f.home, cwd: f.a }, { ...request, profile: '不同内容' }), 'OPERATION_ID_CONFLICT');
  assert.equal(f.call('context').profile, '一次提交');
});

test('冲突可定位知识卡，get 只读返回完整正文与当前版本', t => {
  const f = fixture(t); f.call('init');
  f.call('record', { expectedRevision: 0, cards: [card] });
  const stale = f.input({ cards: [{ ...card, content: '旧会话修改' }] });
  f.call('record', { expectedRevision: 1, cards: [{ ...card, content: '另一宿主新增事实' }] });
  assert.throws(() => execute('record', { home: f.home, cwd: f.a }, stale), error => error.code === 'CONFLICT' && error.details.recordIds[0] === card.id);
  const before = disk(f.root), current = f.call('get', undefined, { kind: 'card', id: card.id });
  assert.equal(current.record.content, '另一宿主新增事实');
  assert.equal(current.revision, 2);
  assert.deepEqual(disk(f.root), before);
});

test('跨项目别名纠错检查图谱版本，不用项目 revision 掩盖全局竞争', t => {
  const f = fixture(t); f.call('init'); f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, ...explanation });
  const stale = f.input({ removeAliases: [{ conceptId: 'cors', alias: '跨域' }], expectedGraphRevision: f.call('status').graphRevision }, f.b);
  f.call('record', { expectedRevision: 1, concepts: [{ id: 'another', title: '另一个概念' }] });
  rejects(() => execute('record', { home: f.home, cwd: f.b }, stale), 'GRAPH_CONFLICT');
  assert.equal(f.call('knowledge', undefined, { topic: '跨域' }).conceptId, 'cors');
});

test('坏项目独立报告；doctor/status 精简且健康项目仍可发现', t => {
  const f = fixture(t), good = f.call('init'), bad = f.call('init', undefined, { cwd: f.b });
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { db.prepare('UPDATE projects SET state=? WHERE id=?').run('{}', bad.projectId); } finally { db.close(); }
  const list = f.call('projects');
  assert.equal(list.errors.length, 1); assert.equal(list.errors[0].projectId, bad.projectId);
  assert.equal(list.projects.find(value => value.projectId === good.projectId).initialized, true);
  assert.equal(f.call('doctor', undefined, { cwd: f.b }).projectStatus.error.code, 'UNSUPPORTED_SCHEMA');
  assert.equal(f.call('doctor').counts.projects, 2);
});

test('默认摘要共享不泄露正文/路径；私有项目及别名不进入其他项目查询', t => {
  const f = fixture(t), a = f.call('init', undefined, { sharing: 'summary' });
  f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, ...explanation, cards: [{ ...card, content: 'PRIVATE_CASE_BODY' }], concepts: [{ ...explanation.concepts[0], aliases: ['CORS', '跨域', 'PRIVATE_ALIAS'] }] });
  const shared = f.call('context', undefined, { cwd: f.b, topic: 'CORS' }).learning;
  assert.equal(shared.alreadyExplained, true); assert.equal(shared.cards.length, 0);
  assert.equal(shared.explanationSummaries[0].codeLocation, undefined);
  assert.equal(shared.explanationSummaries[0].project, undefined);
  assert.ok(!JSON.stringify(shared).includes('PRIVATE_CASE_BODY'));
  assert.equal(f.call('context', undefined, { topic: 'CORS' }).learning.cards[0].content, 'PRIVATE_CASE_BODY');
  f.call('record', { expectedRevision: 1, sharing: 'private' });
  assert.equal(f.call('knowledge', undefined, { topic: 'CORS' }).conceptId, null);
  assert.equal(f.call('knowledge', undefined, { topic: 'PRIVATE_ALIAS' }).conceptId, null);
  assert.equal(f.call('knowledge', undefined, { cwd: f.a, topic: 'CORS' }).alreadyExplained, true);
  f.call('record', { expectedRevision: 0, concepts: explanation.concepts }, { cwd: f.b });
  assert.equal(f.call('knowledge', undefined, { topic: 'PRIVATE_ALIAS' }).conceptId, null);
  const bSnapshot = f.call('get', undefined, { cwd: f.b, kind: 'snapshot', id: '0' });
  assert.ok(!JSON.stringify(bSnapshot.record).includes('PRIVATE_ALIAS'));
  assert.equal(a.sharing, 'summary');
});

test('精确概念历史超过100条可稳定分页，并发新增不导致漏读/重复', t => {
  const f = fixture(t); f.call('init');
  const evidence = Array.from({ length: 130 }, (_, n) => ({ ...explanation.evidence[0], id: 'event-' + n, scope: '范围 ' + n }));
  f.call('record', { expectedRevision: 0, ...explanation, evidence });
  const first = f.call('history', undefined, { conceptId: 'cors', limit: 100 });
  assert.equal(first.evidence.length, 100); assert.ok(first.nextCursor);
  f.call('record', { expectedRevision: 1, evidence: [{ ...explanation.evidence[0], id: 'new-during-paging' }] });
  const next = f.call('history', undefined, { conceptId: 'cors', limit: 100, cursor: first.nextCursor });
  const ids = [...first.evidence, ...next.evidence].map(value => value.id);
  assert.equal(ids.length, 130); assert.equal(new Set(ids).size, 130);
  assert.ok(!ids.includes('new-during-paging')); assert.equal(next.nextCursor, null);
  const coverage = f.call('knowledge', undefined, { conceptId: 'cors', limit: 20 });
  assert.ok(coverage.explanationNextCursor);
  const scopes = f.call('history', undefined, { conceptId: 'cors', cursor: coverage.explanationNextCursor });
  assert.equal(scopes.evidence[0].sequence, coverage.explanationSummaries.at(-1).sequence - 1);
  rejects(() => f.call('history', undefined, { cwd: f.a, conceptId: 'cors', cursor: first.nextCursor }), 'INVALID_CURSOR');
});

test('跨来源更正已删除目录的暂停项目，保留应用证据/修订和真实更正来源', t => {
  const f = fixture(t), a = f.call('init'), b = f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, ...explanation, evidence: [...explanation.evidence, { ...explanation.evidence[0], id: 'applied', kind: 'applied' }] });
  f.call('pause');
  assert.equal(path.dirname(f.a), f.root); fs.rmSync(f.a, { recursive: true, force: true });
  f.call('correct', { expectedRevision: 0, originProjectId: a.projectId, expectedOriginRevision: 2, retractEvidence: ['cors-explained'], source: { host: 'workbuddy' } }, { cwd: f.b });
  const restored = f.call('context', undefined, { projectId: a.projectId });
  assert.equal(restored.mode, 'paused'); assert.equal(restored.revision, 3);
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, false);
  assert.equal(f.rows('SELECT * FROM evidence')[0].kind, 'applied');
  const history = f.call('get', undefined, { projectId: a.projectId, kind: 'snapshot', id: '2' }).record;
  assert.equal(history.source.host, 'workbuddy'); assert.equal(history.source.projectId, b.projectId);
});

test('确认项目 purge 删除正文/修订/旧回执，其他项目和通用图谱保留', t => {
  const f = fixture(t), a = f.call('init'), b = f.call('init', undefined, { cwd: f.b });
  f.call('record', { expectedRevision: 0, ...explanation });
  f.call('record', { expectedRevision: 0, ...explanation }, { cwd: f.b });
  f.call('record-user', { expectedRevision: 0, profile: '待删除通用档案' });
  const request = f.input({ originProjectId: a.projectId, expectedOriginRevision: 1, confirmProjectId: a.projectId, forgetUserProfile: true, expectedUserRevision: 1 }, f.b);
  rejects(() => execute('purge', { home: f.home, cwd: f.b }, { ...request, confirmProjectId: b.projectId }), 'INVALID_INPUT');
  const result = execute('purge', { home: f.home, cwd: f.b }, request);
  assert.equal(result.purged, true); assert.equal(f.call('user').userProfile, '');
  assert.equal(f.rows('SELECT * FROM projects').length, 1);
  assert.equal(f.rows('SELECT * FROM snapshots').some(row => row.scope === 'project:' + a.projectId || row.scope === 'user'), false);
  assert.equal(f.call('context', undefined, { cwd: f.b }).cardIndex.length, 1);
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
  assert.equal(execute('purge', { home: f.home, cwd: f.b }, request).replayed, true);
  assert.equal(f.call('status').reason, 'missing_project_record');
  rejects(() => f.call('init'), 'MISSING_PROJECT_RECORD');
});

test('用户配置被后来宿主复用，环境覆盖可诊断且不会静默分库', t => {
  const f = fixture(t), original = f.call('init'), configFile = path.join(f.root, 'user-config.json');
  execute('configure', { configFile, memoryHome: f.home });
  const previous = process.env.VIBEMIND_HOME;
  try {
    delete process.env.VIBEMIND_HOME;
    const shared = execute('status', { cwd: f.a, configFile });
    assert.equal(shared.storeId, original.storeId); assert.equal(shared.storageSource, 'config');
    process.env.VIBEMIND_HOME = path.join(f.root, 'wrong-override');
    const wrong = execute('status', { cwd: f.a, configFile });
    assert.equal(wrong.storageSource, 'environment'); assert.equal(wrong.initialized, false);
    rejects(() => execute('init', { cwd: f.a, configFile }), 'MEMORY_NOT_FOUND');
  } finally { if (previous === undefined) delete process.env.VIBEMIND_HOME; else process.env.VIBEMIND_HOME = previous; }
});

test('用户级存储目录不被无Git子目录误识别为项目；写入必须明确绝对cwd', t => {
  const f = fixture(t), parent = path.join(f.root, 'no-git-parent'), child = path.join(parent, 'child');
  fs.mkdirSync(path.join(parent, '.vibemind'), { recursive: true }); fs.mkdirSync(child);
  fs.writeFileSync(path.join(parent, '.vibemind', 'memory.sqlite'), 'storage marker', 'utf8');
  assert.equal(locate(child).project, child);
  rejects(() => execute('init', { home: f.home, cwd: parent }), 'DATA_DIRECTORY_AS_PROJECT');
  rejects(() => execute('init', { home: f.home }), 'USAGE');
  rejects(() => execute('init', { home: f.home, cwd: '.' }), 'USAGE');
});

test('初始化遗留锁只清理确认退出且token匹配的进程，存活锁保留', t => {
  const f = fixture(t); f.call('init');
  const file = path.join(f.a, '.vibemind', '.lock'), token = randomUUID();
  fs.writeFileSync(file, JSON.stringify({ pid: process.pid, token }), 'utf8');
  rejects(() => execute('recover-lock', { cwd: f.a, lockToken: token }), 'LOCKED');
  fs.writeFileSync(file, JSON.stringify({ pid: 2147483647, token }), 'utf8');
  assert.equal(f.call('doctor', undefined, { cwd: f.a }).projectStatus.initializationLock.processState, 'missing');
  rejects(() => execute('recover-lock', { cwd: f.a, lockToken: randomUUID() }), 'LOCKED');
  assert.equal(execute('recover-lock', { cwd: f.a, lockToken: token }).cleared, true);
});

test('通用档案保留更新来源，无变化的观察不伪造最近修改来源', t => {
  const f = fixture(t), a = f.call('init');
  f.call('record-user', { expectedRevision: 0, profile: '中文', source: { host: 'codex', taskId: 'first' } });
  f.call('record-user', { expectedRevision: 1, profile: '中文', source: { host: 'workbuddy', taskId: 'noop' } });
  assert.equal(f.call('user').userSource.host, 'codex');
  assert.equal(f.call('user').userSource.projectId, a.projectId);
  assert.equal(JSON.parse(f.rows("SELECT * FROM snapshots WHERE scope='user'")[0].content).source.taskId, 'first');
});

test('stdin提前限额，超大输入未创建记录或回执', t => {
  const f = fixture(t); f.call('init');
  const before = disk(f.root);
  const value = spawnSync(process.execPath, [script, 'record', '--cwd', f.a], {
    env: { ...process.env, VIBEMIND_HOME: f.home }, encoding: 'utf8', timeout: 10_000,
    input: JSON.stringify({ ...f.input({ profile: 'x'.repeat(LIMITS.patchBytes + 100_000) }) }),
  });
  assert.equal(value.status, 1);
  assert.match(value.stderr, /INPUT_TOO_LARGE/);
  assert.deepEqual(disk(f.root), before);
});

function legacyClient(t, f, commit) {
  const source = spawnSync('git', ['show', commit + ':skills/vibemind/scripts/vibemind.mjs'], { cwd: path.dirname(path.dirname(script)), encoding: 'utf8' });
  if (source.status !== 0) { t.skip('当前 checkout 没有旧版 Git 源码'); return null; }
  const file = path.join(f.root, 'legacy-' + commit + '.mjs');
  fs.writeFileSync(file, source.stdout, 'utf8');
  return (command, input, flags = ['--cwd', f.a]) => spawnSync(process.execPath, [file, command, ...flags], { env: { ...process.env, VIBEMIND_HOME: f.home }, input: input === undefined ? undefined : JSON.stringify(input), encoding: 'utf8', timeout: 10_000 });
}

test('旧0.2客户端对格式2拒写，无法绕过来源或暂停规则', t => {
  const f = fixture(t); f.call('init'); f.call('pause');
  const old = legacyClient(t, f, 'f767dc0'); if (!old) return;
  const before = disk(f.root);
  rejected(old('record-user', { expectedRevision: 0, profile: '绕过检查' }, []), 'UNSUPPORTED_DATABASE');
  assert.deepEqual(disk(f.root), before);
});

test('格式1在线备份升级保留项目/用户/证据，旧写入器拒绝，新绑定保持暂停', async t => {
  const f = fixture(t), old = legacyClient(t, f, 'e811a5d'); if (!old) return;
  const initial = ok(old('init'));
  ok(old('record', { expectedRevision: 0, ...explanation }));
  ok(old('record-user', { expectedRevision: 0, profile: '中文' }));
  ok(old('pause'));
  assert.equal(f.call('status').migrationRequired, true);
  rejects(() => f.call('get', undefined, { kind: 'evidence', id: 'cors-explained' }), 'MIGRATION_REQUIRED');
  rejects(() => execute('resume', { home: f.home, cwd: f.a }, { expectedRevision: 2, expectedStoreId: randomUUID(), expectedProjectId: initial.projectId, operationId: randomUUID() }), 'MIGRATION_REQUIRED');
  const upgraded = await f.call('migrate');
  assert.equal(upgraded.databaseSchemaVersion, 2); assert.equal(upgraded.migrated, true);
  const backup = new DatabaseSync(upgraded.backupFile, { readOnly: true });
  try { assert.equal(backup.prepare('PRAGMA user_version').get().user_version, 1); assert.equal(backup.prepare('SELECT count(*) AS n FROM evidence').get().n, 1); }
  finally { backup.close(); }
  rejected(old('record-user', { expectedRevision: 1, profile: '旧版写入' }), 'UNSUPPORTED_DATABASE');
  const bound = execute('init', { home: f.home, cwd: f.a });
  assert.equal(bound.projectId, initial.projectId); assert.equal(bound.mode, 'paused'); assert.equal(bound.revision, 2);
  assert.equal(f.call('context', undefined, { topic: 'CORS' }).learning.alreadyExplained, true);
  assert.equal(f.call('user').userProfile, '中文');
  assert.equal((await f.call('migrate')).migrated, false);
});

test('恢复后轮换库身份先备份；旧会话/分页拒绝，明确绑定仍保留暂停及历史', async t => {
  const f = fixture(t), initial = f.call('init');
  f.call('record', { expectedRevision: 0, ...explanation, evidence: [
    ...explanation.evidence, { ...explanation.evidence[0], id: 'second' },
  ] });
  const oldInput = f.input({ profile: '旧会话' });
  const oldCursor = f.call('history', undefined, { conceptId: 'cors', limit: 1 }).nextCursor;
  f.call('pause');
  await assert.rejects(() => f.call('migrate', undefined, { rotateStoreId: true, expectedStoreId: randomUUID() }), { code: 'STORE_MISMATCH' });
  const rotated = await f.call('migrate', undefined, { rotateStoreId: true, expectedStoreId: initial.storeId });
  assert.equal(rotated.rotated, true); assert.notEqual(rotated.storeId, initial.storeId);
  const backup = new DatabaseSync(rotated.backupFile, { readOnly: true });
  try { assert.equal(backup.prepare('SELECT store_id FROM metadata').get().store_id, initial.storeId); }
  finally { backup.close(); }
  assert.equal(f.call('status').reason, 'store_mismatch');
  rejects(() => execute('record', { home: f.home, cwd: f.a }, oldInput), 'STORE_MISMATCH');
  rejects(() => f.call('history', undefined, { conceptId: 'cors', cursor: oldCursor }), 'INVALID_CURSOR');
  rejects(() => f.call('init'), 'STORE_MISMATCH');
  const rebound = f.call('init', undefined, { rebindStoreId: rotated.storeId });
  assert.equal(rebound.projectId, initial.projectId); assert.equal(rebound.revision, 2); assert.equal(rebound.mode, 'paused');
  assert.equal(f.call('context', undefined, { topic: 'CORS' }).learning.alreadyExplained, true);
});

test('备份或迁移发布失败保留原格式/身份，已创建备份不被覆盖', async t => {
  const f = fixture(t), old = legacyClient(t, f, 'e811a5d'); if (!old) return;
  ok(old('init')); ok(old('record', { expectedRevision: 0, ...explanation }));
  const before = disk(f.root), link = fs.linkSync;
  fs.linkSync = () => { throw Object.assign(new Error('模拟备份发布失败'), { code: 'EACCES' }); };
  try { await assert.rejects(() => f.call('migrate'), { code: 'BACKUP_FAILED' }); }
  finally { fs.linkSync = link; }
  assert.equal(f.rows('PRAGMA user_version')[0].user_version, 1);
  assert.equal(f.call('status').revision, 1);
  assert.deepEqual(disk(f.root), before);
  const result = await f.call('migrate');
  const bytes = fs.readFileSync(result.backupFile);
  await assert.rejects(() => f.call('backup', undefined, { output: result.backupFile }), { code: 'BACKUP_FAILED' });
  assert.deepEqual(fs.readFileSync(result.backupFile), bytes);
});

test('不同操作系统的写入器拒绝直接打开同库，诊断仍可读取', t => {
  const f = fixture(t); f.call('init');
  const input = f.input({ profile: '跨系统写入' });
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { db.prepare('UPDATE metadata SET writer_platform=?').run(process.platform === 'win32' ? 'linux' : 'win32'); }
  finally { db.close(); }
  assert.notEqual(f.call('doctor').writerPlatform, process.platform);
  rejects(() => execute('record', { home: f.home, cwd: f.a }, input), 'EXECUTION_ENVIRONMENT_MISMATCH');
  assert.equal(f.call('context').revision, 0);
});
