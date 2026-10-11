import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { execute, LIMITS } from '../skills/vibemind/scripts/vibemind.mjs';

const serverScript = fileURLToPath(new URL('../scripts/mcp.mjs', import.meta.url));

function session(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibemind-mcp-'));
  const home = path.join(root, '用户记忆');
  const a = path.join(root, '项目 A'), b = path.join(root, '项目 B');
  for (const directory of [a, b]) fs.mkdirSync(path.join(directory, '.git'), { recursive: true });
  const clients = [];
  t.after(async () => {
    await Promise.all(clients.map(({ client }) => client.close()));
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('vibemind-mcp-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  async function connect(mode = 'legacy') {
    const client = new Client({ name: 'vibemind-test', version: '1.0.0' }, { versionNegotiation: { mode } });
    const transport = new StdioClientTransport({ command: process.execPath, args: [serverScript], env: { ...process.env, VIBEMIND_HOME: home }, stderr: 'pipe' });
    clients.push({ client, transport });
    await client.connect(transport);
    return { client, transport };
  }
  return { root, home, a, b, connect };
}
async function call(client, command, args = {}) {
  const result = await client.callTool({ name: `vibemind_${command}`, arguments: args });
  assert.equal(result.isError, undefined, JSON.stringify(result));
  assert.equal(result.structuredContent.ok, true);
  return result.structuredContent;
}

test('真实 stdio：发现工具、只读不初始化、错误可识别、正常关闭', { timeout: 20_000 }, async t => {
  const f = session(t), { client, transport } = await f.connect();
  const list = await client.listTools();
  assert.equal(list.tools.length, 11);
  assert.match(client.getInstructions(), /alreadyExplained=true/);
  assert.match(client.getInstructions(), /缺少 applied 证据不能作为重讲理由/);
  assert.equal((await call(client, 'status', { projectPath: f.a })).initialized, false);
  await call(client, 'user'); await call(client, 'projects');
  assert.equal(fs.existsSync(f.home), false);
  assert.equal(fs.existsSync(path.join(f.a, '.vibemind')), false);
  const error = await client.callTool({ name: 'vibemind_context', arguments: { projectPath: f.a } });
  assert.equal(error.isError, true);
  assert.equal(error.structuredContent.error.code, 'NOT_INITIALIZED');
  await client.close();
  assert.equal(transport.pid, null);
});

test('两个 stdio 服务共享解释记录、并发冲突；现代协议和重启保留记忆', { timeout: 30_000 }, async t => {
  const f = session(t), one = await f.connect(), two = await f.connect({ pin: '2026-07-28' });
  const a = await call(one.client, 'init', { projectPath: f.a });
  await call(two.client, 'init', { projectPath: f.b });
  await call(one.client, 'record_user', { projectPath: f.a, expectedRevision: 0, profile: '使用中文；不要重复解释。' });
  await call(one.client, 'record', {
    projectPath: f.a, expectedRevision: 0,
    cards: [{ id: 'cors-case', title: 'CORS 案例', content: '已解释基本原理；应用证据未知。' }],
    concepts: [{ id: 'cors', title: '跨域资源共享', aliases: ['CORS', '跨域'] }],
    evidence: [{ id: 'cors-explained', conceptId: 'cors', cardId: 'cors-case', kind: 'explained', scope: '同源限制与允许来源', summary: '已结合真实 Vue 与 FastAPI 调用解释。', codeLocation: 'api/main.py:12' }],
  });
  const context = await call(two.client, 'context', { projectPath: f.b, topic: '跨域' });
  assert.equal(context.learning.alreadyExplained, true);
  assert.equal(context.learning.guidance, 'skip_covered_scope');
  assert.equal(context.learning.explanationSummaries[0].projectId, a.projectId);
  assert.equal(context.userProfile, '使用中文；不要重复解释。');
  assert.equal(context.cardIndex.length, 0);
  const writes = await Promise.all([one.client, two.client].map((client, index) => client.callTool({ name: 'vibemind_record', arguments: { projectPath: f.a, expectedRevision: 1, profile: `并发观察 ${index}` } })));
  assert.equal(writes.filter(value => !value.isError).length, 1);
  assert.equal(writes.find(value => value.isError).structuredContent.error.code, 'CONFLICT');
  await one.client.close(); await two.client.close();
  const restarted = await f.connect();
  assert.equal((await call(restarted.client, 'knowledge', { conceptId: 'cors' })).alreadyExplained, true);
  assert.equal((await call(restarted.client, 'context', { projectId: a.projectId })).revision, 2);
  const output = path.join(f.root, 'backup.sqlite');
  assert.equal((await call(restarted.client, 'backup', { output })).backupFile, output);
  assert.ok(fs.statSync(output).size > 0);
});

test('stdio 大输入提交前拒绝，旧大响应明确报错且连接可继续修正记录', { timeout: 20_000 }, async t => {
  const f = session(t), { client } = await f.connect();
  const transportErrors = []; client.onerror = error => transportErrors.push(error.message);
  await call(client, 'init', { projectPath: f.a });
  const rejected = await client.callTool({ name: 'vibemind_record_user', arguments: { projectPath: f.a, expectedRevision: 0, profile: 'x'.repeat(6 * 1024 * 1024) } });
  assert.equal(rejected.isError, true); assert.equal(rejected.structuredContent.error.code, 'INPUT_TOO_LARGE');
  const longPath = await client.callTool({ name: 'vibemind_status', arguments: { projectPath: path.join(f.root, 'x'.repeat(6 * 1024 * 1024)) } });
  assert.equal(longPath.isError, true); assert.equal(longPath.structuredContent.error.code, 'INPUT_TOO_LARGE');
  assert.equal((await call(client, 'user')).userRevision, 0);
  const oldProfile = 'x'.repeat(6 * 1024 * 1024);
  const db = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { db.prepare('UPDATE user_profile SET revision = 7, profile = ? WHERE id = 1').run(oldProfile); } finally { db.close(); }
  const oversized = await client.callTool({ name: 'vibemind_user', arguments: {} });
  assert.equal(oversized.isError, true); assert.equal(oversized.structuredContent.error.code, 'RESPONSE_TOO_LARGE');
  assert.equal(execute('user', { home: f.home }).userProfile, oldProfile);
  assert.equal((await call(client, 'record_user', { projectPath: f.a, expectedRevision: 7, profile: '短摘要' })).userRevision, 8);
  const result = await client.callTool({ name: 'vibemind_user', arguments: {} });
  assert.deepEqual(JSON.parse(result.content[0].text), result.structuredContent);
  assert.equal(result.structuredContent.userProfile, '短摘要');
  assert.ok(Buffer.byteLength(JSON.stringify(result), 'utf8') < LIMITS.responseBytes);
  const unknownField = 'x'.repeat(6 * 1024 * 1024);
  const damaged = JSON.stringify({ schemaVersion: 1, revision: 0, mode: 'active', profile: '', projectMap: '', cards: [], decisions: [], [unknownField]: true });
  const corrupted = new DatabaseSync(path.join(f.home, 'memory.sqlite'));
  try { corrupted.prepare('UPDATE projects SET state = ?').run(damaged); } finally { corrupted.close(); }
  const error = await client.callTool({ name: 'vibemind_context', arguments: { projectPath: f.a } });
  assert.equal(error.isError, true); assert.equal(error.structuredContent.error.code, 'INVALID_STATE');
  assert.ok(Buffer.byteLength(JSON.stringify(error), 'utf8') < 32 * 1024);
  assert.equal((await call(client, 'user')).userRevision, 8);
  const preserved = new DatabaseSync(path.join(f.home, 'memory.sqlite'), { readOnly: true });
  try { assert.equal(preserved.prepare('SELECT state FROM projects').get().state, damaged); } finally { preserved.close(); }
  assert.deepEqual(transportErrors, []);
});

test('stdio 来源暂停拒绝全局更新，其他来源和显式记忆纠错仍正常', { timeout: 20_000 }, async t => {
  const f = session(t), { client } = await f.connect();
  await call(client, 'init', { projectPath: f.a }); await call(client, 'init', { projectPath: f.b });
  await call(client, 'record_user', { projectPath: f.a, expectedRevision: 0, profile: '中文' });
  await call(client, 'pause', { projectPath: f.a });
  const paused = await client.callTool({ name: 'vibemind_record_user', arguments: { projectPath: f.a, expectedRevision: 1, profile: '中文' } });
  assert.equal(paused.isError, true); assert.equal(paused.structuredContent.error.code, 'PAUSED');
  assert.equal((await call(client, 'record_user', { projectPath: f.b, expectedRevision: 1, profile: '中文；摘要' })).userRevision, 2);
  await call(client, 'record', {
    projectPath: f.b, expectedRevision: 0,
    cards: [{ id: 'case', title: '误记案例', content: '等待核对' }],
    concepts: [{ id: 'cors', title: '跨域', aliases: ['误记别名'] }],
    evidence: [{ id: 'mistake', conceptId: 'cors', cardId: 'case', kind: 'explained', scope: '局部内容', summary: '后来被指出不准确' }],
  });
  await call(client, 'record', { projectPath: f.b, expectedRevision: 1, retractEvidence: ['mistake'], removeAliases: [{ conceptId: 'cors', alias: '误记别名' }] });
  assert.equal((await call(client, 'knowledge', { conceptId: 'cors' })).alreadyExplained, false);
  assert.equal((await call(client, 'knowledge', { topic: '误记别名' })).conceptId, null);
});
