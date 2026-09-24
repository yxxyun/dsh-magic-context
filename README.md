# Magic Context for DSH

<div align="center">

[English](./README.en.md) | **中文**

![Version](https://img.shields.io/badge/version-0.1.5-blue.svg)
![DSH](https://img.shields.io/badge/DSH-0.1.7--rc.1-111827.svg)
![Magic Context](https://img.shields.io/badge/Magic%20Context-0.42.6-7C3AED.svg)
![Harness](https://img.shields.io/badge/harness-dsh-5391FE.svg)
![Community](https://img.shields.io/badge/community-port-0F766E.svg)
![Unit tests](https://img.shields.io/badge/unit%20tests-212%20pass-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)

**社区移植**：将 [Magic Context](https://github.com/cortexkit/magic-context) 移植到
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的独立社区项目。
与官方 DSH 及官方 Magic Context 均无隶属关系，能力对齐情况见
[功能特性](./docs/FEATURES.md)。

[E2E 环境](./e2e/README.md) · [验证工具](#验证工具)

</div>

---

## 项目定位

一个把 Magic Context 移植到 DeepSeek Harness 的适配层：让 DSH 会话使用
Magic Context 的知识注入、上下文管理与记忆能力，并与 OpenCode/Pi 的
Magic Context **共享同一 SQLite 记忆库**（`harness='dsh'` 行隔离），
OpenCode/Pi 行为保持不变。

适合这些场景：

- 在 DSH 中复用已有的 Magic Context 记忆（与 OpenCode/Pi 共享）。
- 希望 DSH 会话获得 m0/m1 知识注入、§N§ 标签、historian 压缩、
  Dreamer 定时任务等能力。
- 想要 ctx_* 工具族（search/memory/note/expand/reduce）与 todowrite 的 DSH 用户。

能力对齐：注入（m0/m1 双消息、首轮即见、§N§ 首轮打标）、压缩（低上下文
窗口 chunk 预算、historian 独立模型路由、发布后 `<session-history>` 折叠）、
nudge 双通道、heuristic cleanup、配置桥接——均与 Magic Context 0.42.6
（Pi/OpenCode）语义对齐。

## 安装

在 DSH profile 的 `package.json` 中（profile 目录即 `$DSH_HOME/profiles/<name>/`）：

```json
{
  "dependencies": {
    "dsh-magic-context": "github:yxxyun/dsh-magic-context#v0.1.5&path:/packages/dsh-plugin"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-magic-context"]
    }
  }
}
```

> ⚠️ `dsh.profile.bundles` 请**保留你 profile 现有的条目**（如
> `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`@deepseek-ai/dsh-headless`
> 等），只**追加** `"dsh-magic-context"`。

本地开发/自测可以改用 `file:` 依赖，指向 `fork/stage/dsh-magic-context`
（由 `fork/tools/deploy-to-profile.mjs` 生成）：

```json
{ "dependencies": { "dsh-magic-context": "file:../../stage/dsh-magic-context" } }
```

> ⚠️ 发布用的 manifest **不能**带源码 manifest 里的 `workspace:*` 依赖（DSH profile 是
> 独立的单包 pnpm workspace，会以 `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` 中止，且 GUI 的
> 插件安装/卸载会报出看起来无关的错误）。`deploy-to-profile.mjs` 会剥掉它们，包的
> `dist` 是自包含的，运行时依赖靠 `peerDependencies` 从宿主解析。

然后安装依赖并重启 DSH：

```sh
dsh plugin --profile <name> install
# 或：cd $DSH_HOME/profiles/<name> && pnpm install
```

重启后初始化：

```sh
dsh-magic-context setup    # 生成 magic-standard 薄 preset
dsh-magic-context doctor   # 验证安装
```

为新会话选择 `magic-standard` preset（Web UI: Settings → Agent preset，或
`settings.yaml: agent-presets.default: magic-standard`）。

> ⚠️ **使用前提**：Magic 的 agent 能力（知识注入、ctx_* 工具、/ctx-* 命令、
> historian、Dreamer、Magic 压缩策略）**只在新会话选择 `magic-standard` 预设时
> 加载**。未选择该预设的会话完全按官方语义运行——仅 host 半侧常驻
> （共享库初始化 + 状态卡/诊断端点），不会有任何 Magic 干预。想让插件默认
> 生效，把 `settings.yaml` 的 `agent-presets.default` 设为 `magic-standard`。

首次会话自动创建共享 SQLite（`~/.local/share/cortexkit/magic-context/context.db`）。

## 功能一览

- **知识模式**：m0/m1 baseline 注入（含 Mural 图像）、auto-search、§N§ tags
- **上下文管理**：DshTranscript + SurfaceMutationCoordinator（CAS + outbox saga）、
  historian 后台 compartment、Magic 压缩策略、缓存分类 SOFT+/SOFT/HARD
- **自动化**：Dreamer 全部任务（含**需要真工具**的任务，走 `ctx.subagents` 工具
  worker）、/ctx-recomp /ctx-wrapup /ctx-session-upgrade、/ctx-embed、feedback 桥接
- **维护**：setup/doctor、升级契约门、无写回安全（shipped preset 只读挂载）
- **Web**：状态卡 + Remote 诊断端点

完整对照见 [docs/FEATURES.md](./docs/FEATURES.md)。

## 验证状态

| 项 | 结果 |
|---|---|
| 单元测试（dsh-plugin 端口子集） | **212 通过 / 5 失败** —— 5 个是 Windows 专有的 `EBUSY`（临时目录锁）遗留失败，与端口逻辑无关 |
| `tsc --noEmit` | **0 错误**，且是在 **DSH 0.1.7-rc.1 的类型包**下编译（见下"契约门"） |
| 宿主符号审计 | **24/24 存在**（对比发行版 `app.asar` 的运行时导出，而非 `@types`） |
| dist 引用图 | **CLEAN**（20 个分块，0 死文件） |
| 真实会话验证 | 见 `e2e/verify-live.mjs`：**5 项全绿**（含"重复消息 id"与"注入 watermark 唯一性"） |

**契约门（升级前必跑）**：DSH 的 API 会在次版本间漂移，而本端口的 devDependencies
钉在精确版本上，所以**编译器就是漂移探测器**：

```sh
cd packages/dsh-plugin
# 把 @deepseek-ai/* 升到目标 DSH 版本，然后
bun install && bun run typecheck && bun test
node ../../tools/audit-host-symbols.mjs     # 运行时导出面核对（exit 0/1/2）
```

当前基线：**DSH `0.1.7-rc.1`**、**Magic Context 上游 0.42.6**（共享 schema 围栏
`v85`，启动日志 `upstream migration lane at boot: database=v85, supported_fence=v85`）。

`peerDependencies` 保留 `^0.1.7-alpha.2`：该范围经市场自身的 semver 判定器核实
**同时容纳 `0.1.7-alpha.2` 与 `0.1.7-rc.1`**（收紧成 `-rc.1` 反而会丢掉旧版支持）。

## 验证工具

| 工具 | 用途 |
|---|---|
| `e2e/verify-live.mjs` | 对一个**真实 DSH 会话**跑 5 项断言：日志完整性、会话表面的身份键唯一性（重复 `data.id` 会让对话区渲染空白）、注入 watermark 唯一性、§N§ 前缀与该消息自身 tag 号一致、tag 编号无重复。退出码 `0` 通过 / `1` 有失败 / `2` 探测本身跑不起来 |
| `tools/audit-host-symbols.mjs` | 把端口**运行时实际 import 的宿主符号**逐个核对到发行版 `app.asar`（读取失败会拒绝运行，不给假结论） |
| `tools/check-dist-graph.mjs` | 从 7 个包入口传递遍历 `dist`，验证引用图闭合、无死分块 |

## 已知问题与边界

- **不修改 DSH 源码**；不拦截/改写 `llm/stream messages[]`；OpenCode/Pi 行为不变。
- **`§N§` 是每会话独立编号**。DSH 的"恢复/种子化"会 fork 出一个 seeded 子会话
  （`header.parentSession`），新会话的编号重新从 §1 开始 —— 因此**跨 fork 引用旧
  §N§ 会失效**。这是上游编号语义的后果，不是缺陷。
- **历史疤痕**：2026-09-24 之前的版本会把 §N§ 预览按**裸消息 id** 建 tag，导致同一
  消息出现两行 tag、并把错误编号写进会话文本（已修，`17f9da7`）。修复前的会话里
  仍能看到这些疤痕；`verify-live.mjs` 默认只报告它们，加 `--since <部署时间>` 才把
  它们当失败。
- **`opencode-go` provider 依赖上游插件**：`dsh-opencode-go` 在 DSH `0.1.7-rc.1` 上
  未能注册其模型 provider（其注册被"能否找到凭据"门控，且失败被写入 DSH 不落盘的
  logger），后果是 **historian 无法调用该模型**（`no adapter registered for provider
  "opencode-go"`）。这是上游包的问题，等作者发版。
- 已知差异见 [docs/FEATURES.md](./docs/FEATURES.md)。

## 许可证

MIT（与 Magic Context、DSH 一致）。上游版权声明见各包 `NOTICE`。
