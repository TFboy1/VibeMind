# 技术说明与完整使用指南

VibeMind 是一套面向 AI 编程过程的本地工具，由 **Skill、CLI 和本地 stdio MCP** 组成。Skill 负责引导 AI 结合任务和项目讲解；CLI 与 MCP 使用同一份本机 SQLite 学习记忆。

本仓库没有前端页面或前端构建脚本。

## 运行要求

- Node.js **22.20.0 或更新版本**。独立 CLI 使用 Node.js 内置模块；本地 MCP 使用仓库中的依赖。
- 支持 Agent Skills 的 AI 开发工具。连接 MCP 的工具还需要支持 stdio MCP。

## 安装并调用 Skill

在当前项目安装：

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

或安装到 Codex 用户级目录：

```sh
npx skills add TFboy1/VibeMind --skill vibemind --agent codex --global --copy
```

请保留完整的 `skills/vibemind/` 目录，包括 `SKILL.md`、`NOTICE.md`、`references/` 和 `scripts/`。只复制 `SKILL.md` 会缺少引导规范与 CLI。

安装 Skill 不会自动初始化项目，也不会自动启用引导。在目标项目中明确调用 VibeMind，例如：

> 用 VibeMind 陪我开发这个项目。请先查看现有代码和约束，再结合我的想法讨论方案。

用户可以随时要求解释概念、只讨论方案、跳过讲解，或按已确认的方案直接实现。设计确认不会自动授权尚未讨论的代码改动。

## 配置本地 MCP（可选）

将完整仓库放在固定目录，在仓库根目录运行：

```sh
npm ci
```

在支持 stdio MCP 的宿主中添加配置，并把示例路径换成仓库的绝对路径：

```json
{
  "mcpServers": {
    "vibemind": {
      "command": "node",
      "args": ["D:/tools/VibeMind/scripts/mcp.mjs"]
    }
  }
}
```

宿主会启动并管理 MCP 进程，不需要 HTTP 服务或端口。CLI 只使用 Node.js 内置模块，MCP 使用仓库中的官方 SDK。MCP 提供 23 个工具，涵盖初始化、上下文、记录、暂停/恢复、知识查询、分页、提交回执、诊断、配置、迁移、纠错、删除、遗留锁处理和在线备份。完整参数见[记录规范](../skills/vibemind/references/records.md)。

## Claude Code、Codex、WorkBuddy 共享记忆

各宿主可以保留自己的 Skill 安装目录，学习库独立保存在用户目录的 `~/.vibemind/memory.sqlite`。不必一次安装全部宿主；后来安装的软件可以先用 `doctor` 或 `status` 核对实际库路径、`storeId`、软件/API/数据库版本和项目 ID，再读取原有学习记录与暂停状态。

用户选择自定义目录时运行一次：

```sh
node "<技能目录>/scripts/vibemind.mjs" configure --memory-home "<本机共享记忆绝对目录>"
node "<技能目录>/scripts/vibemind.mjs" doctor --cwd "<项目绝对目录>"
```

配置保存在 `~/.vibemind/config.json`，以后安装的宿主读取同一配置。`VIBEMIND_HOME` 环境变量优先于配置文件；`VIBEMIND_CONFIG` 可指定另一绝对配置文件。配置不会复制或合并已有数据库；如果身份绑定到了错误数据库，或记录缺失，程序会拒绝创建空库。旧 MCP 进程需重启，并核对返回的实际连接信息。

支持同一学习者、同一系统环境、可靠本机文件系统上的多个宿主。Windows 与 WSL 的不同写入器不能直接写同一文件；NAS/SMB、实时同步活动数据库、跨机器或离线数据库合并不在当前版本范围内。

## 记忆和项目数据

- 用户档案和跨项目概念图谱保存在用户目录的 SQLite 数据库中。
- 项目目录保存 `.vibemind/project.json` 身份文件，用于绑定项目 ID 和数据库 ID。初始化中断会留下待完成标记，可由 `init` 安全接续；项目地图、观察、知识卡和决定保存在数据库中。
- 移动项目目录后可按项目 ID 接续。复制目录若与仍存在的原项目共享 ID，会报告冲突；要建立独立项目时使用 `init --new-project`。
- 首次 `init` 会校验并导入旧 JSON，保留旧文件、暂停状态和未完成决定。格式 1/2 的 SQLite 数据库先用 `migrate` 在线备份升级，再初始化绑定。单纯读取不会迁移、初始化或恢复项目。
- 所有业务写入（包括暂停/恢复）都要带上预期的数据库/项目 ID、版本和唯一操作编号。并发冲突时先读取完整内容并整合；请求丢失响应后可以查询回执，使用相同请求重试不会重复提交或翻转当前模式。
- 默认 `summary` 共享通用讲解范围和摘要，不共享其他项目的卡片正文与代码位置；敏感项目可选 `private`，用户明确允许共享完整案例时可选 `full`。摘要文字仍需避免私密内容；这不是多用户权限系统。
- AI 实际讲解后记录 `explained` 证据；用户实际应用另记为 `applied`。没有应用记录不代表需要重新讲解。
- 用户指出误记时可以撤销证据或更正别名，旧内容保留修订。`correct` 支持更正已删除目录或暂停项目的旧来源；`purge` 通过项目 ID 确认删除活动记录及修订，但不会删除备份、旧 JSON 或宿主聊天。
- 通用档案更新也必须标明来源项目。来源项目暂停时，拒绝通过该项目更新；其他活跃项目仍可使用共享档案。
- 保存的单条新字符串最多 128 KiB，单批输入和项目状态 JSON 最多 512 KiB，MCP 业务响应最多 2 MiB。CLI stdin 有输入上限，MCP 传输缓冲为 1 MiB；超限时不会部分提交。精简写入回执不会截断 `context` 中的未完成决定；旧记录可用 CLI 或 `get` 读取；证据超过 100 条时用 `history` 分页。

## CLI 常用命令

把 `<技能目录>` 替换成实际安装位置，把 `<项目目录>` 替换成项目绝对路径：

```sh
node "<技能目录>/scripts/vibemind.mjs" status --cwd "<项目目录>"
node "<技能目录>/scripts/vibemind.mjs" context --cwd "<项目目录>"
node "<技能目录>/scripts/vibemind.mjs" context --cwd "<项目目录>" --topic "CORS"
node "<技能目录>/scripts/vibemind.mjs" knowledge --topic "跨域" --limit 20 --depth 2
node "<技能目录>/scripts/vibemind.mjs" get --cwd "<项目目录>" --kind card --id "<知识卡ID>"
node "<技能目录>/scripts/vibemind.mjs" history --concept-id "cors" --limit 100
node "<技能目录>/scripts/vibemind.mjs" operation --operation-id "<提交时的UUID>"
node "<技能目录>/scripts/vibemind.mjs" backup --output "<绝对路径>/memory-backup.sqlite"
```

CLI 支持 JSON 输出；`context` 默认输出 Markdown。主题查询会返回解释状态、相关知识卡、证据及其来源。关联深度最多两跳。备份使用 SQLite 在线备份接口，不会覆盖已有文件。

完整参数、MCP 工具和记录格式见[记录规范](../skills/vibemind/references/records.md)，引导行为见[教学规范](../skills/vibemind/references/teaching.md)。

## 0.5.0：全域知识发现

根据项目与模糊目标定位知识锚点，覆盖 roadmap.sh 全部公开路线及主题，并按需在线检索。宿主 Agent 提取领域和同义查询、判断相邻语义；本地 FTS5 召回与记忆规则筛选最多三个机会。没有记录的能力保持 `unknown`；已有讲解只按实际 `scope` 跳过。

- 新增 `discover`（search/recommend）、`opportunities`、`extensions`，不需要独立模型 API 或新运行依赖。
- 活跃伴学项目默认在任务完成后最多邀请一次；拒绝、暂缓或直接实现后停止本会话提醒；缺少真实会话 ID 时只列候选。接受后才引导，不自动引入技术或扩大实施授权。
- 候选与反馈用 `record.growth` 保存；全局提醒频率及路线范围用 `record-user.learningPreferences` 更新。原讲解/应用证据继续有效。
- 官方源失败时按实际能力尝试镜像；支持 `configure --roadmap-mirrors JSON`。公开资料缓存与学习库分开，离线可复用已读取资料；来源全不可用时继续原任务。

详细参数与示例见[发现规范](../skills/vibemind/references/discovery.md)。原始 roadmap 内容不随包分发，来源与许可见 [`NOTICE.md`](../skills/vibemind/NOTICE.md)。

本版不包含向量模型、全量教程同步、自动 Hook、可执行插件、独立能力评级或成长地图。

## 从 0.2/0.3/0.4 升级到 0.5.0

1. 更新各宿主的完整 Skill、CLI 和 MCP，重启 MCP 进程，用 `doctor` 确认实际记忆库路径。
2. 对格式 1/2 的数据库运行 `node "<技能目录>/scripts/vibemind.mjs" migrate`。程序持有写锁，先保存并验证旧库在线备份，再升级为格式 3；失败回滚，旧写入器之后拒绝写入。
3. 对已有项目运行 `init --cwd "<项目目录>"`，接续绑定同一项目，保留 revision、暂停状态和学习历史。不要用 `--new-project` 代替升级。
4. 所有业务写入携带 `expectedStoreId`、`expectedProjectId`、`expectedRevision`、`operationId`；`record-user` 的版本使用 `userRevision`。新请求生成 UUID；同一请求重试时沿用原输入和编号。

格式 1 数据库可以只读，写入前必须明确迁移。恢复备份时先停止所有写入者、保留现库并离线核验；恢复后用 `migrate --rotate-store-id --expected-store-id "<当前库ID>"` 轮换身份，再用 `init --rebind-store-id "<新库ID>"` 接续，以拒绝恢复前的旧请求。程序不会自动覆盖活动数据库。

## 检查与打包

运行项目检查：

```sh
npm ci
npm run check
npm test
```

测试覆盖宿主后续安装、数据库绑定、旧写入器拒绝、初始化断点恢复、并发、提交回执重试、暂停、摘要/私有共享、历史分页、纠错/删除、备份恢复代际，以及真实 stdio MCP 的发现、并发、关闭和重启。当前修复与 72 项边界的范围见[边界审查](MEMORY_BOUNDARIES.md)；真实三个产品中的模型行为仍需分别接入验收。

### 构建完整 Skill ZIP

在仓库根目录用 PowerShell 打包。归档根层直接包含 `SKILL.md`、`NOTICE.md`、`references/` 和 `scripts/`。MCP 仍通过完整仓库及 `npm ci` 使用。

```powershell
New-Item -ItemType Directory -Path dist -Force | Out-Null
Compress-Archive -Path skills/vibemind/* -DestinationPath dist/vibemind-0.5.0.zip
```

若同名 ZIP 已存在，请保留原文件或改用其他输出名称；不要把数据库、缓存或 `node_modules` 放进 Skill ZIP。