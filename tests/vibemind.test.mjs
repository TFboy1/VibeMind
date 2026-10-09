import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { execute, locate, renderContext } from '../skills/vibemind/scripts/vibemind.mjs';

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
  const call = (command, input, options = {}) => execute(command, { home, ...(['init', 'status', 'context', 'record', 'pause', 'resume'].includes(command) && !options.projectId ? { cwd: a } : {}), ...options }, input);
  const rows = sql => {
    const db = new DatabaseSync(path.join(home, 'memory.sqlite'), { readOnly: true });
    try { return db.prepare(sql).all().map(value => ({ ...value })); } finally { db.close(); }
  };
  return { root, home, a, b, makeProject, call, rows };
}
function run(f, command, input, flags = [], executable = script) {
  const value = spawnSync(process.execPath, [executable, command, ...flags], {
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
  const before = disk(f.root);
  assert.equal(f.call('init').mode, 'paused');
  assert.equal(f.call('pause').changed, false);
  assert.deepEqual(disk(f.root), before);
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
test('A 解释后 B 按别名跳过基础解释，无应用证据仍不重讲', t => {
  const f = fixture(t), a = f.call('init');
  f.call('record', { expectedRevision: 0, ...explanation });
  f.call('init', undefined, { cwd: f.b });
  const b = f.call('context', undefined, { cwd: f.b, topic: 'CORS' });
  assert.equal(b.learning.alreadyExplained, true); assert.equal(b.learning.guidance, 'skip_basics');
  assert.equal(b.learning.conceptId, 'cors');
  assert.equal(b.learning.explanationSummaries[0].projectId, a.projectId);
  assert.equal(b.learning.explanationSummaries[0].codeLocation, 'api/main.py:12');
  assert.ok(!b.learning.evidence.some(value => value.kind === 'applied'));
  assert.match(renderContext(b), /缺少应用证据不是自动重讲/);
  assert.match(renderContext(b), /用户主动要求复习/);
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
  const before = disk(f.root);
  assert.equal(f.call('record', { expectedRevision: 2, cards: [{ ...card, content: '更新已有卡' }] }).changed, false);
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
  assert.equal(f.call('resume').pendingDecisions[0].stage, 'implementation');
  assert.equal(f.call('knowledge', undefined, { conceptId: 'cors' }).alreadyExplained, true);
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
  rejects(() => execute('record-user', { home: badHome }, { expectedRevision: 0, profile: '不能重置' }), 'INVALID_DATABASE');
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
    child.stdin.end(JSON.stringify({ expectedRevision: 0, profile }), 'utf8');
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
