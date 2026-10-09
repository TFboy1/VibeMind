<div align="center">

<img src="assets/banner.png" alt="VibeMind — Build with AI. Understand what you build." width="100%" />

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-当前语言-red?style=flat-square)](#)
[![English](https://img.shields.io/badge/English-README-blue?style=flat-square)](docs/README_EN.md)
[![日本語](https://img.shields.io/badge/日本語-README-blue?style=flat-square)](docs/README_JA.md)
[![Français](https://img.shields.io/badge/Français-README-blue?style=flat-square)](docs/README_FR.md)
[![Deutsch](https://img.shields.io/badge/Deutsch-README-blue?style=flat-square)](docs/README_DE.md)

<br/>

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20Skill-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](https://skills.sh/tfboy1/vibemind/vibemind)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](#运行要求)
[![License](https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge)](LICENSE)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)

<br/>

**让用户参与设计，让 AI 实现，把真实项目变成能看懂、能接手的代码。**

面向 Qoder、WorkBuddy、TRAE 的中文伴学 Skill ＋本地 MCP 与 CLI。<br/>
沿用你的 AI 工具和模型，在真实项目里积累知识卡与设计思考。

</div>

## VibeMind 是什么

VibeMind 把伴学流程和跨项目记忆结合起来：Skill 引导思考与实现，本地 MCP/CLI 共用 SQLite 记忆图谱。个人档案、知识卡和学习证据保存在用户目录；项目内只保留身份文件。无需额外账户或模型 API，MCP 进程由宿主自动启动和关闭。

## 怎么学

用户说出需求和思路，AI 结合实际项目解释、讨论取舍，再实现明确授权的方案。不了解概念时直接讲清楚；可以说“给我建议”“跳过这次练习”“直接实现”。用户水平按实际交流、具体话题判断，没有开场分级问卷。

项目地图、项目观察、知识卡和未完成决定按项目隔离。通用偏好和概念讲解历史跨项目共享，图谱连接卡片、概念和来源证据，区分“AI 解释过”与“用户已有应用证据”。

**已经解释过的概念，默认不重复解释。** 每次讲解前查询精确概念 ID 或明确别名，已解释就直接讨论本次应用和新差异；没有应用证据也不会触发重讲。用户要求复习或仍不理解时可以再讲。旧卡先核对原文，子概念和模糊候选不会被误判为已解释。

## 运行要求

- Node.js **22.20.0 或更新版本**，与当前 skills CLI 的最低要求一致。
- 能读取项目文件、运行本地命令的 AI 工具。写入项目仍遵循宿主权限。
- CLI 仅使用 Node 标准库（包含 SQLite），无第三方运行依赖；skills.sh 安装需要 npx。MCP 服务另需在仓库执行一次 `npm ci` 安装官方 SDK。

## 安装

### 方法一：对 Agent 说一句话

把下面这一句话发给你正在使用的 Agent，让它根据当前工具完成安装：

```text
请阅读 https://github.com/TFboy1/VibeMind 的 README，把 vibemind 安装为我当前项目中正在使用的 AI 工具的技能，检查 Node.js ≥22.20.0，保留完整 references、scripts 和 NOTICE 文件，不覆盖已有技能或学习记录、不修改全局配置，并告诉我如何启用伴学。
```

Agent 有文件与终端权限时，可以使用 skills CLI；WorkBuddy 等支持原生导入的工具也可使用完整技能 ZIP。若环境无法自动导入，Agent 应说明需要你操作的入口，避免声称尚未完成的安装已经成功。

### 方法二：人工安装

#### 使用 skills CLI

在**要学习的项目目录**打开终端运行：

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

按提示选择工具；也可以明确指定：

```sh
# Qoder
npx skills add TFboy1/VibeMind --skill vibemind --agent qoder --copy

# Qoder CN
npx skills add TFboy1/VibeMind --skill vibemind --agent qoder-cn --copy

# TRAE CN
npx skills add TFboy1/VibeMind --skill vibemind --agent trae-cn --copy

# TRAE 国际版
npx skills add TFboy1/VibeMind --skill vibemind --agent trae --copy

# Codex 用户级安装
npx skills add TFboy1/VibeMind --skill vibemind --agent codex --global --copy
```

`--copy` 使用普通文件复制，便于 Windows 安装。默认是项目级安装，不自动修改全局配置或 Hook。[skills CLI 文档](https://github.com/vercel-labs/skills)

#### 导入完整 ZIP：适合 WorkBuddy 与原生技能入口

1. 从当前 0.2.0 源码构建完整技能 ZIP，方法见下方。旧 0.1.0 包仍使用项目 JSON，升级前不要与新 MCP 混用。
2. 在 WorkBuddy 的“技能 → 添加技能 → 上传技能”入口导入该 ZIP；Qoder、TRAE 支持原生导入时也可使用同一个包。
3. 确认出现 `vibemind`，在目标项目中选择它或用自然语言启用。

技能 ZIP 的根目录直接包含以下内容：

```text
SKILL.md
NOTICE.md
references/
scripts/vibemind.mjs
```

请保留整个包，仅上传 SKILL.md 会丢失教学参考及 CLI。下载 GitHub 的整个仓库 ZIP 时，先找到 `skills/vibemind/`，原生导入应打包它内部的文件。[WorkBuddy 官方说明](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)

当前 skills CLI 没有独立 WorkBuddy 目标，使用其原生导入入口。[支持目标](https://github.com/vercel-labs/skills#supported-agents)

<details>
<summary>从本地源码安装或自行构建 ZIP</summary>

```sh
git clone https://github.com/TFboy1/VibeMind.git
```

随后回到目标项目，运行 `npx skills add /absolute/path/to/VibeMind --skill vibemind --agent qoder --copy`。Windows 路径加引号，例如 `"D:\pycharmProject\VibeMind"`。

在仓库目录用 PowerShell 构建导入包：

```powershell
New-Item -ItemType Directory -Path dist -Force | Out-Null
Compress-Archive -Path .\skills\vibemind\* -DestinationPath .\dist\vibemind-0.2.0.zip -Force
```

</details>

完成安装后，在目标项目的宿主技能入口选择 VibeMind，或明确调用它。实际加载入口随工具版本而异。

### 本地 MCP：配置一次，跨项目共用记忆

把完整仓库保留在固定目录，在仓库运行一次 `npm ci`。在支持 stdio MCP 的宿主添加下列配置，替换实际仓库绝对路径；Windows 可用 `D:/pycharmProject/VibeMind/scripts/mcp.mjs`，宿主需能找到 Node.js 22.20+。

```json
{
  "mcpServers": {
    "vibemind": {
      "command": "node",
      "args": ["/absolute/path/to/VibeMind/scripts/mcp.mjs"]
    }
  }
}
```

宿主通过标准输入输出管理进程，无需 HTTP 服务或端口。多个工具各自启动进程，共用默认 `~/.vibemind/memory.sqlite`。更换位置时在各宿主配置相同的绝对 `VIBEMIND_HOME`；默认使用当前操作系统用户目录。

Skill ZIP 包含独立 CLI；MCP 从完整仓库运行，不能只上传 SKILL.md 或单独复制 MCP 入口。Skill 优先使用可用的 MCP，缺少 MCP 时通过 CLI 接续同一数据库。旧 Skill 安装应升级，避免旧工具继续写 JSON。

连接 MCP 或安装 Skill 本身不启用项目伴学。stdout 只输出 MCP 协议；日志和 Node 22 的 SQLite 警告在 stderr。由用户明确启用 VibeMind 后才创建项目记录。

## 开始使用

在目标项目里说：

> 使用 VibeMind 边做边学。我想给这个 Vue＋FastAPI 项目增加库存预留，请先看看已有代码，再和我讨论实现思路。

安装本身不启用每个项目。启用后，普通开发请求保持学习优先节奏，AI 会围绕有意义的设计决定邀请推理。已经明确授权的范围不会反复确认。

常用表达：

- “这个概念我不懂，先讲清楚。”
- “跳过这次练习，直接按已确认方案实现。”
- “回顾跨域相关知识卡。”
- “暂停伴学。”
- “恢复 VibeMind 伴学，继续未完成的决定。”

新会话和跨工具接续通过技能入口恢复；首版没有自动 Hook。安装 Skill、开启新会话或读取暂停状态，都不会自动把待确认设计升级为实施授权。

## CLI 使用

CLI 由 Skill 调用，也能独立查看。将脚本路径指向当前安装的技能目录：

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic 跨域
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs user
node skills/vibemind/scripts/vibemind.mjs projects
node skills/vibemind/scripts/vibemind.mjs knowledge --concept-id cors
node skills/vibemind/scripts/vibemind.mjs knowledge --topic 跨域 --limit 20 --depth 2
node skills/vibemind/scripts/vibemind.mjs context --project-id <项目UUID>
node skills/vibemind/scripts/vibemind.mjs backup --output /absolute/path/to/backup.sqlite
```

读取不写入、不迁移。context 默认 Markdown，`--json` 和其他命令返回 JSON。错误在 stderr、退出码 1；Node 22 SQLite 警告也可能出现在 stderr。MCP 参数 projectPath/projectId、topic/conceptId 对应 CLI 参数，失败为 `isError: true`。

### 更新记录

先读取 context 得到当前 revision，再通过 stdin 提交 JSON。下面仅演示格式，内容必须换成真实代码与交流证据。

```sh
node skills/vibemind/scripts/vibemind.mjs record --cwd /path/to/project <<'JSON'
{
  "expectedRevision": 0,
  "cards": [
    {
      "id": "inventory-reservation",
      "title": "库存预留与并发更新",
      "content": "当前方案仍在讨论。用户能说明库存不能为负的目标，但尚未选择并发控制方案。下一步结合实际 FastAPI 接口和存储讨论；暂不记录为已掌握。"
    }
  ],
  "decisions": [
    {
      "id": "inventory-concurrency",
      "title": "同时预留库存时如何避免冲突",
      "stage": "reasoning",
      "content": "等待用户根据已读取的存储方案提出实现思路；尚未授权编码。"
    }
  ]
}
JSON
```

PowerShell 应明确设置管道 UTF-8；路径与数据分开传入：

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new()
$vibemindCli = 'D:\path to skill\scripts\vibemind.mjs'
$vibemindProject = 'D:\项目目录'
$vibemindInput = @'
{"expectedRevision":0,"profile":"根据本次交流填写观察，未知部分保持未知。"}
'@
$vibemindInput | & node $vibemindCli record --cwd $vibemindProject
```

卡片与决定按稳定 ID 更新，未提交记录保留。profile 是当前项目观察，projectMap 是地图；替换前整合旧内容。通用档案另用 record-user，输入 expectedRevision（刚读取的 userRevision）和 profile。版本冲突重读并整合，暂停后拒绝项目 record。

record 还支持 concepts、links、evidence。实际讲解后及时保存 explained 证据及概念 ID、范围、摘要和来源卡片；实际应用另存 applied，不能覆盖解释证据。context 主题查询的 `learning.alreadyExplained` 或 knowledge 的 `alreadyExplained` 指示是否跳过基础解释。完整示例及 MCP 参数见 [记录规范](skills/vibemind/references/records.md)。

## 存储与故障恢复

唯一活动记忆源是用户目录 SQLite；项目内 `.vibemind/project.json` 只有格式版本和 projectId。用户和项目分别维护 revision；版本检查、图谱/记录更新和上一版快照在同一事务内完成，使用默认 DELETE 回滚日志、FULL 同步和 3 秒锁等待。Git/worktree 定位、身份及数据库路径保留链接保护。

首次 init 校验并导入旧 state.json，保留原文件和 backups 的字节、暂停状态、卡片及全部未完成决定。旧 profile 仍属于项目观察，读取不迁移。旧卡缺少结构化字段时先核对原文，不能把所有旧卡自动标为已解释。

移动项目按 ID 接续，下一次 init/写入同步登记路径。原登记目录仍存在的复制项目会报告 ID 冲突，明确创建独立项目时用 `init --new-project`；项目记录从空状态开始，共享学习历史保留。删除项目目录不删除数据库记忆，可用 projects 和 context --project-id 查看。

建议在你自己的项目中把 `.vibemind/` 加入 `.gitignore`。CLI 不会代替你编辑忽略规则。学习数据由宿主读取时会进入其模型上下文，沿用宿主的数据设置；VibeMind 不额外上传记录。

- **版本冲突**：重读 context/user 并整合，不能只换 revision。
- **锁冲突**：数据库等待最多 3 秒，不频繁轮询或抢锁；初始化项目锁遗留时需核实 PID 已退出，再人工删除。
- **旧 JSON 又被修改**：报告 LEGACY_CHANGED，不静默覆盖；升级旧工具，保留旧文件并核对整合，流程见记录规范。
- **损坏或版本不支持**：保留文件，不重置或创建空记录替代。
- **备份/写入失败**：事务回滚或保留已有数据，排除问题后重读；身份锁释放失败先用 status 核实。

上一版快照在 snapshots 表。独立备份使用 backup 命令的 SQLite 在线备份接口，不直接复制活动数据库；已有目的文件不覆盖。恢复前停止全部宿主进程，保留现有数据库并校验备份；不直接编辑活动数据库/身份文件，没有自动重置或恢复写回命令。

## 验证

```sh
npm ci
node --check skills/vibemind/scripts/vibemind.mjs
node --check scripts/mcp.mjs
node --test
npx skills add . --list
```

测试使用隔离的临时用户目录，覆盖跨项目档案、精确/别名解释状态、候选/子概念、两跳查询、幂等更新、只读恢复、全部决定、暂停、旧 JSON/BOM 迁移、事务回滚、备份、移动/复制、中文路径和 Git/worktree/junction。真实 stdio 测试覆盖工具发现、旧/现代协议、两个进程并发、关闭与重启。

自动测试检查程序行为，教学质量由宿主模型及实际对话决定。人工教学验收：

| 场景 | 应观察到的行为 |
|---|---|
| 给出可行或错误思路 | 围绕真实约束反馈；不先提供整套答案，不把自信当作掌握 |
| 完全不懂当前概念 | 直接解释，回到一个可处理的问题，不反复逼猜 |
| 只确认设计 | 保存确认范围，继续未决问题，不自动写应用代码 |
| 已明确授权实施 | 完成授权范围，不重复要求批准同一范围 |
| 要求跳过当前练习 | 按授权推进，保留其他未完成决定 |
| 长记录后重启或换工具 | 恢复全部未完成决定，不把重启当作授权 |
| 暂停后换会话 | 保持暂停；查看知识卡不会自动恢复 |
| 用户只听过解释 | 记录已解释，保持应用能力证据未知 |
| A 讲过后切到 B 或重启 | 先查全局历史，跳过基础解释，只讲应用和差异 |
| 只有相似词或父概念讲过 | 不把候选/父概念当作当前概念已解释 |
| 已讲过但明确要求复习 | 可以重讲，换例子或缩小问题 |

由使用者在三个宿主内完成这些体验验证。本项目没有前端产物。

## 来源与独立贡献

本项目借鉴并改编 [VibeWise](https://github.com/nykooi1/vibe-wise) 的学习优先设计，包括用户拥有设计决定权、直接解释概念、检查点语义、忠于证据的记录、项目地图及未完成决定恢复；项目边界与备份保护也参考了原作。原作作者为 Noah Kim，许可为 MIT。

VibeMind 新增的工程与产品组织包括：

- 随标准 Skill 分发的 Node CLI，供多个宿主使用同一状态管理入口。
- 本地 stdio MCP、用户级 SQLite、独立 revision、事务快照和在线备份、项目身份及旧 JSON 迁移。
- 稳定 ID 的卡片、概念、别名和证据图谱，跨项目查询讲解历史，默认避免重复解释。
- 中文教学规范、通过交流按话题观察能力、国内宿主分发说明。

CLI 与测试由本项目编写，教学指令按本项目流程用中文组织。来源与两份 MIT 许可随技能包保留，见 [NOTICE.md](skills/vibemind/NOTICE.md)。

## 支持项目

如果 VibeMind 对你有帮助，可以通过上方的爱发电或 Buy Me a Coffee 支持维护与更新。打赏入口与维护者的 [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) 项目保持一致。
