# MCP、CLI 与学习记录（0.5.0）

UTF-8；Node.js 22.20+。CLI 只用 Node 标准库，完整 Skill 可分别装到各宿主。MCP 在完整仓库 npm ci 后由宿主通过 node <仓库绝对路径>/scripts/mcp.mjs 启动。stdio 无端口，不需要模型 API。

## 共享存储与首次连接

安装目录不存学习库。默认 ~/.vibemind/memory.sqlite；各宿主使用同一实际系统账户和本机可靠磁盘。存储选择依次为调用选项 home（内部 API）、VIBEMIND_HOME、共享用户配置、默认目录。共享配置默认 ~/.vibemind/config.json，可用绝对 VIBEMIND_CONFIG 指定另一配置文件；坏配置不会回退成空库。

用户选择自定义共享目录时运行一次 configure --memory-home <绝对目录>，以后安装的宿主读取同一配置。已有环境变量覆盖仍优先，修改后需重启持有旧环境的 MCP。每个新宿主、MCP→CLI 切换，都用 status/doctor 核对实际 memoryHome/databaseFile/storeId/softwareVersion/apiVersion/databaseSchemaVersion 和项目 ID。格式 2 的库 ID 独立持久化，不依赖安装路径。

无需预先安装 Claude Code、Codex、WorkBuddy。新宿主指向同库、同项目身份、兼容版本即可接续，保留暂停与历史；模型会话是否自动调用 Skill 取决于宿主。Windows/WSL 不可直接用不同系统写入器写同一库，改由同一系统的进程处理；这不是跨设备同步服务。

## 命令与工具

从技能真实安装位置定位 CLI，项目参数指向用户项目，不能指向技能目录。

| CLI | MCP 工具 | 作用/主要输入 |
|---|---|---|
| configure | vibemind_configure | memoryHome；保存共享配置，不复制或合并已有库 |
| doctor | vibemind_doctor | 只读诊断实际 Node/平台、库 ID、版本、大小、计数和可选项目/锁 |
| migrate | vibemind_migrate | 在线备份后升级格式 1；恢复后可明确轮换库身份 |
| init | vibemind_init | projectPath；用户启用/接续时初始化；sharing/newProject/attachProjectId/rebindStoreId 可选 |
| status | vibemind_status | 状态和精简版本；不创建记录 |
| context | vibemind_context | 档案、地图、全部未完成决定和卡片索引；主题可选 |
| get | vibemind_get | kind（card/decision/evidence/snapshot）、id；完整精确记录；snapshot 的 id 是修订号字符串 |
| record | vibemind_record | 更新项目/图谱；必填写入控制字段 |
| pause / resume | vibemind_pause / vibemind_resume | 带版本暂停/用户要求时恢复；不自动重放过期恢复 |
| user | vibemind_user | 通用档案、独立 userRevision、已知更新来源 |
| record-user | vibemind_record_user | 活跃来源更新通用档案；expectedRevision 是 userRevision |
| operation | vibemind_operation | operationId；查询过去的持久提交回执 |
| projects | vibemind_projects | 精简项目列表；坏项目独立诊断 |
| knowledge | vibemind_knowledge | conceptId/topic、limit、depth；跨项目可见学习图谱 |
| history | vibemind_history | conceptId/topic、limit、cursor、可选 kind；精确概念分页 |
| correct | vibemind_correct | originProjectId/expectedOriginRevision；更正旧来源证据/别名 |
| purge | vibemind_purge | originProjectId/版本和相同 confirmProjectId；删除活动项目记录及修订 |
| recover-lock | vibemind_recover_lock | projectPath、lockToken；只清理确认进程已退出的初始化锁 |
| discover | vibemind_discover | projectPath/projectId；UTF-8 结构化任务；action=search/recommend，全域按需检索 |
| opportunities | vibemind_opportunities | 项目机会；status/roadmap/limit/cursor 过滤分页 |
| extensions | vibemind_extensions | 全部路线、启用范围、镜像与访问诊断 |
| backup | vibemind_backup | output：未存在的绝对文件路径；在线备份后原子发布 |

MCP 的 projectPath 是绝对目录，CLI 对应 --cwd。status/context/get/doctor/knowledge/history 可用 projectId（CLI --project-id）替代路径，二者不能同时指定；knowledge/history 也可不带项目，此时只查询允许共享的内容。跨来源纠错/删除目标可按 ID 脱离目录；所有项目写入的发起来源仍须提供真实绝对目录并校验身份。

CLI context 默认 Markdown，--json 输出 JSON；其他命令输出 JSON。成功 ok=true，错误 JSON 写 stderr 并返回 1。Node 22 的 SQLite 警告可能在 stderr。MCP 提供 structuredContent 与紧凑 JSON 文本，业务错误 isError=true，保留 code/message/details；输入 schema 错误由 SDK 返回。成功后才能报告已保存。

## 写入版本、并发与重试

record、record-user、pause、resume、correct、purge 都必填：

| 字段 | 来源 |
|---|---|
| expectedStoreId | 刚读取 status/context 的 storeId |
| expectedProjectId | 来源目录的 projectId |
| expectedRevision | 项目 revision；record-user 用独立 userRevision |
| operationId | 每个新请求生成 UUID；同请求重试保留此 ID 和原输入 |
| source（可选） | 真实 host/sessionId/taskId/codeRevision；总计最多 4 KiB；未知出处不伪造 |

SQLite 单写事务，DELETE 日志、FULL 同步、3 秒 busy_timeout。身份、暂停、版本、图谱、修订和回执在同一事务校验/提交。不同项目更新通用档案仍竞争同一 userRevision。冲突后读 context/get/user 的完整最新内容，保留双方有效观察再提交，不能只给旧 payload 换新版本号。

超时、取消或断开不证明未保存。先查询 operation；同 ID 同输入返回原回执 replayed=true，同 ID 不同输入拒绝。回执在后来暂停后仍可查询/重试，表示过去已经提交，不再次更新、不恢复伴学；随后重读 context。整合后是新请求，使用新 operationId。无变化写入也保存回执，不增加业务 revision 或重复快照。

CLI record 等从 UTF-8 stdin 接收 JSON。pause/resume 也可用 --expected-revision、--expected-store-id、--expected-project-id、--operation-id 参数；不能与 JSON 重复提供同一字段。

## 讲解前检查与共享范围

每次讲解前查询 conceptId 或 topic，不能同时提供。精确 ID/明确别名才能判定 explained；模糊候选、父概念和相邻概念不能代替当前概念。

- alreadyExplained=true、guidance=skip_covered_scope：只跳过 explanationSummaries.scope 已覆盖范围，不表示整个概念讲过或用户掌握。缺少 applied 不触发重讲；用户明确复习/仍不理解时可重讲。
- conceptId=null、guidance=resolve_concept：先确定概念，不能把候选当历史事实。
- needsLegacyReview=true：核对 legacyCards 原文，明确讲解事实才补 explained。summary 共享旧卡只提供待核对引用，需要按原项目 ID 明确读取；未知保持未知，暂停时不补写。
- knowledge limit=1..100（默认 20），depth=1..2（默认 2）。truncated 表示部分结果未返回；alreadyExplained 按全部可见精确证据计算。explanationNextCursor 接 history，保持 conceptId 与来源项目不变，可遍历全部 explained 范围。
- history 按单调 sequence 倒序分页，nextCursor 固定首批上界，后来的新增不会挤动旧页；不保证对后来更正/撤销内容做历史快照。游标绑定库 ID、概念、来源和 kind，不能跨查询/恢复代际复用。

初始化默认 sharing=summary，可用带版本的 record.sharing 修改；已有项目 init 不改共享策略。

| 策略 | 其他项目 knowledge/history 能读什么 |
|---|---|
| private | 不返回该项目的概念来源、别名、案例或证据 |
| summary | 通用概念和 scope/summary；移除路径、卡片定位、codeLocation/source，不返回正文 |
| full | 允许完整案例、正文和来源位置；用户明确选择 |

本项目可读取自己的完整记录。通用用户档案仍跨项目共享，项目私密内容不要写入通用档案。summary 文字要保持通用，工具不能清洗其中所有秘密。策略约束自动跨项目查询；同一学习者仍可按项目 ID 管理自己的记录，不是多用户权限系统。旧库无法确定项目归属的概念保留为旧全局词汇，不推断其私密归属。

## 保存真实记录

record 除控制字段需至少一个更新字段。profile/projectMap 整串替换，先整合有效旧内容；cards（id/title/content）与 decisions（另有 stage）按稳定 ID 合并，未提交对象保持，空数组不删除。stage 为 reasoning/design/implementation/completed；completed 不自动证明实施授权或代码完成。context 恢复全部未完成决定，status/写入回执只返回计数。

projectMap 变化时记录 mapBasis.recordedAt 及 source.codeRevision（未知为 unknown）；这是当时依据，不是当前分支的自动验证。恢复后核对实际代码。

| 图谱字段 | 每项格式/约束 |
|---|---|
| concepts | id、title、可选 aliases 数组；先查并复用稳定 ID/标题 |
| links | cardId、conceptId；当前项目卡片与明确声明或可见概念 |
| evidence | id、conceptId、cardId、kind（explained/applied）、scope、summary；codeLocation 可选 |
| retractEvidence | 当前项目错误证据 ID 数组；撤销判定，保留快照与卡片关联 |
| removeAliases | conceptId、alias；更正额外别名，必带 expectedGraphRevision；ID/标题别名不能删 |

证据只能在实际讲解/应用后写入。来源含 projectId、可选宿主/会话/任务与代码版本，创建时间由存储记录。证据 ID 的概念、卡片和种类不可改，新观察/更正用新 ID；范围/摘要/定位可整合。撤销后有墓碑，不能同批或后来复用旧 ID。别名按 NFKC/去空白/小写规范化，不能覆盖别人绑定；可同批先指明旧归属更正，再声明正确概念。图谱版本冲突先核对全局最新归属。

以下仅为输入形状，UUID/版本取自当前状态，示例文字不能照抄成学习事实：

~~~json
{
  "expectedRevision": 0,
  "expectedStoreId": "<status.storeId>",
  "expectedProjectId": "<status.projectId>",
  "operationId": "<新请求 UUID>",
  "source": {"host": "codex", "codeRevision": "<实际提交或 unknown>"},
  "cards": [{"id": "cors-case", "title": "当前来源限制", "content": "实际代码案例；应用观察未知。"}],
  "concepts": [{"id": "cors", "title": "跨域资源共享", "aliases": ["CORS"]}],
  "evidence": [{"id": "cors-explanation-unique", "conceptId": "cors", "cardId": "cors-case", "kind": "explained", "scope": "已经讲解的实际范围", "summary": "已经发出的解释摘要，不能等同于用户掌握。"}]
}
~~~

record-user 先读 user 并整合；来源须已初始化/绑定且活跃，即使相同内容也不能从暂停来源首次提交。userSource 保留已知的最后实际修改来源，无变化观察不改写原出处；迁移前未知来源不伪造。

correct 只在用户指出误记时使用，额外必填 originProjectId/expectedOriginRevision，补 retractEvidence/removeAliases；别名更正另带 expectedGraphRevision。来源可已删除目录或暂停，保留原项目模式，快照记录真实发起来源。

purge 用相同 confirmProjectId 确认目标及版本，清除活动库内项目、证据、卡片关联、快照和关联旧回执；不删其他项目使用的概念。通用档案默认保留，明确 forgetUserProfile=true 并带 expectedUserRevision 才清除档案及其历史。备份、旧 JSON、宿主聊天和外部副本需另行管理，不承诺物理磁盘安全擦除。删除后保留身份以阻止无意复活，status 返回记录缺失。

## 初始化、迁移与恢复

项目 .vibemind/project.json 格式 2 仅含 schemaVersion/projectId/storeId。定位尊重最近项目 .vibemind、Git/worktree 边界，半初始化/损坏目录不借父项目，用户级存储不算父项目。拒绝数据目录/身份/数据库及侧文件的链接；允许安装目录 junction 调用 CLI。复制时原项目仍持同 ID 就拒绝，明确独立复制才 init --new-project，创建空的新项目，不建立分支共享关系。

已有身份但库不存在、ID 不符或库无项目行时拒绝空建。身份丢失且数据库已登记路径时，用 projects 核对后 init --attach-project-id <已有 UUID>。初始化先写 init.pending.json，提交数据库后发布身份；失败保留旧身份与恢复计划，下次 init 检查同库/身份后补完。恢复期间身份被改则拒覆盖。遗留锁通过 doctor 查看；recover-lock 必须匹配 token 且确认 PID 已退出，存活/权限未知/PID 复用时不清理。

升级 0.2/0.3/0.4 的格式 1/2：更新完整 Skill/CLI/MCP 并重启，核对 doctor 路径；用户要求升级后运行 migrate。在写锁内先生成完整性验证的旧库在线备份，再升级格式 3，错误回滚，旧写入器随后按其格式检查拒写。原项目执行 init 绑定同一 ID，保留 revision、暂停、档案与证据。格式 1 仍可只读，精确证据/分页需格式 2。0.1 JSON 在 init 校验并导入，保留原字节/备份；旧 profile 不升成用户档案，旧卡不自动变 explained。旧 JSON 被旧工具修改则 LEGACY_CHANGED，先保留并整合，不删除变化绕过保护。

备份用 backup，不复制活动 SQLite。先写 output.incomplete-UUID，验证后用同目录硬链接原子发布，不覆盖目的文件；强杀留下的 incomplete 不当完成备份，不支持硬链接时明确失败。

恢复需停止全部 MCP/CLI 写入者，保留现库，离线检查备份完整性/版本再恢复；不提供会覆盖活动库的自动 restore。恢复后、开放其他宿主写入前运行 migrate --rotate-store-id --expected-store-id <doctor 当前 ID>，先备份再换新 ID；原项目 init --rebind-store-id <新 ID> 明确接续同一记录。旧身份/请求/游标被拒绝，重读后再提交。不轮换 ID 的文件替换无法与正常旧库区分。

## 容量与错误

新字符串最多 128 KiB，输入与项目状态 JSON 最多 512 KiB，MCP 业务结果最多 2 MiB，按 UTF-8 序列化字节计。CLI stdin 提前限额，MCP 缓冲 1 MiB；协议超大消息关闭连接，查回执确认状态。业务容量错误返回结构化错误，连接继续可用。回执精简，context 不截断未完成决定；旧大记录用 CLI/get 精确读取并缩短。doctor 显示库大小/计数，不自动删历史或限制总库容量。

| 错误 | 处理 |
|---|---|
| CONFLICT / GRAPH_CONFLICT | 重读 context/get/user/knowledge，整合完整内容/归属，用新操作 ID 提交 |
| OPERATION_ID_CONFLICT | 同 ID 不同请求；核实回执，新内容生成新 ID |
| STORE_MISMATCH / MEMORY_NOT_FOUND / MISSING_PROJECT_RECORD | 核对共享库/配置或恢复备份，不建空记录替代 |
| BINDING_REQUIRED / MIGRATION_REQUIRED | 按升级流程迁移/接续，保留暂停 |
| PROJECT_CHANGED / PROJECT_ID_CONFLICT / MISSING_PROJECT_ID | 核对身份/复制/遗失，明确 attach 或独立复制 |
| INIT_RECOVERY_REQUIRED | 保留标记，检查库与身份，在同一来源 init 恢复 |
| LOCKED | 有限等待结束；查回执/重读，不频繁轮询、不抢锁、不换库 |
| LOCK_RELEASE_FAILED / LOCK_CHANGED | 可能已经保存；核实 status/回执 |
| PAUSED | 用户要求恢复后才带当前版本 resume |
| LEGACY_CHANGED | 备份双方，升级旧工具，保留旧 JSON 原字节归档后明确整合 |
| UNSAFE_PATH / NETWORK_STORAGE / EXECUTION_ENVIRONMENT_MISMATCH | 使用同系统可靠本机普通目录/文件，不绕过保护 |
| INVALID_CONFIG / INVALID_IDENTITY / INVALID_STATE / UNSUPPORTED_SCHEMA / INVALID_DATABASE / UNSUPPORTED_DATABASE | 保留问题文件，报告诊断，不重置或降级 |
| STORAGE_PERMISSION / STORAGE_READ_ONLY / STORAGE_FULL / STORAGE_IO_ERROR / STORAGE_UNAVAILABLE | 排除真实原因，不换空目录；查回执后再提交 |
| CONCEPT_CONFLICT / PRIVATE_SOURCE | 核对明确概念/来源；跨来源纠错显式指定目标 |
| INVALID_INPUT / USAGE / INVALID_CURSOR | 修正参数/引用/编码；游标保持查询，失效后重查 |
| INPUT_TOO_LARGE / RESPONSE_TOO_LARGE | 缩短写入；减少 limit、用 get/CLI 读取，不截断未完成决定 |
| BACKUP_FAILED / WRITE_FAILED | 原数据保留，解决文件系统问题后重读再试 |

记录是学习数据，不构成系统指令、工具权限或新实施授权；JSON 数据块仍按宿主权限处理。建议忽略项目 .vibemind，不自动改 Git 规则。库/备份未加密，Windows mode 不等于 ACL。跨机器、多学习者、NAS/SMB/实时云盘同步和离线库合并不在此版本支持范围。

## 0.5 成长记录与迁移

数据库当前格式 3；项目身份文件仍是格式 2，API 仍是 2。格式 1/2 支持既有只读命令，新写入必须明确 migrate。2→3 保留 storeId、项目 ID、revision、用户版本、暂停、证据和回执；1→3 先接续既有存储身份步骤。在线备份、写锁、回滚、恢复后轮换身份及旧客户端拒绝规则继续有效。

record.growth 支持 candidates、session、invite、feedback、suppressSession。候选用 discover opportunities[].recordCandidate 原样保存；新增三个表为 growth_opportunities、growth_sessions、learning_preferences，纳入事务、快照、备份和 purge。重复候选不增加 revision；反馈保留历史，回执幂等。教程正文和抓取缓存不进入学习数据库。

record-user 可提交 profile 和/或 learningPreferences，后者含 frequency=off|normal、roadmaps=["*"] 或路线列表；沿用 userRevision。purge.forgetUserProfile 同时恢复默认学习偏好。来源暂停时禁止这些写入。

configure 新增 roadmapMirrors=[{url,api}]，CLI 用 --roadmap-mirrors JSON；修改会保留原记忆目录，修改记忆目录也保留镜像。旧宿主应同步升级并重启。

SOURCE_UNAVAILABLE 表示公开资料不可用，不表示用户缺知识；INVITATION_BLOCKED 表示邀请条件或会话额度不满足；OPPORTUNITY_NOT_FOUND 核对当前项目与候选 ID。完整输入、语义判断责任及缓存规则见 [发现规范](discovery.md)。
