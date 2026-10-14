<div align="center">

<img src="../assets/banner.png" alt="VibeMind — Build with AI. Understand what you build." width="100%" />

<br/>

[![简体中文](https://img.shields.io/badge/简体中文-README-blue?style=flat-square)](../README.md)
[![English](https://img.shields.io/badge/English-Current-red?style=flat-square)](#)
[![日本語](https://img.shields.io/badge/日本語-README-blue?style=flat-square)](README_JA.md)
[![Français](https://img.shields.io/badge/Français-README-blue?style=flat-square)](README_FR.md)
[![Deutsch](https://img.shields.io/badge/Deutsch-README-blue?style=flat-square)](README_DE.md)

<br/>

[![Skills.sh](https://img.shields.io/badge/Skills.sh-Install%20Skill-00C853?style=for-the-badge&logo=hackthebox&logoColor=white)](#installation)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.20.0-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](#requirements)
[![License](https://img.shields.io/badge/License-MIT-60A5FA?style=for-the-badge)](../LICENSE)
[![爱发电](https://img.shields.io/badge/爱发电-Support%20Me-FF69B4?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.ifdian.net/item/1a20ed042f0711f1865a52540025c377)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-☕-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.creem.io/payment/prod_1yc40mIhKwwrc7iqFOG9G2)

<br/>

**Build with AI. Understand the work at your own pace.**

An adaptive coding guidance toolchain for Vibe Coding, built from a Skill, a local MCP server and CLI.
Guidance adapts by topic; project and explanation history can be resumed across sessions and projects.

</div>

## What VibeMind does

VibeMind brings adaptive coding guidance into day-to-day AI development. Its Skill uses the task and project context to adjust guidance to your experience with each topic: clarify requirements, compare implementation choices, explain unfamiliar concepts and implement only the scope you authorize. The local MCP server and CLI share an SQLite memory graph for project maps, knowledge cards, design decisions and cross-project concept history.

Use your existing model and tools. MCP and CLI share `~/.vibemind/memory.sqlite`; each project only keeps `.vibemind/project.json` for identity. Preferences and explanation history work across projects. No extra account or model API is required; the host manages the stdio process.

Before explaining a concept, query its exact ID or an explicit alias. `alreadyExplained` means that explanation history exists: compare `explanationSummaries.scope` and skip only the covered content. Uncovered fundamentals still need an explanation; missing application evidence does not trigger repetition. Explicit review requests or continued confusion allow another explanation. Related concepts and fuzzy candidates do not imply that the current concept was explained.

## How guidance works

Start with a real task and your current approach. The Skill checks them against the existing code and constraints, helps you weigh meaningful tradeoffs, then implements the scope you authorize.

Guidance adapts to your familiarity with each topic, inferred from conversation and work rather than an opening questionnaire. New concepts are explained directly; familiar topics move to the current use case and new details. You can ask for a recommendation, skip an exercise or request direct implementation. An explanation and demonstrated application are recorded separately.

<a id="requirements"></a>

## Requirements

- **Node.js 22.20.0 or newer**.
- An AI tool that can read project files and run local commands.
- The CLI uses only Node's standard library; installation through skills.sh also needs npx.

<a id="installation"></a>

## Installation

### Method 1: one sentence to your agent

Copy this instruction into your current agent:

```text
Read the README at https://github.com/TFboy1/VibeMind and install vibemind as the coding guidance Skill for my current AI tool. Check Node.js ≥22.20.0, keep all references, scripts and NOTICE files, preserve existing Skills and memory, leave global settings unchanged, and show me how to invoke VibeMind in a project.
```

The agent can use the skills CLI or the tool's native import flow. If it cannot complete a native import itself, it should explain the remaining user action accurately.

### Method 2: manual installation

#### Through the skills CLI

Open a terminal in the project where you want to use VibeMind:

```sh
npx skills add TFboy1/VibeMind --skill vibemind --copy
```

Select your tool when prompted, or specify one:

```sh
# Qoder
npx skills add TFboy1/VibeMind --skill vibemind --agent qoder --copy

# Qoder CN
npx skills add TFboy1/VibeMind --skill vibemind --agent qoder-cn --copy

# TRAE CN
npx skills add TFboy1/VibeMind --skill vibemind --agent trae-cn --copy

# TRAE
npx skills add TFboy1/VibeMind --skill vibemind --agent trae --copy
```

Installation is project-scoped by default. `--copy` uses regular files, which is convenient on Windows. [skills CLI documentation](https://github.com/vercel-labs/skills)

#### Import the complete ZIP

1. Build the complete 0.5.0 Skill ZIP from current source; see the [main README](../README.md). The old 0.1.0 ZIP writes project JSON and must be upgraded before using the new MCP.
2. In WorkBuddy, open Skills → Add skill → Upload skill and import it. Qoder and TRAE can use the same ZIP through their native import UI.
3. Find `vibemind` and invoke it in your target project.

The ZIP must contain `SKILL.md`, `NOTICE.md`, `references/` and `scripts/` directly at its root. Keep the entire package. The full GitHub repository ZIP is different: the skill is inside `skills/vibemind/`.

The current skills CLI has no separate WorkBuddy target; use WorkBuddy's native importer. [WorkBuddy documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)

For local source installation, clone the repository and supply its absolute path to `npx skills add`:

```sh
git clone https://github.com/TFboy1/VibeMind.git
npx skills add /absolute/path/to/VibeMind --skill vibemind --agent qoder --copy
```

Quote paths containing spaces on Windows.

## Use VibeMind

In your project, ask:

> Use VibeMind as my adaptive coding guide for this project. I want to add inventory reservations to this Vue + FastAPI project. Inspect the existing code and constraints, then help me compare implementation choices.

Useful requests:

- “Explain this concept using the current project.”
- “I know the basics; focus on how this applies here.”
- “Recommend an approach, then implement it.”
- “Skip the explanation and implement the agreed design.”
- “Show me my CORS knowledge cards.”
- “Pause VibeMind guidance.”
- “Resume VibeMind and continue the unfinished decisions.”

Installing the Skill does not initialize or activate every project automatically. Invoke VibeMind in the project to start; ordinary development requests then receive guidance adapted to the current topic and project context. In a new conversation or another tool, invoke VibeMind again to restore that context. Automatic hooks are outside this first release.

A design confirmation records that design. It does not grant implementation permission for unmentioned work. Existing explicit authorization for the same scope is reused.

## Local MCP: one setup, shared context across projects

Keep the full repository in a stable directory and run `npm ci` once. Add a stdio server to your host, replacing the absolute script path:

```json
{"mcpServers":{"vibemind":{"command":"node","args":["/absolute/path/to/VibeMind/scripts/mcp.mjs"]}}}
```

On Windows, use a path such as `D:/tools/VibeMind/scripts/mcp.mjs`. The host starts and stops the process; no HTTP port is needed. Use the same absolute `VIBEMIND_HOME` in all hosts to override the default user directory. Connecting does not initialize a project or activate guidance. The Skill ZIP includes the standard-library CLI; the MCP server runs from the full repository with its SDK dependencies.

Use `configure --memory-home /absolute/local/directory` once to save shared user configuration for hosts installed later. `VIBEMIND_HOME` still overrides it. Check `doctor/status` for actual `storeId`, path, versions and project ID when changing hosts or switching MCP/CLI. No need to install every host in advance; only one learner, one operating system and a reliable local filesystem are supported.

## CLI

Use the complete path to the installed script and explicitly select your project:

```sh
node skills/vibemind/scripts/vibemind.mjs --help
node skills/vibemind/scripts/vibemind.mjs init --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs status --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project
node skills/vibemind/scripts/vibemind.mjs context --cwd /path/to/project --topic CORS
node skills/vibemind/scripts/vibemind.mjs pause --cwd /path/to/project < pause-request.json
node skills/vibemind/scripts/vibemind.mjs resume --cwd /path/to/project < resume-request.json
```

Read commands do not write records. `context` produces Markdown by default; add `--json` for JSON. Other commands return JSON. Errors go to stderr with a nonzero exit code.

`record` reads UTF-8 JSON from stdin. Every business write, including pause/resume, requires current `expectedStoreId`, `expectedProjectId`, `expectedRevision` and a fresh UUID `operationId`; `record-user` uses `userRevision`. The pause/resume request files below contain these fields read from current status. `record` also needs an update field. Cards have stable `id`, `title`, `content`; decisions also have `stage`.

| Decision stage | Meaning |
|---|---|
| `reasoning` | Waiting for the user's reasoning |
| `design` | Waiting for design confirmation |
| `implementation` | Waiting for implementation authorization |
| `completed` | The current discussion node is finished; this alone does not mean code was implemented |

Cards and decisions are upserted by ID. Other records are preserved. Profile and map text replace their respective fields, so integrate still-valid observations before saving. [Detailed record contract](../skills/vibemind/references/records.md)

## Storage and recovery

SQLite is the active source of truth. User and project revisions are independent; updates and snapshots commit in one transaction, using DELETE journaling, FULL synchronization and a three-second busy timeout. `init` imports valid legacy state.json without changing its bytes, backups, paused mode or pending decisions. Legacy profiles remain project observations; legacy cards need review before creating explained evidence.

Moved projects reconnect by ID. A copied ID is rejected if the original registered directory still holds the same identity; unrelated reuse of the old path does not block restoration. Explicit `init --new-project` starts separate empty project records. Global learning history remains shared. Use `projects` and `context --project-id` to read history after directory deletion. `user`/`record-user` manage the independent user profile; writes require an initialized, active source project (`--cwd` in CLI, `projectPath` in MCP). `knowledge --concept-id` returns exact explanation history and up to two hops of related evidence. `backup --output` uses the SQLite online backup API and never overwrites a destination. See the [record contract](../skills/vibemind/references/records.md) for details.

Explicit corrections use `record.retractEvidence` (source-project evidence IDs) or `record.removeAliases` (`conceptId` and `alias`); previous values remain in revision snapshots. Store short summaries: new strings are limited to 128 KiB, serialized input batches and project state to 512 KiB, and MCP business results to 2 MiB, measured as UTF-8 bytes. Oversized writes roll back before commit; unfinished decisions are never silently cut. Old large records remain readable through CLI and can be shortened.

Upgrade Skill, CLI and MCP together to **0.5.0**, then restart MCP. Run `migrate` to back up schemas 1/2 online and upgrade to schema 3; old writers then refuse writes. Run `init --cwd /path/to/project` to bind the same existing project without resetting history or paused mode. Default `sharing: summary` shares lesson scope/summary while hiding other project bodies and code paths; `private` hides that source, `full` explicitly allows complete cases. Summaries must avoid private details. Alias correction requires `expectedGraphRevision`; conflicts require rereading and integrating content. Lost responses: query `operation`, retry the same ID and input; a receipt describes a past commit, not current mode. Use `get` for exact records, `history` for stable pagination, `correct` for explicit correction of deleted/paused sources and `purge` for confirmed active project deletion (not backups or host chats). After an offline backup restore, rotate identity with `migrate --rotate-store-id --expected-store-id CURRENT_ID` and rebind existing projects with `init --rebind-store-id NEW_ID` before reopening writers. See the [complete record contract](../skills/vibemind/references/records.md).

Lookup respects Git and worktree boundaries and rejects symbolic-link state paths. All unfinished decisions are restored, including those after long histories.

- Add `.vibemind/` to your project's ignore rules if desired; the CLI does not edit them.
- On a revision conflict, reread and integrate the latest records before submitting.
- On a lock conflict, inspect `doctor`; `recover-lock --cwd ... --lock-token UUID` only clears a matching lock after its process has exited. Never delete a live or unknown lock.
- Corrupt or unsupported records are preserved and reported; `init` does not reset them.
- Backup or write failure preserves the old state. On lock-release failure, first inspect `status`, because the operation may already have saved.

There is no automatic reset or backup-restore command. Records enter your existing model's context when your host reads them; VibeMind does not upload them separately.

## Validation

```sh
node --check skills/vibemind/scripts/vibemind.mjs
node --check scripts/mcp.mjs
node --test
npx skills add . --list
```

Tests use Node's built-in runner and temporary projects. They cover stable updates, readonly restoration, paused state, concurrent processes, corrupted data, backup/write failures, Unicode paths and project isolation. Check guidance in your own host: it should adapt to topic familiarity, preserve unfinished decisions, avoid repeating explanations by default and distinguish an explanation from demonstrated application.

## Sources and support

VibeMind borrows and adapts [VibeWise](https://github.com/nykooi1/vibe-wise) by Noah Kim: learner-owned design, direct concept teaching, checkpoint semantics, evidence-based learning records, project maps and unfinished-decision restoration. The project-boundary and backup design also draw on its implementation.

This project adds its adaptive coding guidance workflow, Node CLI, local stdio MCP, user-level SQLite graph, stable project identity, legacy migration, transaction snapshots, online backups and exact explanation checks across projects. Source attribution and both MIT notices are included in [NOTICE.md](../skills/vibemind/NOTICE.md).

The support buttons above use the same destinations as the maintainer's [Academic Paper Writer](https://github.com/TFboy1/academic-paper-writer) project.

## 0.5.0: knowledge discovery across all roadmaps

Discover adjacent knowledge from any public roadmap.sh roadmap, with on-demand online reading. The host Agent chooses domains, expands multilingual queries and judges semantic relationships; local FTS5 retrieves candidates and memory rules select up to three opportunities. Unknown ability remains unknown.

New CLI/MCP commands: discover (search/recommend), opportunities and extensions. Save concise candidates/feedback with record.growth; update frequency (off/normal) and route scope with record-user.learningPreferences. Existing explained/applied evidence stays separate.

Active projects offer at most one invitation after task completion per known host session. Declining, deferring or requesting direct implementation stops further invitations in that session. Acceptance grants no implementation permission.

Read official sources first, then capable mirrors; configure --roadmap-mirrors JSON preserves the memory path. Cache public data separately from learner records. Source failure never creates a replacement database.

Update all hosts and explicitly migrate schemas 1/2 to 3 with an online backup. Schema 2 identity, revisions, paused mode and existing evidence are preserved. No vector model, bulk tutorial sync, automatic hook or frontend is added.

See the [discovery contract](../skills/vibemind/references/discovery.md) and [source notices](../skills/vibemind/NOTICE.md).
