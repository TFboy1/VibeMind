<div align="center">

<img src="assets/banner.png" alt="VibeMind：和 AI 一起构建，也理解所构建的项目" width="100%" />

# VibeMind

**面向 Vibe Coding 的自适应编程引导工具链**

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20VibeMind-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](https://skills.sh/tfboy1/vibemind/vibemind)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)
[![GitHub Stars](https://img.shields.io/github/stars/tfboy1/vibemind?style=for-the-badge&logo=github&color=yellow)](https://github.com/TFboy1/VibeMind/stargazers)
[![License](https://img.shields.io/github/license/tfboy1/vibemind?style=for-the-badge&color=blue)](LICENSE)

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=flat-square&logo=nodedotjs&logoColor=white)](#运行要求)
[![MCP](https://img.shields.io/badge/MCP-local%20stdio-7c3aed?style=flat-square)](https://modelcontextprotocol.io/)
[![SQLite](https://img.shields.io/badge/Memory-SQLite-003b57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-当前语言-red?style=flat-square)](#)
[![English](https://img.shields.io/badge/English-README-blue?style=flat-square)](docs/README_EN.md)
[![日本語](https://img.shields.io/badge/日本語-README-blue?style=flat-square)](docs/README_JA.md)
[![Français](https://img.shields.io/badge/Français-README-blue?style=flat-square)](docs/README_FR.md)
[![Deutsch](https://img.shields.io/badge/Deutsch-README-blue?style=flat-square)](docs/README_DE.md)

</div>

VibeMind 把编程引导放进真实的 AI 开发流程。它由 Skill、本地 stdio MCP 和 CLI 组成：Skill 结合当前任务、项目代码和用户在不同主题上的熟悉程度调整引导深度；MCP 与 CLI 共用本机 SQLite 记忆，让项目上下文、设计决定和概念讲解历史能跨项目与会话接续，也能供指向同一数据库的多个本机宿主共享。

## 主要能力

- **按主题调整引导**：从真实代码和任务约束出发，讨论实现取舍；陌生概念直接解释，熟悉内容聚焦当前应用和新差异。
- **默认不重复基础讲解**：每次解释前查询精确概念 ID 或明确别名。已有讲解证据时跳过基础定义；缺少用户应用证据不会触发重讲。相似候选、父概念和未讲过的子概念不会混为一谈。
- **设计过程可接续**：保存项目地图、知识卡和全部未完成决定；跨项目共享通用偏好及概念讲解历史。
- **讲解与应用分别记录**：AI 实际讲解后保存 `explained` 证据；用户实际应用另记为 `applied`。没有应用记录不代表需要重新讲解。
- **本机存储**：无需额外账户、云服务或模型 API。MCP 只通过标准输入输出通信。

> [!NOTE]
> 安装 Skill 或连接 MCP 不会自动初始化项目，也不会自动启用引导。请在目标项目中明确调用 VibeMind；没有自动 Hook 的宿主在新会话中也需要重新调用。

## 开始使用

### 安装 Skill

需要 Node.js **22.20.0 或更新版本**，以及支持 Agent Skills 的 AI 开发工具。

```sh
# 在当前项目中安装
npx skills add TFboy1/VibeMind --skill vibemind --copy

# 或安装到 Codex 用户级技能目录
npx skills add TFboy1/VibeMind --skill vibemind --agent codex --global --copy
```

保留完整的 `skills/vibemind/` 内容，包括 `SKILL.md`、`NOTICE.md`、`references/` 和 `scripts/`。只复制 `SKILL.md` 会缺少引导规范与 CLI。

在项目中明确调用，例如：

> 使用 VibeMind 作为这个项目的编程引导工具。我想给 Vue＋FastAPI 项目增加库存预留，请先查看已有代码和约束，再结合我的思路讨论方案。

用户可以随时要求解释概念、只讨论方案、跳过讲解或按已确认范围直接实现。设计确认不会自动授权尚未讨论的代码改动。

### 配置本地 MCP（可选）

将完整仓库放在固定目录，并在仓库运行一次：

```sh
npm ci
```

在支持 stdio MCP 的宿主中添加配置，将示例路径替换为仓库的绝对路径：

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

宿主会启动并管理 MCP 进程；无需 HTTP 服务或端口。CLI 只依赖 Node.js 内置模块，MCP 使用仓库中的官方 SDK。

MCP 提供 `vibemind_init`、`vibemind_status`、`vibemind_context`、`vibemind_record`、`vibemind_pause`、`vibemind_resume`、`vibemind_user`、`vibemind_record_user`、`vibemind_projects`、`vibemind_knowledge` 和 `vibemind_backup` 工具。

多个本机宿主默认共用 `~/.vibemind/memory.sqlite`。若修改 `VIBEMIND_HOME`，需在各宿主中设置相同的绝对目录。

## 记忆如何保存

- 用户档案和跨项目概念图谱保存在用户目录的 SQLite 数据库中。
- 项目目录只保存 `.vibemind/project.json` 身份文件；项目地图、观察、知识卡和决定保存在数据库，并按项目隔离。
- 移动项目目录后可按项目 ID 接续。复制目录若与仍存在的原项目共享 ID，会报告冲突；明确要建立独立项目时使用 `init --new-project`。
- 首次 `init` 会校验并导入旧 JSON，保留旧文件、暂停状态和未完成决定。读取操作本身不会迁移、初始化或恢复项目。
- 项目记录和用户档案使用独立版本号；并发写入发生版本冲突时，应重新读取并整合后再提交。

## CLI

CLI 随 Skill 分发。将 `<技能目录>` 替换为实际安装位置，将 `<项目目录>` 替换为项目绝对路径：

```sh
node "<技能目录>/scripts/vibemind.mjs" status --cwd "<项目目录>"
node "<技能目录>/scripts/vibemind.mjs" context --cwd "<项目目录>"
node "<技能目录>/scripts/vibemind.mjs" context --cwd "<项目目录>" --topic "CORS"
node "<技能目录>/scripts/vibemind.mjs" knowledge --topic "跨域" --limit 20 --depth 2
node "<技能目录>/scripts/vibemind.mjs" backup --output "<绝对路径>/memory-backup.sqlite"
```

用户明确启用 VibeMind 时才运行 `init`。主题查询会返回解释状态、相关知识卡、证据及其来源。关联深度最多两跳，备份使用 SQLite 在线备份接口，且不会覆盖已有文件。

CLI 输出支持 JSON；`context` 默认输出 Markdown。完整参数、MCP 工具和记录格式见[记录规范](skills/vibemind/references/records.md)，引导行为见[教学规范](skills/vibemind/references/teaching.md)。

## 运行要求与验证

- Node.js 22.20.0 或更新版本（内置 SQLite）。
- 配置 MCP 需在仓库安装依赖；独立 CLI 不需要第三方运行依赖。
- 运行项目检查：

```sh
npm ci
npm test
```

测试覆盖项目隔离、跨项目讲解历史、别名与子概念判定、SQLite 迁移与备份、项目移动和复制冲突，以及真实 stdio MCP 的工具发现、并发、关闭和重启。

设计参考及许可信息见 [NOTICE.md](skills/vibemind/NOTICE.md)。
