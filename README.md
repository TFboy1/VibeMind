<div align="center">

<img src="assets/banner.png" alt="VibeMind — Build with AI. Understand what you build." width="100%" />

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-当前语言-red?style=flat-square)](#)
[![English](https://img.shields.io/badge/English-README-blue?style=flat-square)](docs/README_EN.md)
[![日本語](https://img.shields.io/badge/日本語-README-blue?style=flat-square)](docs/README_JA.md)
[![Français](https://img.shields.io/badge/Français-README-blue?style=flat-square)](docs/README_FR.md)
[![Deutsch](https://img.shields.io/badge/Deutsch-README-blue?style=flat-square)](docs/README_DE.md)

<br/>

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20Skill-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](#安装)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](#运行要求)
[![License](https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge)](LICENSE)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)

<br/>

**让用户参与设计，让 AI 实现，把真实项目变成能看懂、能接手的代码。**

面向 Qoder、WorkBuddy、TRAE 的中文伴学 Skill ＋轻量 CLI。<br/>
沿用你的 AI 工具和模型，在真实项目里积累知识卡与设计思考。

</div>

## VibeMind 是什么

VibeMind 把学习优先的教学流程和可靠的本地状态管理结合起来：Skill 引导思考、解释与实现，CLI 保存学习档案、项目地图、知识卡和未完成决定。学习记录保存在当前项目；无需额外账户、模型 API 或后台服务。

## 怎么学

用户说出需求和思路，AI 结合实际项目解释、讨论取舍，再实现明确授权的方案。不了解概念时直接讲清楚；可以说“给我建议”“跳过这次练习”“直接实现”。用户水平按实际交流、具体话题判断，没有开场分级问卷。

每个项目保留学习档案、项目地图、知识卡和未完成决定。知识卡连接实际代码位置和设计理由，区分“AI 解释过”和“用户已有应用证据”。切换工具时，对同一项目重新调用 VibeMind，可继续已有进度。

## 运行要求

- Node.js **22.20.0 或更新版本**，与当前 skills CLI 的最低要求一致。
- 能读取项目文件、运行本地命令的 AI 工具。写入项目仍遵循宿主权限。
- CLI 仅使用 Node 标准库，无第三方运行依赖；使用 skills.sh 安装时还需 npx。

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
```

`--copy` 使用普通文件复制，便于 Windows 安装。默认是项目级安装，不自动修改全局配置或 Hook。[skills CLI 文档](https://github.com/vercel-labs/skills)

#### 导入完整 ZIP：适合 WorkBuddy 与原生技能入口

1. [下载 VibeMind 技能包](https://github.com/TFboy1/VibeMind/releases/latest/download/vibemind-0.1.0.zip)。
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
Compress-Archive -Path .\skills\vibemind\* -DestinationPath .\dist\vibemind-0.1.0.zip -Force
```

</details>

完成安装后，在目标项目的宿主技能入口选择 VibeMind，或明确调用它。实际加载入口随工具版本而异。

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
```

读取不写入。`context` 默认输出 Markdown，加 `--json` 输出 JSON；其他命令输出 JSON。失败写入 stderr 并返回退出码 1。

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

卡片和决定按稳定 ID 更新，未提交的记录保留。`profile`、`projectMap` 替换各自文本，保存前整合仍有效的观察与地图。写入版本冲突时重新读取并整合内容；暂停后 record 会被拒绝。完整格式见 [记录规范](skills/vibemind/references/records.md)。

## 存储与故障恢复

项目内 `.vibemind/state.json` 是唯一活动数据源，Markdown 在查看时生成。更新先备份旧状态，再原子替换文件；版本检查及项目锁避免旧会话覆盖最新记录。目录定位识别 Git/worktree 边界，拒绝符号链接状态路径。

建议在你自己的项目中把 `.vibemind/` 加入 `.gitignore`。CLI 不会代替你编辑忽略规则。学习数据由宿主读取时会进入其模型上下文，沿用宿主的数据设置；VibeMind 不额外上传记录。

- **版本冲突**：重新读取 context，整合新内容后提交。
- **锁冲突**：先确认是否有其他写入；不能根据锁文件年龄自动抢占。进程异常退出时，读取 `.lock` 的 PID，确认该写入进程已退出后，仅人工删除锁文件。
- **状态损坏或版本不支持**：保留文件，检查错误与备份；init 不会清空损坏状态。
- **备份或写入失败**：原状态保留。排除文件系统问题后，重新读取版本再试。
- **锁释放失败**：状态可能已保存，先用 status 核实，避免重复提交。

不直接编辑活动 JSON，也没有自动重置或备份恢复写回命令。人工恢复前应备份当前文件、验证所选备份并确认没有写入进程。

## 验证

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --test
npx skills add . --list
```

测试使用 Node 内置运行器和临时项目，覆盖幂等初始化、稳定 ID 更新、只读上下文、长记录中的未完成决定、暂停恢复、版本冲突、真实进程并发、损坏状态、备份与原子写入失败、中文路径、Git/worktree 隔离和安装路径 junction。

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

由使用者在三个宿主内完成这些体验验证。本项目没有前端产物。

## 来源与独立贡献

本项目借鉴并改编 [VibeWise](https://github.com/nykooi1/vibe-wise) 的学习优先设计，包括用户拥有设计决定权、直接解释概念、检查点语义、忠于证据的记录、项目地图及未完成决定恢复；项目边界与备份保护也参考了原作。原作作者为 Noah Kim，许可为 MIT。

VibeMind 新增的工程与产品组织包括：

- 随标准 Skill 分发的 Node CLI，供多个宿主使用同一状态管理入口。
- 单一 JSON 数据源、乐观版本检查、项目锁、原子写入及版本备份。
- 按稳定 ID 更新的知识卡与决定，按主题读取、生成 Markdown 上下文。
- 中文教学规范、通过交流按话题观察能力、国内宿主分发说明。

CLI 与测试由本项目编写，教学指令按本项目流程用中文组织。来源与两份 MIT 许可随技能包保留，见 [NOTICE.md](skills/vibemind/NOTICE.md)。

## 支持项目

如果 VibeMind 对你有帮助，可以通过上方的爱发电或 Buy Me a Coffee 支持维护与更新。打赏入口与维护者的 [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) 项目保持一致。
