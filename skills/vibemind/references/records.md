# CLI 与学习记录

所有文本使用 UTF-8。CLI 与本技能一起分发，只有 Node 标准库依赖，需要 Node.js 22.20.0 或更新版本。通过**技能实际安装位置的完整脚本路径**调用，`--cwd` 明确使用用户项目路径；脚本可以从带空格的安装目录执行。

## 命令与返回值

```text
node "<技能目录>/scripts/vibemind.mjs" init --cwd "<项目路径>"
node "<技能目录>/scripts/vibemind.mjs" status --cwd "<项目路径>"
node "<技能目录>/scripts/vibemind.mjs" context --cwd "<项目路径>"
node "<技能目录>/scripts/vibemind.mjs" context --cwd "<项目路径>" --topic "跨域"
node "<技能目录>/scripts/vibemind.mjs" pause --cwd "<项目路径>"
node "<技能目录>/scripts/vibemind.mjs" resume --cwd "<项目路径>"
```

`context` 默认生成 Markdown，加 `--json` 返回 JSON。其他命令输出 JSON，成功时 `ok: true`。失败时错误 JSON 只输出到 stderr，退出码为 1；包含 `error.code` 和中文 `error.message`。只有退出码 0 且成功返回后才能报告已保存。

`status` 未初始化时返回 `initialized: false`，不创建文件。已初始化时返回项目目录、状态文件、`revision`、`mode`、卡片数量、全部未完成决定和 `locked`。`context` 不创建或修改记录，始终包含档案、项目地图和全部未完成决定；默认只列卡片 ID 与标题，`--topic` 按 ID、标题、正文中的字面关键词匹配并读取卡片。没有匹配时可换一个相关关键词，不虚构历史。

## 数据格式

项目内 `.vibemind/state.json` 是唯一活动数据源。格式版本 `schemaVersion: 1`；`revision` 从 0 开始，每次实际变更增加 1，完全相同的更新不产生新版本。

| 字段 | 类型与用途 |
|---|---|
| `mode` | `active` 或 `paused`；通过 pause/resume 修改 |
| `profile` | Markdown 字符串；偏好、按话题观察及其证据，未知部分保持未知 |
| `projectMap` | Markdown 字符串；目的、要求、组件、数据流、未知部分与实现状态 |
| `cards` | 卡片数组，每项包含非空字符串 `id`、`title`、`content` |
| `decisions` | 决定数组，每项包含非空字符串 `id`、`title`、`content` 及合法 `stage` |

决定阶段为 `reasoning`（等待推理）、`design`（等待设计确认）、`implementation`（等待实施授权）或 `completed`（当前节点已结束）。`completed` 不代表已经编码；确认了什么、实现了什么，在 content 和项目地图中据实说明。上下文和状态摘要始终返回所有未完成决定。

`id` 在同一概念与场景中保持稳定，建议使用简短英文标识，例如 `cors-vue-fastapi`。先读卡片目录再决定使用哪个 ID，更新已有卡片时保留 ID。中文标题和正文不受 ID 的显示语言影响。

## 提交记录

`record` 从标准输入接收一个 JSON 对象，必须包含 `expectedRevision` 和至少一个更新字段。合法更新字段为 `profile`、`projectMap`、`cards`、`decisions`；不能修改版本、模式或任意路径。使用宿主结构化进程调用或其现成文件/终端能力提供 stdin，操作 JSON 不拼接成 shell 命令。

```json
{
  "expectedRevision": 0,
  "profile": "## 当前观察\nVue 经验尚未确认。用户询问跨域原因，FastAPI CORS 是当前待理解话题。",
  "projectMap": "## 已读取实现\nVue 页面请求 FastAPI 接口。\n## 未决事项\n允许来源还在讨论，尚未实施本次配置。",
  "cards": [
    {
      "id": "cors-vue-fastapi",
      "title": "浏览器跨域与允许来源",
      "content": "## 当前实例\n结合已读的页面请求位置与后端配置解释；保存实际路径与符号。\n## 理解证据\nAI 已解释。尚无用户独立应用的证据。\n## 迁移\n前后端域名变化时，重新检查实际来源与策略。"
    }
  ],
  "decisions": [
    {
      "id": "cors-origin-policy",
      "title": "允许哪些来源调用接口",
      "stage": "reasoning",
      "content": "等待用户结合当前开发地址与部署要求说明策略。AI 尚未替用户选择允许来源。"
    }
  ]
}
```

以上为格式示例，不能直接当作当前项目事实保存。用实际读取的 revision、代码和对话证据替换内容。提供的 profile/projectMap 替换对应文本；cards/decisions 逐项按 ID 更新或新增，未提供的记录保持原样。关闭决定时提交同一 ID 和 `stage: completed`，保留当前节点的真实结果。空数组不删除已有记录。

一次写入可以同时更新档案、地图、卡片与决定。先读取上下文，把旧信息与本次新证据整合好再提交；不要用一段新的简短描述无意抹去仍有效的观察。重复 ID、未知字段和非法阶段会被拒绝。

## 项目与写入保护

从 `--cwd` 向上找到最近的 `.vibemind`，遇到 `.git` 目录或 worktree 的 `.git` 文件即停止。没有 Git 和已有记录时初始化当前目录。更近的半初始化或损坏目录不会回退到父项目，学习目录和相关文件不能是符号链接。原作 `.vibe-wise` 记录不会被自动导入或改动。

写入期间持有 `.vibemind/.lock`，冲突立即返回，不轮询或抢占锁。更新前将旧状态原始内容保存到 `.vibemind/backups/`；文件名包含旧版本与内容 SHA-256，已有备份必须内容一致。写入临时文件并同步后原子替换活动状态。失败保持原状态，并报告原因。

不直接编辑 state.json、不通过文件工具绕过 CLI，也不静默修改项目的 .gitignore。建议用户把 `.vibemind/` 加入忽略规则；只有用户要求时才编辑。

## 失败处理

| 错误 | 下一步 |
|---|---|
| `CONFLICT` | 重新读取 context，整合最新记录后提交；不能只换 revision 重试旧内容 |
| `LOCKED` | 保留锁和记录，报告冲突；确认其他写入已结束后再试，不能频繁轮询或自动解锁 |
| `PAUSED` | 保持暂停，仅在用户要求恢复时运行 resume |
| `INVALID_INPUT` / `USAGE` | 修正输入或参数后重试，不扩大操作范围 |
| `INVALID_STATE` / `UNSUPPORTED_SCHEMA` | 保留文件，报告损坏或版本问题；不能用 init 自动重置 |
| `UNSAFE_PATH` | 说明实际路径问题，不跟随链接、换用父目录或重新创建已有目录 |
| `BACKUP_FAILED` / `WRITE_FAILED` | 报告失败，保存成功的备份；修复实际文件系统问题后，先重新读取版本再试 |
| `LOCK_RELEASE_FAILED` | 操作可能已保存；先运行 status 核实，不能盲目重复写入 |

进程异常退出可能留下锁。人工恢复时先读取锁中的 PID 并确认对应写入进程已退出，然后只删除该项目的 `.lock` 文件；保留 state.json 与 backups，不能仅凭锁的时间长短判定可删。CLI 不会自动删除残留锁，不提供自动重置或恢复写回命令。
