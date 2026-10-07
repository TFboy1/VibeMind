import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { execute, locate, renderContext } from '../skills/vibemind/scripts/vibemind.mjs';

const script = fileURLToPath(new URL('../skills/vibemind/scripts/vibemind.mjs', import.meta.url));

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibemind-test-'));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('vibemind-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

function project(t) {
  const root = path.join(workspace(t), '中文 项目');
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(root, '.git'));
  return root;
}

function run(cwd, command, input, flags = [], executable = script) {
  const result = spawnSync(process.execPath, [executable, command, '--cwd', cwd, ...flags], {
    encoding: 'utf8',
    input: input === undefined || Buffer.isBuffer(input) ? input : JSON.stringify(input),
    timeout: 10_000,
    maxBuffer: 5 * 1024 * 1024,
  });
  assert.equal(result.error, undefined, result.error?.message);
  return result;
}

function ok(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const value = JSON.parse(result.stdout);
  assert.equal(value.ok, true);
  return value;
}

function rejected(result, code) {
  assert.equal(result.status, 1, result.stdout);
  assert.equal(result.stdout, '');
  const value = JSON.parse(result.stderr);
  assert.equal(value.error.code, code, value.error.message);
  return value;
}

function stateFile(root) {
  return path.join(root, '.vibemind', 'state.json');
}

function state(root) {
  return JSON.parse(fs.readFileSync(stateFile(root), 'utf8'));
}

function disk(root) {
  const result = {};
  function walk(directory) {
    for (const name of fs.readdirSync(directory)) {
      const file = path.join(directory, name);
      const stat = fs.lstatSync(file);
      const relative = path.relative(root, file);
      if (stat.isDirectory()) {
        result[relative] = 'directory';
        walk(file);
      } else result[relative] = stat.isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file).toString('hex');
    }
  }
  walk(root);
  return result;
}

const card = (content = 'Vue 请求 FastAPI：当前允许的来源需要与真实页面地址一致。') => ({
  id: 'cors-vue-fastapi', title: '理解跨域与当前项目的来源配置', content,
});
const decision = (id = 'note-ownership', stage = 'reasoning') => ({
  id, title: '笔记属于谁', stage, content: '等待用户解释访问规则；尚未授权实施。',
});

test('首次 status/context 只读，未初始化时不创建学习目录', t => {
  const root = project(t);
  const before = disk(root);
  const value = ok(run(root, 'status'));
  assert.equal(value.initialized, false);
  assert.equal(value.locked, false);
  rejected(run(root, 'context'), 'NOT_INITIALIZED');
  assert.deepEqual(disk(root), before);
});

test('init 幂等，已有暂停状态不会因 init 重新启用', t => {
  const root = project(t);
  const initial = ok(run(root, 'init'));
  assert.equal(initial.created, true);
  assert.equal(initial.revision, 0);
  ok(run(root, 'pause'));
  const before = disk(root);
  const repeated = ok(run(root, 'init'));
  assert.equal(repeated.created, false);
  assert.equal(repeated.mode, 'paused');
  assert.equal(repeated.revision, 1);
  assert.deepEqual(disk(root), before);
});

test('中文和空格路径、BOM 输入及真实 stdin JSON 更新均可用', t => {
  const root = project(t);
  ok(run(root, 'init'));
  const input = Buffer.from(`\uFEFF${JSON.stringify({ expectedRevision: 0, profile: '用户能解释 Vue 响应式，FastAPI 熟悉程度未知。', cards: [card()] })}`, 'utf8');
  const saved = ok(run(root, 'record', input));
  assert.equal(saved.revision, 1);
  assert.equal(state(root).cards[0].content, card().content);
  assert.match(state(root).profile, /熟悉程度未知/);
});

test('按稳定 ID 更新卡片和决定，保留其他记录；相同更新不增加版本', t => {
  const root = project(t);
  execute('init', { cwd: root });
  execute('record', { cwd: root }, { expectedRevision: 0, cards: [card(), { id: 'vue-ref', title: 'ref', content: '已解释；未观察到独立应用。' }], decisions: [decision()] });
  execute('record', { cwd: root }, { expectedRevision: 1, cards: [card('用户能独立判断允许来源；依据：在当前调试中修正配置并解释原因。')], decisions: [decision('note-ownership', 'implementation')] });
  assert.equal(state(root).cards.length, 2);
  assert.equal(state(root).decisions.length, 1);
  assert.equal(state(root).decisions[0].stage, 'implementation');
  const before = disk(root);
  const value = execute('record', { cwd: root }, { expectedRevision: 2, cards: [card(state(root).cards[0].content)] });
  assert.equal(value.changed, false);
  assert.deepEqual(disk(root), before);
});

test('context 按主题读取卡片，始终恢复全部未完成决定，读取不写入', t => {
  const root = project(t);
  execute('init', { cwd: root });
  execute('record', { cwd: root }, {
    expectedRevision: 0, profile: '当前按话题观察，不给整体能力评级。', projectMap: 'Vue 表单 → FastAPI 接口 → 存储（未定）',
    cards: [card(), { id: 'database', title: '数据库', content: 'DATABASE_BODY_' + '旧主题记录'.repeat(20_000) }],
    decisions: [decision('ownership', 'reasoning'), decision('model', 'design'), decision('access', 'implementation'), decision('done', 'completed')],
  });
  const before = disk(root);
  const base = ok(run(root, 'context', undefined, ['--json']));
  assert.equal(base.pendingDecisions.length, 3);
  assert.equal(base.cardIndex.length, 2);
  assert.equal(Object.hasOwn(base, 'cards'), false);
  const selected = ok(run(root, 'context', undefined, ['--topic', 'vue', '--json']));
  assert.deepEqual(selected.cards.map(value => value.id), ['cors-vue-fastapi']);
  const unmatched = ok(run(root, 'context', undefined, ['--topic', '未知主题', '--json']));
  assert.deepEqual(unmatched.cards, []);
  const output = run(root, 'context');
  assert.equal(output.status, 0, output.stderr);
  assert.match(output.stdout, /存储（未定）/);
  assert.ok(!output.stdout.includes('DATABASE_BODY_'));
  assert.match(renderContext(selected), /尚未授权实施/);
  ok(run(root, 'status'));
  assert.deepEqual(disk(root), before);
});

test('长档案之后的决定仍完整恢复，设计确认不被升级为实施授权', t => {
  const root = project(t);
  execute('init', { cwd: root });
  execute('record', { cwd: root }, { expectedRevision: 0, profile: '观察记录'.repeat(20_000), decisions: [decision('late-pending', 'implementation')] });
  const value = execute('context', { cwd: root });
  assert.deepEqual(value.pendingDecisions, [decision('late-pending', 'implementation')]);
  assert.equal(state(root).decisions[0].stage, 'implementation');
});

test('pause 拒绝 record，resume 保留卡片和待授权决定，重复暂停恢复幂等', t => {
  const root = project(t);
  ok(run(root, 'init'));
  ok(run(root, 'record', { expectedRevision: 0, cards: [card()], decisions: [decision('access', 'implementation')] }));
  const paused = ok(run(root, 'pause'));
  assert.equal(paused.revision, 2);
  const before = disk(root);
  rejected(run(root, 'record', { expectedRevision: 2, profile: '不应保存' }), 'PAUSED');
  const read = ok(run(root, 'context', undefined, ['--json']));
  assert.equal(read.mode, 'paused');
  assert.equal(ok(run(root, 'pause')).changed, false);
  assert.deepEqual(disk(root), before);
  const resumed = ok(run(root, 'resume'));
  assert.equal(resumed.revision, 3);
  assert.equal(resumed.pendingDecisions[0].stage, 'implementation');
  assert.deepEqual(state(root).cards, [card()]);
  const after = disk(root);
  assert.equal(ok(run(root, 'resume')).changed, false);
  assert.deepEqual(disk(root), after);
});

test('旧版本提交拒绝，不能覆盖其他会话的记录或生成新备份', t => {
  const root = project(t);
  execute('init', { cwd: root });
  execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] });
  const before = disk(root);
  rejected(run(root, 'record', { expectedRevision: 0, profile: '旧会话内容' }), 'CONFLICT');
  assert.deepEqual(disk(root), before);
});

test('拒绝非法输入、重复 ID、非法阶段和通过 record 修改启用状态', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const before = disk(root);
  const invalid = [
    { profile: '缺少版本号' },
    { expectedRevision: -1, profile: '非法版本' },
    { expectedRevision: 0 },
    { expectedRevision: 0, mode: 'active' },
    { expectedRevision: 0, profile: 123 },
    { expectedRevision: 0, cards: [card(), card()] },
    { expectedRevision: 0, cards: [{ id: 'blank', title: '', content: '内容' }] },
    { expectedRevision: 0, decisions: [decision('test', 'approved-by-ai')] },
  ];
  for (const input of invalid) rejected(run(root, 'record', input), 'INVALID_INPUT');
  rejected(run(root, 'record', Buffer.from('{bad json}', 'utf8')), 'INVALID_INPUT');
  rejected(run(root, 'record', Buffer.from([0xff])), 'INVALID_INPUT');
  assert.deepEqual(disk(root), before);
});

test('非法参数不会意外初始化；--topic 只能用于 context', t => {
  const root = project(t);
  const before = disk(root);
  rejected(run(root, 'init', undefined, ['--topic', '主题']), 'USAGE');
  rejected(run(root, 'init', undefined, ['--unexpected']), 'USAGE');
  rejected(run(root, 'invalid'), 'USAGE');
  rejected(run(root, 'init', undefined, ['--cwd', root]), 'USAGE');
  assert.deepEqual(disk(root), before);
});

test('损坏 JSON、不支持的版本及重复 ID 状态不会被任何命令重置', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const initial = state(root);
  const cases = [
    ['{broken', 'INVALID_STATE'],
    [JSON.stringify({ ...initial, schemaVersion: 2 }), 'UNSUPPORTED_SCHEMA'],
    [JSON.stringify({ ...initial, cards: [card(), card()] }), 'INVALID_STATE'],
    [JSON.stringify({ ...initial, mode: 'invalid' }), 'INVALID_STATE'],
  ];
  for (const [content, code] of cases) {
    fs.writeFileSync(stateFile(root), content, 'utf8');
    const before = disk(root);
    for (const command of ['init', 'status', 'context', 'pause', 'resume', 'record']) {
      rejected(run(root, command, command === 'record' ? { expectedRevision: 0, profile: '不应覆盖' } : undefined), code);
    }
    assert.deepEqual(disk(root), before);
  }
});

test('无效 UTF-8 状态报错，UTF-8 BOM 状态可读取', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const initial = fs.readFileSync(stateFile(root), 'utf8');
  fs.writeFileSync(stateFile(root), Buffer.from([0xff]));
  rejected(run(root, 'status'), 'INVALID_STATE');
  assert.deepEqual(fs.readFileSync(stateFile(root)), Buffer.from([0xff]));
  fs.writeFileSync(stateFile(root), `\uFEFF${initial}`, 'utf8');
  assert.equal(ok(run(root, 'status')).revision, 0);
});

test('每次更新备份上一版原始内容，已有备份不会覆盖', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const original = fs.readFileSync(stateFile(root));
  const first = execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] });
  assert.deepEqual(fs.readFileSync(first.backupFile), original);
  const version1 = fs.readFileSync(stateFile(root));
  const second = execute('pause', { cwd: root });
  assert.deepEqual(fs.readFileSync(second.backupFile), version1);
  assert.deepEqual(fs.readFileSync(first.backupFile), original);
  assert.equal(fs.readdirSync(path.join(root, '.vibemind', 'backups')).length, 2);
});

test('备份写入失败保留原状态，释放锁并清理本次不完整备份', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const original = fs.readFileSync(stateFile(root));
  const write = fs.writeFileSync;
  fs.writeFileSync = (target, ...args) => {
    if (typeof target === 'number') {
      const descriptor = fs.fstatSync(target);
      const backups = path.join(root, '.vibemind', 'backups');
      if (fs.existsSync(backups) && fs.readdirSync(backups).some(name => fs.statSync(path.join(backups, name)).ino === descriptor.ino)) {
        throw Object.assign(new Error('模拟备份磁盘写入失败'), { code: 'ENOSPC' });
      }
    }
    return write(target, ...args);
  };
  try {
    assert.throws(() => execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] }), { code: 'BACKUP_FAILED' });
  } finally {
    fs.writeFileSync = write;
  }
  assert.deepEqual(fs.readFileSync(stateFile(root)), original);
  assert.ok(!fs.existsSync(path.join(root, '.vibemind', '.lock')));
  assert.deepEqual(fs.readdirSync(path.join(root, '.vibemind', 'backups')), []);
  assert.equal(execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] }).revision, 1);
});

test('原子替换失败保留原状态和完整备份，重试复用已有备份', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const original = fs.readFileSync(stateFile(root));
  const rename = fs.renameSync;
  fs.renameSync = () => { throw Object.assign(new Error('模拟原子替换失败'), { code: 'EACCES' }); };
  try {
    assert.throws(() => execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] }), { code: 'WRITE_FAILED' });
  } finally {
    fs.renameSync = rename;
  }
  assert.deepEqual(fs.readFileSync(stateFile(root)), original);
  assert.ok(!fs.existsSync(path.join(root, '.vibemind', '.lock')));
  assert.ok(!fs.readdirSync(path.join(root, '.vibemind')).some(name => name.endsWith('.tmp')));
  const backups = path.join(root, '.vibemind', 'backups');
  assert.equal(fs.readdirSync(backups).length, 1);
  assert.deepEqual(fs.readFileSync(path.join(backups, fs.readdirSync(backups)[0])), original);
  assert.equal(execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] }).revision, 1);
  assert.equal(fs.readdirSync(backups).length, 1);
});

test('存在写入锁时立即报错，不删除活跃或残留锁', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const lockFile = path.join(root, '.vibemind', '.lock');
  const fd = fs.openSync(lockFile, 'wx');
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, token: 'test-owner' }), 'utf8');
    const before = disk(root);
    rejected(run(root, 'record', { expectedRevision: 0, cards: [card()] }), 'LOCKED');
    assert.equal(ok(run(root, 'status')).locked, true);
    assert.deepEqual(disk(root), before);
  } finally {
    fs.closeSync(fd);
  }
});

test('锁释放失败报告需核实状态，已提交的数据仍可只读查看', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const unlink = fs.unlinkSync;
  fs.unlinkSync = file => {
    if (path.basename(file) === '.lock') throw Object.assign(new Error('模拟锁释放失败'), { code: 'EACCES' });
    return unlink(file);
  };
  try {
    assert.throws(() => execute('record', { cwd: root }, { expectedRevision: 0, cards: [card()] }), { code: 'LOCK_RELEASE_FAILED' });
  } finally {
    fs.unlinkSync = unlink;
  }
  const value = ok(run(root, 'status'));
  assert.equal(value.revision, 1);
  assert.equal(value.locked, true);
  assert.deepEqual(state(root).cards, [card()]);
});

function writer(cwd, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, 'record', '--cwd', cwd]);
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', value => { stdout += value; });
    child.stderr.setEncoding('utf8').on('data', value => { stderr += value; });
    child.once('error', reject);
    child.once('close', status => resolve({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify(input), 'utf8');
  });
}

test('两个真实 CLI 进程并发提交时仅一个成功，重读后可合并更新', { timeout: 15_000 }, async t => {
  const root = project(t);
  execute('init', { cwd: root });
  const cards = [card(), { id: 'validation', title: '请求校验', content: 'FastAPI 根据输入模型校验请求。' }];
  const results = await Promise.all(cards.map(value => writer(root, { expectedRevision: 0, cards: [value] })));
  assert.equal(results.filter(value => value.status === 0).length, 1);
  const loser = results.findIndex(value => value.status !== 0);
  assert.ok(['LOCKED', 'CONFLICT'].includes(JSON.parse(results[loser].stderr).error.code));
  assert.equal(state(root).revision, 1);
  assert.equal(state(root).cards.length, 1);
  execute('record', { cwd: root }, { expectedRevision: 1, cards: [cards[loser]] });
  assert.equal(state(root).cards.length, 2);
  assert.equal(state(root).revision, 2);
});

test('源码子目录找到项目状态；嵌套仓库和 worktree 的 .git 文件阻止串读', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const source = path.join(root, 'src', 'api');
  fs.mkdirSync(source, { recursive: true });
  assert.equal(locate(source).project, root);
  const nested = path.join(source, 'nested');
  fs.mkdirSync(nested);
  fs.mkdirSync(path.join(nested, '.git'));
  assert.equal(ok(run(nested, 'status')).initialized, false);
  assert.equal(ok(run(nested, 'init')).project, nested);
  const worktree = path.join(root, 'another-worktree');
  fs.mkdirSync(worktree);
  fs.writeFileSync(path.join(worktree, '.git'), 'gitdir: /unused/vibemind-test-fixture\n', 'utf8');
  assert.equal(ok(run(worktree, 'status')).initialized, false);
  assert.equal(ok(run(worktree, 'init')).project, worktree);
  assert.equal(state(root).revision, 0);
});

test('没有 Git 时初始化当前目录；存在更近的半初始化目录时不借用父记录', t => {
  const root = workspace(t);
  const standalone = path.join(root, 'standalone');
  fs.mkdirSync(standalone);
  assert.equal(execute('init', { cwd: standalone }).project, standalone);
  const child = path.join(standalone, 'child');
  fs.mkdirSync(path.join(child, '.vibemind'), { recursive: true });
  assert.equal(ok(run(child, 'status')).initialized, false);
  assert.equal(ok(run(child, 'init')).project, child);
  assert.equal(state(standalone).revision, 0);
});

test('更近的损坏目录不会回退至父项目记录', t => {
  const root = project(t);
  execute('init', { cwd: root });
  const child = path.join(root, 'child');
  fs.mkdirSync(child);
  fs.writeFileSync(path.join(child, '.vibemind'), '不是目录', 'utf8');
  rejected(run(child, 'status'), 'UNSAFE_PATH');
  assert.equal(state(root).revision, 0);
});

test('符号链接学习目录和备份目录被拒绝，外部数据保持不变', t => {
  const root = project(t);
  const outside = path.join(path.dirname(root), 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'sentinel.txt'), '不得修改', 'utf8');
  const otherProject = path.join(root, 'linked-project');
  fs.mkdirSync(otherProject);
  fs.mkdirSync(path.join(otherProject, '.git'));
  fs.symlinkSync(outside, path.join(otherProject, '.vibemind'), 'junction');
  rejected(run(otherProject, 'init'), 'UNSAFE_PATH');
  execute('init', { cwd: root });
  fs.symlinkSync(outside, path.join(root, '.vibemind', 'backups'), 'junction');
  const before = fs.readFileSync(stateFile(root));
  rejected(run(root, 'record', { expectedRevision: 0, cards: [card()] }), 'UNSAFE_PATH');
  assert.deepEqual(fs.readFileSync(stateFile(root)), before);
  assert.deepEqual(fs.readdirSync(outside), ['sentinel.txt']);
});

test('符号链接状态文件不能被读取或替换', t => {
  const root = project(t);
  const outside = path.join(path.dirname(root), 'external-state.json');
  fs.writeFileSync(outside, '{}', 'utf8');
  fs.mkdirSync(path.join(root, '.vibemind'));
  try {
    fs.symlinkSync(outside, stateFile(root), 'file');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return t.skip('当前 Windows 权限不允许创建文件符号链接；目录 junction 保护单独测试。');
    throw error;
  }
  rejected(run(root, 'status'), 'UNSAFE_PATH');
  rejected(run(root, 'init'), 'UNSAFE_PATH');
  assert.equal(fs.readFileSync(outside, 'utf8'), '{}');
});

test('通过安装目录 junction 调用 CLI 仍执行入口，不在技能目录保存学习状态', t => {
  const root = project(t);
  const container = path.dirname(root);
  const source = path.join(container, 'skill-source');
  fs.mkdirSync(path.join(source, 'scripts'), { recursive: true });
  fs.copyFileSync(script, path.join(source, 'scripts', 'vibemind.mjs'));
  const installed = path.join(container, 'skill-installed');
  fs.symlinkSync(source, installed, 'junction');
  const value = ok(run(root, 'init', undefined, [], path.join(installed, 'scripts', 'vibemind.mjs')));
  assert.equal(value.project, root);
  assert.ok(!fs.existsSync(path.join(source, '.vibemind')));
});

test('可以从标准输入导入 CLI 模块，入口不会误访问名为 - 的路径', t => {
  const root = project(t);
  const program = `import { locate } from ${JSON.stringify(pathToFileURL(script).href)}; process.stdout.write(JSON.stringify(locate(process.argv[2])));`;
  const value = spawnSync(process.execPath, ['--input-type=module', '-', root], { input: program, encoding: 'utf8', timeout: 10_000 });
  assert.equal(value.status, 0, value.stderr);
  assert.equal(JSON.parse(value.stdout).project, root);
});
