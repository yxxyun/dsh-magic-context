# 功能特性

> dsh-magic-context 的功能 parity 表：OpenCode/Pi 的 Magic Context 能力在
> DSH 上的适配状态。DSH 适配遵循"注入而非改写"的架构约束：所有 Magic
> 变换通过注入消息与录制层管线承载，不修改 DSH 官方语义。

## 能力对照

| 能力 | DSH 适配 | 状态 |
|---|---|---|
| 预设激活 | `magic-standard` thin preset（stock standard + 禁 compaction-basic + 插 magic-compaction/magic-agent）；仅该预设会话激活 Magic 行为，其余预设零干预 | ✅ |
| ctx_search | 工具接线（无嵌入时纯词法 lane） | ✅ |
| ctx_memory / ctx_note | 记忆读写 / 笔记（含 smart note `surface_condition` 持久化） | ✅ |
| ctx_expand | raw 源 = transcript 映射（全日志恢复、tool 折叠、seq↔ordinal 可逆） | ✅ |
| ctx_reduce | §N§ drop 排队 + 记录型 TagTarget → surface CAS | ✅ |
| todowrite | Pi 六工具对齐；`last_todo_state` 持久化（共享 normalize 契约）+ HARD 物化轮合成重放 | ✅ |
| §N§ tags | 共享 tagger 全 fidelity（文本身份/指纹/token 计数由共享层承担）；首轮调用即打标；**预览按内容 id `${id}:p0` 查/建**（按裸 id 查会 miss 到已有行 → 新建重复行并把错号写进会话文本） | ✅ |
| 注入去重 | 判重同时看**活表面**与**本批次已出现的 watermark**；同一批次内重复的 Magic 消息按序号丢弃并记录原因（"投递两次"＝同一消息对象被 append 两次 → 对话区整片空白） | ✅ |
| tag/drop 物化 | 协调器 surface CAS（三 CAS + outbox saga） | ✅ |
| reasoning 清理 / temporal markers | 水位重放 / 插入合并（5 分钟阈值） | ✅ |
| 官方压缩 | MagicCompactionEngine + summarize hook（compartment digest + mini-historian） | ✅ |
| historian 后台 | 压力/commit-cluster 触发 → fire-and-forget → 原子发布；**compartment 租约是真互斥**（每次尝试唯一 holder + 有界等待后复查区间）；发布后强制 m0 折叠渲染 `<session-history>`；chunk 预算随模型窗口推导；`historian.model` 独立路由 | ✅ |
| m0/m1 知识注入 | 两条独立合成消息（缓存分裂契约）；m1 占位恒发；首轮调用即注入 | ✅ |
| auto-search | 模糊回忆提示（门内 fire-and-forget，CAS 防双发） | ✅ |
| Dreamer 全部任务 | 12 任务（core scheduler/lease/gate/telemetry 复用）；**需要工具的 9 个走 `ctx.subagents` 工具 worker**，按 agent 的权威工具表映射（DSH 无 `aft_*`，`bash` 映射到平台 shell） | ✅ |
| ~~Sidekick /ctx-aug~~ | **上游 0.42.6 已移除**：核心把 `sidekick` 列为退休配置键（`removed-agent-config.ts` → `REMOVED_AGENT_CONFIG_KEY`），加载器对 jsonc 里的 `sidekick` 段**警告并忽略**，端口不再注册 `/ctx-aug` | ⛔ 下线 |
| Mural | 视觉门 + attachments.saveImage → m0 图像块 | ✅ |
| feedback | DSH 桥接（messageFeedback → dsh_feedback_signals） | ✅ |
| ctx_reduce nudge | Channel-1/2 双通道（共享决策 + 注入交付） | ✅ |
| heuristic cleanup | 共享 applyHeuristicCleanup 接入 mutation 管线 | ✅ |
| 配置面 | magic-context.jsonc 全键桥接进 agent 面（阈值/保护窗/记忆预算/压缩开关/dreamer 任务排期等） | ✅ |
| 静默失败加固 | 会话日志访问器降级**上报到 `magic-context.log`**（而不是静默返回空）；注入批次丢弃带原因打日志；dream/historian 的失败在日志里带完整错因 | ✅ |
| /ctx-status /ctx-flush | 状态 / flush（compaction-off 门一致） | ✅ |
| /ctx-dream /ctx-embed | seam 接线（定时器/状态/全部 outcome 映射） | ✅ |
| /ctx-recomp /ctx-wrapup /ctx-session-upgrade | DSH session client + Managed 上下文（同会话原地升级） | ✅ |
| Web 状态/设置 | client 注册 + Remote diagnostics 端点 | ✅ |
| 压缩-off 模式 | 知识层继续（`compaction.enabled=false` 时 compartments 不渲染、命令不可用） | ✅ |
| 跨 harness 记忆 | 共享 SQLite + `harness='dsh'` 行隔离 | ✅ |
| 升级维护 | 无写回 include + doctor 契约检查 + `tools/audit-host-symbols.mjs` 运行时符号审计 | ✅ |

## 上游核心版本

本端口的 `packages/plugin` 是上游 Magic Context 核心的 vendored 副本，当前为
**0.42.6**（共享 schema 围栏 `v85`；启动日志
`upstream migration lane at boot: database=v85, supported_fence=v85`）。
`storage-db.ts` 的 `LATEST_SUPPORTED_VERSION` 必须等于 `migrations.ts` 的
`LATEST_MIGRATION_VERSION`，有单测钉住。

## 差异记录

- **`§N§` 是每会话独立编号**：DSH 的 resume/seed 会 fork 出 seeded 子会话
  （`header.parentSession`），子会话从 §1 重新编号 → **跨 fork 引用旧 §N§ 会失效**。
  上游编号语义的后果，非缺陷。
- **Sidekick 已下线**：上游 0.42.6 把 `sidekick` 列为退休配置键（`removed-agent-config.ts`），
  加载器对 `magic-context.jsonc` 里的 `sidekick` 段警告并忽略，端口也不再注册 `/ctx-aug`。
  用户配置里的该段是死键，可删。
- **dreamer-docs 的工具集**：核心配置授予 `read/grep/glob/bash/write/edit/aft_*`；
  DSH 侧**去掉 shell**，只给 `read/grep/glob/write/edit`——定时器驱动的 worker 可以
  改它该维护的文档，但不应能跑任意命令。`maintain-docs` 默认未排期。
- **feedback**：核心零消费（研究确认）——DSH 自建桥接；retrospective 消费接
  DSH raw provider 后生效。
- **命令可见性**：DSH 的 `/ctx-*` 命令是模型可见用户消息（Pi 是模型不可见
  custom entry）；命令行为与输出一致。
- **nudge 交付形态**：DSH 通过注入独立消息交付（Pi 追加在工具结果尾部）；
  决策与提醒文本同源。
- **todowrite 工具描述**：DSH 平台无 promptSnippet 字段，使用准则并入
  description（模型可见内容一致）。
- **historian 的模型路由依赖宿主 provider 插件**：若配置的 provider 未在 DSH 注册
  （例如 `dsh-opencode-go` 在 `0.1.7-rc.1` 上未注册其 adapter），historian 会以
  `no adapter registered for provider ...` 响亮失败——失败在上层可见，但压缩会停摆。
- **Web 渲染**：headless 环境无法驱动 Web UI；Remote 端点契约已测，
  真机渲染验证留待发布后。
- **Rust/subc**：显式阻止（不静默降级）。

## 验证状态

| 项 | 结果 |
|---|---|
| dsh-plugin（端口子集） | **212 通过 / 5 失败**（217 测试 / 28 文件）—— 5 个失败是 Windows 专有 `EBUSY`（nudge×2、heuristic cleanup×1、temporal gap×2），与本端口逻辑无关 |
| adapter-api | **14/14** |
| 上游 vendored 套件（`packages/plugin`） | 含**预存的 Windows 失败**（历史基线 3707 通过 / 279 失败 / 25 错误，3986 测试），**不作为本端口的上线门** |
| `tsc --noEmit` | **0 错误**，编译基线为 **DSH `0.1.7-rc.1` 的类型包**（devDependencies 精确钉版 → 编译器即漂移探测器） |
| 宿主符号审计 | **24/24 存在**（对比发行版 `app.asar` 运行时导出） |
| dist 引用图 | **CLEAN**（20 分块，0 死文件） |
| 活会话校验 | `e2e/verify-live.mjs` **5/5 绿** |

真实环境验证过的行为：首轮注入（m0/m1/§N§）、低上下文压缩触发与
`<session-history>` 渲染、跨对话记忆注入、Pi/DSH 共享库双向读写与 harness 隔离、
非 magic 预设零干预、发布物（tgz）干净安装链路（setup/doctor/启动）。

**兼容基线**：DSH `0.1.7-rc.1`、Magic Context 上游 0.42.6（共享 schema 围栏 `v85`）。
`peerDependencies` 保留 `^0.1.7-alpha.2`——该范围经市场自身的 semver 判定器核实
**同时容纳 `0.1.7-alpha.2` 与 `0.1.7-rc.1`**。

验证工具见仓库根 README 的「验证工具」一节（`e2e/verify-live.mjs`、
`tools/audit-host-symbols.mjs`、`tools/check-dist-graph.mjs`）。
