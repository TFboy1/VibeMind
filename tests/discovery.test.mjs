import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createRoadmapReader, searchTopics, scanProject, validateDiscovery } from '../skills/vibemind/scripts/discovery.mjs';
import { execute } from '../skills/vibemind/scripts/vibemind.mjs';

const version = 'a'.repeat(40);
const repo = 'nilbuild/developer-roadmap';
const script = fileURLToPath(new URL('../skills/vibemind/scripts/vibemind.mjs', import.meta.url));
const serverScript = fileURLToPath(new URL('../scripts/mcp.mjs', import.meta.url));
const definitions = {
  frontend: [['visual-hierarchy', 'visual', 'Visual Hierarchy'], ['typography', 'type', 'Typography'], ['spacing', 'space', 'Spacing']],
  backend: [['cors', 'cors', 'CORS'], ['idempotency', 'idempotent', 'Idempotency']],
  devops: [['health-checks', 'health', 'Health Checks'], ['backups', 'backup', 'Backups'], ['orchestration', 'k8s', 'Orchestration']],
  'game-developer': [['object-pooling', 'pool', 'Object Pooling'], ['physics', 'physics', 'Physics']],
  'ai-agents': [['evaluation', 'eval', 'Evaluation']],
  'novel-track': [['novel-concept', 'novel', 'Novel Concept']],
};
const gitSha = text => createHash('sha1').update('blob ' + Buffer.byteLength(text, 'utf8') + '\0').update(text, 'utf8').digest('hex');
function corpus() {
  const api = 'https://api.github.com/repos/' + repo + '/';
  const resources = new Map([[api + 'commits/master', { sha: version }]]);
  resources.set(api + 'contents/roadmaps?ref=' + version, Object.keys(definitions).map(name => ({ name, path: 'roadmaps/' + name, type: 'dir', sha: 'b'.repeat(40) })));
  for (const [roadmap, nodes] of Object.entries(definitions)) {
    const topics = nodes.map(([label, nodeId, title]) => {
      const name = label + '@' + nodeId + '.md', location = 'roadmaps/' + roadmap + '/content/' + name;
      const body = '# ' + title + '\n\nOriginal test fixture for ' + label.replaceAll('-', ' ') + '.\n';
      const url = 'https://raw.githubusercontent.com/' + repo + '/' + version + '/' + location.split('/').map(encodeURIComponent).join('/');
      resources.set(url, body);
      return { name, path: location, type: 'file', sha: gitSha(body) };
    });
    resources.set(api + 'contents/roadmaps/' + roadmap + '/content/?ref=' + version, topics);
  }
  return resources;
}
function makeFetch(resources, calls = []) {
  return async url => {
    calls.push(url);
    if (!resources.has(url)) return new Response('Missing fixture', { status: 404 });
    const value = resources.get(url);
    return new Response(typeof value === 'string' ? value : JSON.stringify(value));
  };
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibemind-discovery-'));
  const home = path.join(root, '记忆'), cache = path.join(root, '缓存');
  const a = path.join(root, '项目 A'), b = path.join(root, '项目 B');
  for (const project of [a, b]) fs.mkdirSync(path.join(project, '.git'), { recursive: true });
  const previousCache = process.env.VIBEMIND_CACHE;
  process.env.VIBEMIND_CACHE = cache;
  t.after(() => {
    if (previousCache === undefined) delete process.env.VIBEMIND_CACHE; else process.env.VIBEMIND_CACHE = previousCache;
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('vibemind-discovery-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  const options = cwd => ({ home, cwd: cwd ?? a });
  const write = (command, payload, cwd = a, control = {}) => {
    const current = execute('status', options(cwd));
    return execute(command, options(cwd), { expectedRevision: command === 'record-user' ? current.userRevision : current.revision, expectedProjectId: current.projectId, expectedStoreId: current.storeId, operationId: randomUUID(), ...payload, ...control });
  };
  const resources = corpus();
  const calls = [];
  const reader = createRoadmapReader({ cacheDir: cache, fetchImpl: makeFetch(resources, calls), mirrors: [] });
  const seed = async () => {
    await reader.head(); await reader.routes(version);
    for (const roadmap of Object.keys(definitions)) {
      const result = await reader.topics(version, roadmap);
      await Promise.all(result.data.map(topic => reader.document(topic)));
    }
  };
  return { root, home, cache, a, b, options, write, resources, calls, reader, seed };
}
const session = { host: 'fixture', sessionId: 'conversation-1' };
function request(matches = [], extra = {}) {
  return { action: 'recommend', taskSummary: '当前项目的开发目标', version,
    source: { ...session, taskId: 'task-1', codeRevision: 'unknown' }, constraints: { event: 'task_completed' },
    matches: matches.map(catalogId => ({ catalogId, relation: 'next_step', anchor: '当前任务', reason: '与当前任务相关', learningGoal: '解释并应用当前概念', proposedAction: '结合项目讨论', relevance: 1 })), ...extra };
}
const discover = (f, input, cwd = f.a) => execute('discover', f.options(cwd), input);
async function candidate(f, id = 'roadmap/frontend/visual', extra = {}) {
  const result = await discover(f, request([id], extra));
  assert.equal(result.sourceStatus, 'available', JSON.stringify(result));
  return result.opportunities[0].recordCandidate;
}

test('目录随上游扩展，缓存保持可读，文字召回不限三个预设领域', async t => {
  const f = fixture(t); await f.seed();
  const before = f.calls.length;
  const routes = await f.reader.routes(version);
  assert.ok(routes.data.some(route => route.id === 'novel-track'));
  assert.equal(f.calls.length, before);
  const result = await discover(f, { action: 'search', taskSummary: '游戏需要复用对象', roadmaps: ['game-developer'], queries: ['对象复用', 'object pooling'] });
  assert.equal(result.candidates[0].catalogId, 'roadmap/game-developer/pool');
  assert.equal(result.candidates[0].summary.includes('Object Pooling'), true);
  const directory = await execute('extensions', { home: f.home });
  assert.equal(directory.routes.length, Object.keys(definitions).length);
  assert.equal(fs.existsSync(f.home), false);
  assert.equal(fs.existsSync(path.join(f.a, '.vibemind')), false);
});

test('单领域超过 GitHub 目录上限时继续读取完整树，不截为一千个节点', async t => {
  const f = fixture(t);
  const entries = Array.from({ length: 1001 }, (_, i) => ({ name: 'concept@node' + i + '.md', path: 'roadmaps/large/content/concept@node' + i + '.md', type: 'file', sha: 'b'.repeat(40) }));
  f.resources.set('https://api.github.com/repos/' + repo + '/contents/roadmaps/large/content/?ref=' + version, entries.slice(0, 1000));
  f.resources.set('https://api.github.com/repos/' + repo + '/git/trees/' + version + '?recursive=1', { truncated: false, tree: entries.map(item => ({ ...item, type: 'blob' })) });
  assert.equal((await f.reader.topics(version, 'large')).data.length, 1001);
});

test('FTS5 多语言查询安全且最多召回三十个候选', async () => {
  const topics = Array.from({ length: 40 }, (_, i) => ({ title: '缓存 cache', roadmap: 'custom', nodeId: String(i), summary: '测试' }));
  const result = await searchTopics(topics, ['缓存', 'cache OR " NEAR()']);
  assert.equal(result.length, 30);
  assert.equal((await searchTopics(topics, ['???'])).length, 0);
});

test('镜像按 API 能力选择，HTML 和 blob 校验失败后切换文件镜像', async t => {
  const f = fixture(t);
  const calls = [], resources = f.resources;
  const fetchImpl = async url => {
    calls.push(url);
    if (url.startsWith('https://metadata-mirror.example/')) return makeFetch(resources)(url.slice('https://metadata-mirror.example/'.length));
    if (url.startsWith('https://files-mirror.example/')) return makeFetch(resources)(url.slice('https://files-mirror.example/'.length));
    return new Response('<html>blocked</html>');
  };
  const reader = createRoadmapReader({ cacheDir: f.cache, fetchImpl, mirrors: [{ url: 'https://files-mirror.example/', api: false }, { url: 'https://metadata-mirror.example/', api: true }] });
  const head = await reader.head();
  assert.equal(head.data.sha, version);
  assert.equal(calls.some(url => url.startsWith('https://files-mirror.example/') && url.includes('api.github.com')), false);
  const topics = await reader.topics(version, 'frontend');
  const document = await reader.document(topics.data[0]);
  assert.ok(document.fetchedFrom.startsWith('https://files-mirror.example/'));
  assert.ok(document.data.includes('Visual Hierarchy'));
  assert.ok(reader.diagnostics.some(item => item.code === 'INVALID_SOURCE'));
});

test('固定版本读取；损坏主题、超限和非 UTF-8 响应不能污染缓存', async t => {
  const f = fixture(t);
  const topics = await f.reader.topics(version, 'frontend');
  const topic = topics.data[0];
  for (const [body, code] of [[Buffer.from([0xff]), 'INVALID_SOURCE'], ['# Wrong data', 'SOURCE_CHECKSUM_MISMATCH'], ['x'.repeat(128 * 1024 + 1), 'SOURCE_TOO_LARGE']]) {
    const reader = createRoadmapReader({ cacheDir: f.cache, mirrors: [], fetchImpl: async url => {
      assert.ok(url.includes('/' + version + '/'));
      return new Response(body);
    } });
    await assert.rejects(reader.document(topic), { code: 'SOURCE_UNAVAILABLE' });
    assert.ok(reader.diagnostics.some(item => item.code === code));
  }
  const body = '\uFEFF# BOM\n\nUTF-8 fixture.\n';
  const bomTopic = { ...topic, blobSha: gitSha(body) };
  const reader = createRoadmapReader({ cacheDir: f.cache, mirrors: [], fetchImpl: async () => new Response(body) });
  assert.equal((await reader.document(bomTopic)).data, body);
});

test('所有来源失败使用带时间的旧缓存，无缓存则明确报错', async t => {
  const f = fixture(t); await f.seed();
  for (const name of fs.readdirSync(f.cache)) {
    const file = path.join(f.cache, name), value = JSON.parse(fs.readFileSync(file, 'utf8'));
    value.fetchedAt = '2000-01-01T00:00:00.000Z'; fs.writeFileSync(file, JSON.stringify(value), 'utf8');
  }
  const offline = async () => { throw new Error('offline'); };
  const reader = createRoadmapReader({ cacheDir: f.cache, mirrors: [], fetchImpl: offline });
  const head = await reader.head();
  assert.equal(head.stale, true);
  const topics = await reader.topics(head.data.sha, 'frontend');
  assert.equal(topics.stale, true);
  assert.ok(reader.diagnostics.some(item => item.code === 'STALE_CACHE'));
  const empty = createRoadmapReader({ cacheDir: path.join(f.root, 'empty'), mirrors: [], fetchImpl: offline });
  await assert.rejects(empty.head(), { code: 'SOURCE_UNAVAILABLE' });
});

test('来源请求最多四个并发；超时有界且不频繁重试', async t => {
  const f = fixture(t);
  let active = 0, peak = 0;
  const fetchImpl = async (url, { signal }) => {
    active++; peak = Math.max(peak, active);
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 8);
        signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
      });
      return makeFetch(f.resources)(url);
    } finally { active--; }
  };
  const reader = createRoadmapReader({ cacheDir: f.cache, mirrors: [], fetchImpl, requestMs: 100, budgetMs: 3000 });
  await Promise.all(Array.from({ length: 10 }, () => reader.head()));
  assert.ok(peak <= 4, '并发=' + peak);
  let attempts = 0;
  const timeout = createRoadmapReader({ cacheDir: path.join(f.root, 'timeout'), mirrors: [], requestMs: 10, budgetMs: 50, fetchImpl: async (url, { signal }) => {
    attempts++;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  // AbortSignal timers are unref'd; keep the test process alive until assertion finishes.
  const keeper = setTimeout(() => {}, 1000);
  try { await assert.rejects(timeout.head(), { code: 'SOURCE_UNAVAILABLE' }); } finally { clearTimeout(keeper); }
  assert.equal(attempts, 1);
});

test('项目扫描限额并跳过依赖、隐藏目录、环境文件和链接', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.a, 'package.json'), JSON.stringify({ dependencies: { vue: '^3', vite: '^7' } }), 'utf8');
  fs.writeFileSync(path.join(f.a, 'requirements.txt'), 'fastapi>=0.100\nuvicorn\n', 'utf8');
  fs.writeFileSync(path.join(f.a, '.env'), 'SECRET=never-return-this', 'utf8');
  fs.mkdirSync(path.join(f.a, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(f.a, 'node_modules', 'package.json'), '{"dependencies":{"hidden":"1"}}', 'utf8');
  const analysis = scanProject(f.a);
  assert.ok(analysis.facts.some(item => item.name === 'vue'));
  assert.ok(analysis.facts.some(item => item.name === 'fastapi'));
  assert.equal(JSON.stringify(analysis).includes('SECRET'), false);
  assert.equal(analysis.facts.some(item => item.name === 'hidden'), false);
  assert.ok(analysis.bytesRead <= 512 * 1024);
});

test('视觉机会由宿主语义判断；未知保持未知，依据不足不凑三项', async t => {
  const f = fixture(t); await f.seed();
  execute('init', f.options());
  const input = request(['roadmap/frontend/visual', 'roadmap/frontend/type', 'roadmap/frontend/space'], { taskSummary: '前端做好看一点' });
  input.matches[0].gapEvidence = '用户表达了模糊视觉目标'; input.matches[0].gap = 1;
  const result = await discover(f, input);
  assert.equal(result.opportunities.length, 3);
  assert.equal(result.opportunities[0].catalogId, 'roadmap/frontend/visual');
  assert.equal(result.opportunities[0].mastery, 'unknown');
  assert.equal(result.opportunities[0].recordCandidate.gapEvidence, input.matches[0].gapEvidence);
  assert.equal(result.invitation.eligible, true);
  assert.equal((await discover(f, request(['roadmap/frontend/visual']))).opportunities.length, 1);
  const missingSession = await discover(f, request(['roadmap/frontend/visual'], { source: { host: 'fixture' } }));
  assert.ok(missingSession.invitation.reasons.includes('session_unknown'));
});

test('单机部署过滤编排；核实不足才硬性过滤前置，推测保持未知', async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options());
  const input = request(['roadmap/devops/health', 'roadmap/devops/backup', 'roadmap/devops/k8s']);
  input.matches[2].relevance = 0;
  const result = await discover(f, input);
  assert.equal(result.opportunities.length, 2);
  assert.ok(result.filtered.some(item => item.reason === 'project_irrelevant'));
  const rollout = request(['roadmap/devops/k8s'], { taskSummary: '跨主机滚动发布' });
  rollout.matches[0].prerequisite = { status: 'missing', verified: false };
  assert.equal((await discover(f, rollout)).opportunities.length, 1);
  rollout.matches[0].prerequisite = { status: 'missing', verified: true, basis: '用户明确说明不理解容器网络' };
  assert.ok((await discover(f, rollout)).filtered.some(item => item.reason === 'prerequisite_missing'));
});

test('跨项目 CORS 精确映射保留 scope；摘要隐藏路径，私有证据不返回', async t => {
  const f = fixture(t); await f.seed();
  execute('init', f.options()); execute('init', f.options(f.b));
  f.write('record', { cards: [{ id: 'cors-card', title: 'CORS', content: '项目中的来源规则' }], concepts: [{ id: 'cors', title: '跨域资源共享', aliases: ['CORS'] }],
    evidence: [{ id: 'explanation', conceptId: 'cors', cardId: 'cors-card', kind: 'explained', scope: '同源限制与允许来源', summary: '解释过基础范围', codeLocation: 'private/path.py:10' }] });
  const input = request(['roadmap/backend/cors']); input.matches[0].memoryTopic = 'CORS';
  const result = await discover(f, input, f.b);
  const opportunity = result.opportunities[0];
  assert.equal(opportunity.history.alreadyExplained, true);
  assert.equal(opportunity.history.explanationSummaries[0].scope, '同源限制与允许来源');
  assert.equal(opportunity.mastery, 'unknown');
  assert.equal(JSON.stringify(opportunity.history).includes('private/path.py'), false);
  f.write('record', { sharing: 'private' });
  assert.equal((await discover(f, input, f.b)).opportunities[0].history.alreadyExplained, false);
});

test('机会保存去重、反馈停止本会话、快照保留旧内容并支持分页', async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options());
  const candidates = (await discover(f, request(['roadmap/frontend/visual', 'roadmap/frontend/type']))).opportunities.map(item => item.recordCandidate);
  f.write('record', { growth: { candidates } });
  const before = execute('status', f.options()).revision;
  const same = f.write('record', { growth: { candidates } });
  assert.equal(same.changed, false); assert.equal(same.revision, before);
  f.write('record', { growth: { session, invite: candidates[0].id } });
  f.write('record', { growth: { session, feedback: { opportunityId: candidates[0].id, outcome: 'dismissed', summary: '这次先不学' } } });
  const result = await discover(f, request(['roadmap/frontend/type']));
  assert.equal(result.invitation.eligible, false);
  assert.ok(result.invitation.reasons.includes('session_suppressed'));
  const next = await discover(f, request(['roadmap/frontend/type'], { source: { ...session, sessionId: 'conversation-2', taskId: 'task-2' } }));
  assert.equal(next.invitation.eligible, true);
  const page = execute('opportunities', { ...f.options(), limit: 1 });
  assert.ok(page.nextCursor);
  const second = execute('opportunities', { ...f.options(), limit: 1, cursor: page.nextCursor });
  assert.notEqual(page.opportunities[0].id, second.opportunities[0].id);
  assert.throws(() => execute('opportunities', { ...f.options(), status: 'dismissed', cursor: page.nextCursor }), { code: 'INVALID_CURSOR' });
  assert.equal(execute('opportunities', { ...f.options(), status: 'dismissed' }).opportunities[0].feedback[0].summary, '这次先不学');
  const snapshot = execute('get', { ...f.options(), kind: 'snapshot', id: String(before) });
  assert.ok(JSON.stringify(snapshot).includes('growthOpportunities'));
});

test('邀请幂等回执、过期版本和暂停；直接实现不能占位', async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options());
  const value = await candidate(f);
  f.write('record', { growth: { candidates: [value] } });
  const current = execute('status', f.options());
  const payload = { expectedRevision: current.revision, expectedStoreId: current.storeId, expectedProjectId: current.projectId, operationId: randomUUID(), growth: { session, invite: value.id } };
  const first = execute('record', f.options(), payload);
  assert.equal(execute('record', f.options(), payload).replayed, true);
  assert.throws(() => execute('record', f.options(), { ...payload, operationId: randomUUID() }), { code: 'CONFLICT' });
  assert.throws(() => f.write('record', { growth: { session, invite: value.id } }), { code: 'INVITATION_BLOCKED' });
  f.write('pause');
  assert.equal(execute('record', f.options(), payload).operationId, first.operationId);
  assert.throws(() => f.write('record', { growth: { session, suppressSession: true } }), { code: 'PAUSED' });
  assert.equal((await discover(f, request(['roadmap/frontend/visual']))).invitation.eligible, false);
  f.write('resume');
  const direct = await candidate(f, 'roadmap/frontend/type', { constraints: { event: 'task_completed', directImplementation: true }, source: { ...session, sessionId: 'direct', taskId: 'direct-task' } });
  f.write('record', { growth: { candidates: [direct] } });
  assert.throws(() => f.write('record', { growth: { session: { ...session, sessionId: 'direct' }, invite: direct.id } }), { code: 'INVITATION_BLOCKED' });
});

test('学习偏好复用 userRevision、保留档案、限制路线及关闭提醒', async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options()); execute('init', f.options(f.b));
  f.write('record-user', { profile: '用户的通用偏好' });
  const prior = execute('user', { home: f.home });
  f.write('record-user', { learningPreferences: { frequency: 'off', roadmaps: ['frontend'] } }, f.b);
  assert.equal(execute('user', { home: f.home }).userProfile, prior.userProfile);
  assert.throws(() => f.write('record-user', { profile: '覆盖档案' }, f.a, { expectedRevision: prior.userRevision }), { code: 'CONFLICT' });
  const result = await discover(f, request(['roadmap/frontend/visual']));
  assert.ok(result.invitation.reasons.includes('frequency_off'));
  assert.equal((await discover(f, request(['roadmap/game-developer/pool']))).opportunities.length, 0);
});

test('configure 保存镜像保留记忆目录；无效 URL 不改配置', t => {
  const f = fixture(t), configFile = path.join(f.root, 'config.json');
  execute('configure', { configFile, memoryHome: f.home });
  const mirrors = [{ url: 'https://mirror.example/', api: true }];
  execute('configure', { configFile, roadmapMirrors: mirrors });
  assert.equal(JSON.parse(fs.readFileSync(configFile, 'utf8')).memoryHome, f.home);
  execute('configure', { configFile, memoryHome: path.join(f.root, 'new-memory') });
  assert.deepEqual(JSON.parse(fs.readFileSync(configFile, 'utf8')).roadmapMirrors, mirrors);
  const before = fs.readFileSync(configFile, 'utf8');
  assert.throws(() => execute('configure', { configFile, roadmapMirrors: [{ url: 'https://user:password@example.com', api: true }] }), { code: 'INVALID_INPUT' });
  assert.equal(fs.readFileSync(configFile, 'utf8'), before);
});

test('格式2只读历史，迁移保持身份及暂停，失败回滚并拒绝旧0.4写入器', async t => {
  const f = fixture(t); execute('init', f.options());
  f.write('record-user', { profile: '升级前档案' }); f.write('pause');
  const original = execute('status', f.options());
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  db.exec('DROP TABLE growth_sessions; DROP TABLE growth_opportunities; DROP TABLE learning_preferences; PRAGMA user_version=2;'); db.close();
  assert.equal(execute('status', f.options()).storeId, original.storeId);
  assert.equal(execute('status', f.options()).migrationRequired, true);
  assert.equal(execute('user', { home: f.home }).userProfile, '升级前档案');
  const createBackup = fs.linkSync;
  fs.linkSync = () => { throw new Error('simulate backup failure'); };
  try { await assert.rejects(execute('migrate', { home: f.home }), { code: 'BACKUP_FAILED' }); } finally { fs.linkSync = createBackup; }
  assert.equal(execute('status', f.options()).databaseSchemaVersion, 2);
  const migrated = await execute('migrate', { home: f.home });
  assert.equal(migrated.databaseSchemaVersion, 3); assert.equal(migrated.storeId, original.storeId);
  const current = execute('status', f.options()); assert.equal(current.mode, 'paused'); assert.equal(current.revision, original.revision);
  assert.equal(execute('user', { home: f.home }).userRevision, original.userRevision);
  const backup = new DatabaseSync(migrated.backupFile, { readOnly: true });
  assert.equal(backup.prepare('PRAGMA user_version').get().user_version, 2); backup.close();
  assert.equal((await execute('migrate', { home: f.home })).migrated, false);
  const old = spawnSync('git', ['show', 'db3002388ff920a77c097f4bc6ae80704f9492b6:skills/vibemind/scripts/vibemind.mjs'], { cwd: path.dirname(serverScript), encoding: 'utf8' });
  if (old.status === 0) {
    const file = path.join(f.root, 'old-0.4.mjs'); fs.writeFileSync(file, old.stdout, 'utf8');
    const result = spawnSync(process.execPath, [file, 'record', '--cwd', f.a], { encoding: 'utf8', input: JSON.stringify({ expectedStoreId: current.storeId, expectedProjectId: current.projectId, expectedRevision: current.revision, operationId: randomUUID(), profile: 'old writer' }), env: { ...process.env, VIBEMIND_HOME: f.home } });
    assert.equal(result.status, 1); assert.match(result.stderr, /UNSUPPORTED_DATABASE/);
  }
});

test('成长记录纳入在线备份、库身份轮换、删除及偏好清理', async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options());
  const value = await candidate(f); f.write('record', { growth: { candidates: [value], session, invite: value.id } });
  f.write('record-user', { learningPreferences: { frequency: 'off', roadmaps: ['frontend'] } });
  const head = execute('status', f.options());
  const rotated = await execute('migrate', { home: f.home, rotateStoreId: true, expectedStoreId: head.storeId });
  const saved = new DatabaseSync(rotated.backupFile, { readOnly: true });
  assert.equal(saved.prepare('SELECT count(*) AS n FROM growth_opportunities').get().n, 1);
  assert.equal(saved.prepare('SELECT invited FROM growth_sessions').get().invited, 1); saved.close();
  execute('init', { ...f.options(), rebindStoreId: rotated.storeId });
  f.write('purge', { originProjectId: head.projectId, expectedOriginRevision: head.revision, confirmProjectId: head.projectId, forgetUserProfile: true, expectedUserRevision: head.userRevision });
  const current = new DatabaseSync(path.join(f.home, 'memory.sqlite'), { readOnly: true });
  assert.equal(current.prepare('SELECT count(*) AS n FROM growth_opportunities').get().n, 0);
  assert.equal(current.prepare('SELECT count(*) AS n FROM growth_sessions').get().n, 0); current.close();
  assert.deepEqual(execute('user', { home: f.home }).learningPreferences, { frequency: 'normal', roadmaps: ['*'] });
});

test('输入边界阻止路径注入、重复节点和伪造候选分数', async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options());
  assert.throws(() => validateDiscovery({ action: 'search', taskSummary: 'x', roadmaps: ['../secrets'] }), { code: 'INVALID_INPUT' });
  assert.throws(() => validateDiscovery(request(['roadmap/frontend/visual', 'roadmap/frontend/visual'])), { code: 'INVALID_INPUT' });
  const value = await candidate(f);
  assert.throws(() => f.write('record', { growth: { candidates: [{ ...value, score: 0 }] } }), { code: 'INVALID_INPUT' });
  assert.throws(() => f.write('record', { growth: { candidates: [{ ...value, content: 'full tutorial' }] } }), { code: 'INVALID_INPUT' });
  assert.equal(execute('status', f.options()).revision, 0);
});

test('完整 Skill 复制后独立 CLI 可检索缓存，不依赖根目录或第三方模块', async t => {
  const f = fixture(t); await f.seed();
  const copied = path.join(f.root, 'installed-skill');
  fs.cpSync(path.dirname(path.dirname(script)), copied, { recursive: true });
  const result = spawnSync(process.execPath, [path.join(copied, 'scripts', 'vibemind.mjs'), 'discover', '--cwd', f.a], {
    env: { ...process.env, VIBEMIND_HOME: f.home, VIBEMIND_CACHE: f.cache }, encoding: 'utf8',
    input: JSON.stringify({ action: 'search', taskSummary: '缓存检索', roadmaps: ['backend'], queries: ['CORS'] }), timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).candidates[0].catalogId, 'roadmap/backend/cors');
  assert.equal(fs.existsSync(f.home), false);
});

test('真实 stdio discover、成长写入及两个服务并发占位仅一个成功', { timeout: 20000 }, async t => {
  const f = fixture(t); await f.seed(); execute('init', f.options());
  const clients = [];
  t.after(async () => { await Promise.all(clients.map(client => client.close())); });
  async function connect() {
    const client = new Client({ name: 'discovery-fixture', version: '1.0.0' });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverScript], env: { ...process.env, VIBEMIND_HOME: f.home, VIBEMIND_CACHE: f.cache }, stderr: 'pipe' }));
    clients.push(client); return client;
  }
  const one = await connect(), two = await connect();
  const list = await one.listTools();
  assert.equal(list.tools.length, 23);
  assert.equal(list.tools.find(tool => tool.name === 'vibemind_discover').annotations.readOnlyHint, true);
  const response = await one.callTool({ name: 'vibemind_discover', arguments: { projectPath: f.a, ...request(['roadmap/frontend/visual']) } });
  assert.equal(response.isError, undefined, JSON.stringify(response));
  const value = response.structuredContent.opportunities[0].recordCandidate;
  f.write('record', { growth: { candidates: [value] } });
  const head = execute('status', f.options());
  const results = await Promise.all([one, two].map(client => client.callTool({ name: 'vibemind_record', arguments: {
    projectPath: f.a, expectedRevision: head.revision, expectedStoreId: head.storeId, expectedProjectId: head.projectId, operationId: randomUUID(), growth: { session, invite: value.id },
  } })));
  assert.equal(results.filter(result => !result.isError).length, 1);
  assert.equal(results.find(result => result.isError).structuredContent.error.code, 'CONFLICT');
  const saved = await two.callTool({ name: 'vibemind_opportunities', arguments: { projectPath: f.a, status: 'invited' } });
  assert.equal(saved.structuredContent.opportunities.length, 1);
  await Promise.all(clients.map(client => client.close()));
});
