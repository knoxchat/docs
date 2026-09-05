---
slug: knoxchat-soul
title: "KnoxChat 扩展 — 智能体、记忆、解决方案。"
image: /img/soul-ui.png
authors: [knox]
tags: [knoxchat, ai, vscode]
---

# 智能体。记忆。解决方案。

**Knox** 是面向 VS Code 的 AI 编程环境——不是聊天浮层。自主 Agent、本地 Memory Brain，以及不依赖 Git 的检查点共享同一会话，模型可以作为一个系统来规划、执行、记忆和回退。

自带模型。开箱即用支持 Anthropic Claude、OpenAI GPT、DeepSeek、Gemini、Qwen、Grok、GLM、Codestral、Sonar Pro，以及 Knox 的按需模型 `knox/knox-ms`。

[![Knox](/img/main-ui.png)](https://www.youtube.com/watch?v=jx2tMqUGcuk)

**三套系统。一个循环。**

| | | |
|---|---|---|
| **Agent** | 规划、编辑、搜索与验证——29 个内置工具，Ask / Edits / Auto 权限，worktree 隔离 | `Cmd/Ctrl + Shift + Alt + A` |
| **Memory Brain** | 本地 SQLite 认知——层级、知识图谱、睡眠巩固。不上云。 | 侧边栏大脑图标 |
| **Checkpoints** | 即时回退文件——或同时回退文件 *以及* Agent 记住的内容 | 聊天中的恢复图标 |

## Memory Brain

大多数助手只保留少量笔记。Knox 运行一套 **本地认知栈**——位于 `~/.knox/memory/brain.sqlite` 的 SQLite 大脑，跨越所有会话，压缩该保留的内容，遗忘该遗忘的内容，并只注入下一轮真正需要的信息。

| ![](/img/memory-overview.png) |
|-|

数据不会离开您的机器。没有云同步，也没有远程记忆 API。可选的 AES-256-GCM 导出仅用于本地备份。

### 它能为您做什么

每一轮对话，Knox 都会构建受 token 预算约束的记忆块，并以 `## Relevant Memory Context` 注入。输入框上方的 **已注入记忆（Injected Memories）** 芯片会显示用了什么、为什么——钉住重要的，忘掉不需要的。若记忆变慢，聊天会提示后继续，而不是卡住。

实质性对话后会自动提取记忆（事实、决策、模式、错误修复）。也可以用 `@memory` 手动附加。

| ![](/img/memories.png) |
|-|

### 五标签 Memory 面板

打开 **Knox: View Memory** 或侧边栏大脑图标。

| 标签 | 您能得到什么 |
|-----|----------------|
| **Overview（总览）** | 健康分、8 阶段流水线状态、M₁–M₅ 有效上下文仪表盘、图谱上限、间隔重复复习、睡眠周期统计、24 小时趋势。**Refresh（刷新）** 与 **Consolidate（巩固）**。 |
| **Memories（记忆）** | 搜索、筛选、钉住、遗忘。批量管理：选择 / 全选 / 范围选择，批量钉住或删除，复制为 JSON 或 Markdown。日期分组：今天 / 本周 / 本月 / 更早。 |
| **Sessions（会话）** | 浏览情景历史与提取出的知识。跨会话积压搜索。 |
| **Graph（图谱）** | 实体与关系（上限 5,000）。搜索、按类型筛选，通过扩散激活探索邻居。 |
| **Settings（设置）** | 记忆模式、项目 vs 全局范围、检索、工作记忆、艾宾浩斯曲线、知识图谱、加密导出/导入、修复、清空。 |

| ![](/img/memory-sessions.png) |
|-|

### 记忆如何思考

- **8 阶段流水线** — 感觉捕获 → 编码 → 工作记忆 → 巩固 → 长期存储 → 检索 → 睡眠 → 上下文组装
- **5 层层级（M₁–M₅）** — 感觉缓冲（约 250 ms）、工作记忆（7 个槽位、30K tokens、30 秒 TTL）、短期、长期、程序性。压缩定理：`C_effective = Σ |Mᵢ| / rᵢ`
- **无需嵌入的检索** — FTS5 BM25 + trigram 模糊匹配 + 图谱扩散（深度 3）+ 近因 + 重要性。默认：阈值 θ = 0.6，top-k = 20
- **睡眠巩固** — NREM 重放、艾宾浩斯衰减（λ = 0.03）、REM 蒸馏。手动 **Consolidate** 或每 24 小时一次。已钉住的记忆跳过修剪
- **知识图谱** — 人物、文件、函数、概念，以及带权重的边。5,000 实体 LRU
- **模式** — `full` / `summarized`（默认）/ `selective`。**范围** — 当前项目（默认）或所有项目
- **写入净化** — 剥离提示注入、凭证和不可见 Unicode；召回的上下文会被围栏隔离，记忆不会被当作指令执行

| ![](/img/memory-graph.png) |
|-|

| ![](/img/memory-config.png) |
|-|

### Agent 记忆工具

默认 Agent 目录中的五个一等工具：`builtin_memory`、`builtin_memory_graph`、`builtin_memory_sessions`、`builtin_memory_manage`、`builtin_memory_learn`。Explore/review 子 Agent 可以回忆记忆，但不能写入。

`/autonomous <goal>` 在本地运行多步循环，每轮迭代都走记忆流水线（默认 10 步）。

## Agent Mode

一个自主 Agent：规划、执行并验证多步工作——权限由您控制，隔离可按需开启，停止按钮真的会停。

通过 **Agent** 标签或 `Cmd/Ctrl + Shift + Alt + A` 切换。一次切换：工具、检查点、撤销、影子预览和验证保持同步。Chat 仍仅文本；工具只在 Agent 中运行。

### 能感知的权限

从 Agent 标签或 **Shift+Tab** 循环 **Ask → Edits → Auto**：

| 模式 | 行为 |
|------|----------|
| **Ask** | 读取自动运行。写入、终端和网页先询问 |
| **Edits** | 文件编辑自动运行。终端和网页仍询问 |
| **Auto** | 本会话 YOLO——不会改写您已保存的工具设置 |

每个工具卡片：**Deny（拒绝）** / **Always（本聊天始终）** / **Approve（批准）**。路径与命令策略（`allow` / `ask` / `deny` glob）在 Core 中强制执行——**deny 始终优先**，包括 Auto。默认拦截 `rm -rf`、`~/.ssh` 等；工作区外路径会询问。

工具权限中的预设：**Ask on write** 与 **YOLO**。`AGENTS.md`、`CLAUDE.md` 和 `.knoxrules` 会合并进来，Knox 专用规则优先。

### 29 个内置工具

Agent 读取、编辑、搜索并验证——目录里的工具都已实现，不是一堆空壳。

**文件与发现** — 读取、创建、StrReplace 编辑、写入、Codex 风格 `apply_patch`（多文件、原子）、glob、目录树、仓库地图、ripgrep、git diff

**Shell 与任务** — 持久 cwd、流式 stdout、约 30 秒后自动后台、`await_shell` 轮询或终止。进程组终止，管道也会停

**Git** — status、diff、log、commit。不 push、不 force、不 amend。优先使用这些，而不是 shell git

**编排** — `task` 子 Agent（`explore` / `review` / `general`）、`ask_user`（永不自动批准）、`workspace_checkpoint`

**智能** — LSP（定义、引用、悬停、符号、调用层次）、实时网页搜索、按需技能、生成测试

**记忆** — 上文五个 Memory Brain 工具

只读工具在模型一次发出多个时并行运行。写入保持串行。变更类工具之后，Knox 会检查诊断，并可尝试 LLM 修复（`knoxchat.enablePostEditVerification`，默认开启），带按文件熔断。

### 隔离，而不是寄希望于运气

- **Worktree**（可选芯片）— 编辑和 shell 在 `git worktree` 中运行，直到您 **Apply（应用）**（拷回）或 **Discard（丢弃）**。会话级隔离
- **影子预览**（`knoxchat.enableShadowPreview`，默认关闭）— 单次 Apply 前并排 Accept/Reject。与 Worktree 不是同一回事
- **撤销 / 重做** — 真实的文件字节快照。Agent 激活时使用 `Cmd/Ctrl + Shift + Alt + Z` / `Y`

### 掌控循环

- **活动时间线** — 思考 → 读取 → 搜索 → 编辑 → 测试/shell。点击某一步跳到对应工具卡片。时间线上有检查点标记
- **轮次仪表** — 已用步数 / 上限（默认 40）、预估 token、已用时间、**Stop（停止）**。工具执行中途 Stop 仍然可用
- **Jobs 面板** — 分离的 shell 任务与进行中的子 Agent。查看输出、终止、清理已完成项
- **死循环防护** — 相同工具+参数或失败连击（默认 3 次）会强制只输出文本摘要
- **询问用户** — 运行中途的选择题或短答。永不自动批准

## Checkpoints

Git 用于您有意提交的内容。检查点用于 Agent 刚刚做的一切——一次不依赖 `git reset` 的回退。

快照存放在 `~/.knox/checkpoints/`。恢复会重放增量链，使工作区回到该时间点，包括之后才创建的文件。

| ![](/img/cp-list.png) |
|-|

### 两种恢复模式

| | 会回来什么 |
|---|-----------------|
| **Restore（恢复）** | 仅文件。记忆保留。Agent 会被告知记忆 *没有* 回退 |
| **Restore files and memory（恢复文件和记忆）** | 文件 + 关联的 Memory Brain 快照 + 之后的情景轮次被裁剪 |

默认仅恢复文件。记忆回退需主动选择：**Shift-click** 聊天恢复按钮、时间线 `cp` 标记，或浮层。任何恢复之后，系统备注会告诉模型不要假设之后的编辑仍然存在。

### 何时拍快照

- **每轮第一次变更类工具之前** — 编辑、补丁、测试、git commit 或终端。始终如此。空树会先打基线
- **AI 回复之后**，当工作区文件发生变化时（默认开启）
- **手动** — 命令面板 **Knox: Create Checkpoint**，或 Agent 工具 `builtin_workspace_checkpoint`
- **Worktree Apply** — 文件拷回前先打一轮检查点
- **记忆批量删除** — 一次 Memory Brain 安全检查点（与工作区快照分开）

| ![](/img/cp-cc.png) |
|-|

### 聊天中的浮层

聊天工具栏的恢复图标打开 Checkpoints 浮层（列表 + 配置）。标题栏按钮已去掉——您无需离开对话。

- **This session（本会话）** 筛选（默认开启）
- 按描述或 ID 搜索
- 日期分组、文件统计、8 位 ID
- 与上一检查点、**当前工作区**（恢复预览）或任意更早检查点的 diff
- 分栏 / 统一视图、词级高亮、单文件恢复
- 二进制资源（图片、字体、PDF、wasm），捕获开启时可用
- 多选批量删除

### 保留与忽略

默认：1,000 个检查点、7 天保留、每文件 5 MB、二进制捕获开启、每日自动清理。已跟踪扩展覆盖常见语言；未知文件会嗅探。`.knoxignore`、`.gitignore` 以及内置嘈杂路径（`node_modules/`、`.git/`、`dist/` 等）都会生效。**Knox Checkpoint: Create global .knoxignore** 提供语言预设。

## Soul — 一个会话，三套系统

这就是产品本身，不是侧边栏里的某个功能。

一个 `session.id` 绑定 Agent 循环、工作区检查点和 Memory Brain。

- 每轮第一次变更类工具始终创建工作区检查点（`soul-turn-…`）
- 变更类工具、拒绝、死循环、步数上限、询问用户、worktree 应用/丢弃，以及压缩，都会把 **SoulEvents** 写入情景记忆
- 压缩会钉住与最近工作区检查点关联的大脑快照
- 恢复可以只回退文件，或同时回退文件 **以及** Agent 记住的内容
- 记忆回滚会提供关联的文件检查点——磁盘不会动，除非您要求

模型、磁盘和记忆彼此保持一致。

## AI 聊天

侧边栏聊天实时流式输出；在 Agent 标签上时，工具执行会内联显示。

- **多模型** — Anthropic Claude、OpenAI GPT-5.5 / GPT-5.6、DeepSeek V4、Gemini 3.7、Qwen 3.8、Grok 4.6、GLM 5.3 以及 `knox/knox-ms`
- **按角色路由** — 为 `chat`、`edit`、`apply`、`summarize`、`viewRead`、`realTimeSearch` 指定不同模型。读取用更便宜的模型；写入用您的聊天模型
- **会话** — 多个标签、输入工具栏中的历史浮层、恢复
- **丰富上下文** — 文件、文件夹、选区、图片、终端、git diff，以及 `@` 提供者
- **压缩** — 长线程摘要，同时保留记忆与计划块

## 行内代码编辑

自然语言编辑，配合可视化 diff 审查。

- **`Cmd/Ctrl + I`** — 描述改动；Knox 在编辑器中流式输出纵向 diff
- **按块接受 / 拒绝** — `Alt + Cmd/Ctrl + Y` / `N`
- **全部接受 / 拒绝** — `Shift + Cmd/Ctrl + Enter` / `Backspace`
- **多文件批量 diff** — 在专用面板中跨文件审查并应用
- **智能应用** — 统一 diff 检测、LLM 辅助惰性应用，或 AST 回退

## 斜杠命令

| 命令 | 说明 |
|---------|-------------|
| `/autonomous` | 本地多步循环，每轮迭代都走记忆 |
| `/cmd` | 从自然语言生成终端命令 |
| `/commit` | 根据暂存变更生成 Conventional Commit 信息 |
| `/changelog` | 根据 git 历史生成 changelog |
| `/issue` | 起草 GitHub issue |
| `/pr` | 拉取请求描述 |
| `/review` | 带详细反馈的代码审查 |
| `/share` | 通过 Knox 分享内容 |
| `/http` | 调用 HTTP 端点 |
| `/skills` | 列出已加载技能 |

自定义命令放在 `config.yaml` 或 `.prompt` 文件中。

## 上下文提供者

用 `@` 附加上下文。始终可用的默认项：**file**、**diff**、**problems**、**repo-map**、**terminal**、**memory**。

| 提供者 | 说明 |
|----------|-------------|
| `@CurrentFile` | 当前打开的文件 |
| `@FileTree` | 项目文件树 |
| `@OpenFiles` | 所有打开的编辑器标签 |
| `@Folder` | 某个文件夹的内容 |
| `@GitCommit` | 某个 git commit |
| `@Diffs` | 当前工作区 git diff |
| `@Terminal` | 终端输出 |
| `@Problems` | VS Code 诊断 |
| `@Debugger` | 暂停调试线程的局部变量 + 调用栈（需开启） |
| `@GitHub Issues` | 仓库中的 issue（需 token） |
| `@Database` / `@Postgres` | 数据库上下文（需开启） |
| `@URLs` / `@Web` / `@Google` | 网页内容与搜索（需开启） |
| `@ProjectMemory` / `@memory` | Memory Brain 中存储的约定与笔记 |
| `@Clipboard` | 剪贴板内容 |
| `@RepoMap` | 仓库结构（tree-sitter 符号） |
| `@OS` | 操作系统信息 |

## 上下文菜单操作

**右键选中代码：**

- **Add as Context（添加为上下文）** — 将选区发送到 Knox 聊天
- **Write Comments（写注释）** / **Write Docstring（写文档字符串）**
- **Fix Code（修复代码）** / **Optimize Code（优化代码）**
- **Fix Grammar / Spelling（修复语法 / 拼写）** — Markdown 文件

**资源管理器：** Select Files as Context（选择文件作为上下文）  
**终端：** Debug Terminal（`Cmd/Ctrl + Shift + R`）

## Knox 把数据存在哪里

所有用户数据都是全局的，位于 `~/.knox/`——不会创建项目本地的 `.knox/` 目录。遗留的项目 `.knox/` 文件夹会在首次启动时自动迁移。

| 路径 | 内容 |
|------|----------|
| `config.yaml` | 用户配置 |
| `~/.knox/sessions/` | 对话历史 |
| `~/.knox/checkpoints/` | 工作区检查点 |
| `~/.knox/memory/brain.sqlite` | Memory Brain（仅本地） |
| `~/.knox/prompts/` | 全局 prompt 文件 |
| `~/.knox/assistants/` | Assistant 定义 |
| `~/.knox/rules/` | 全局按主题规则 |
| `~/.knox/skills/` | Knox 原生技能 |
| `~/.knox/.knoxignore` | 全局检查点忽略 |

## 规则系统

项目标准会注入每一次 AI 交互。后出现的来源优先。

**合并顺序（越后越高）：**

1. `~/.knoxrules` 与 `~/.knox/rules/*.md`
2. `{workspace}/CLAUDE.md`
3. `{workspace}/AGENTS.md`
4. `{workspace}/.knox/AGENTS.md`
5. `{workspace}/.knoxrules` — Knox 专用规则优先于通用 Agent 文件
6. 从打开文件向上遍历嵌套的 `{subdir}/AGENTS.md`

```markdown
---
applyTo: ["**/*.ts", "**/*.tsx"]
priority: 10
---
- Use `interface` for object shapes, `type` for unions
- Prefer `const` over `let`
- All exports must have JSDoc
```

支持 `applyTo` glob、优先级，以及模板变量（`{os}`、`{arch}`、`{home}`）。`AGENTS.md` 可声明 `always` / `ask` / `never` 的路径与命令策略。

## 技能系统

可复用的指令集，用于扩展 Knox。

**发现路径：**

- `~/.knox/skills/`（全局，Knox 原生）
- 工作区中的 `skills/` 或 `skill/`
- `.claude/skills/`、`.agents/skills/`（项目）
- `~/.claude/skills/`（全局）

每个技能是一个包含 `SKILL.md` 的文件夹：

```markdown
---
name: react-components
description: React component development patterns
---
## Instructions
- Use functional components with hooks
- Extract shared logic into custom hooks
@src/components/Button.tsx
```

用 `/skills` 列出已加载技能。Agent 可通过 `builtin_skill` 按需加载技能正文。

## Prompt 文件

可复用 prompt，以 `.prompt` 文件放在 `~/.knox/prompts/`，或项目级 `.prompts/` / `.knox/prompts/`。YAML `prompts` 或 `.prompt` 文件。

```markdown
---
name: api-endpoint
description: Generate a new API endpoint
---
Create a RESTful endpoint following our patterns.
@src/routes/example.ts
@currentFile
<system>You are an expert backend developer.</system>
```

支持 `@file.ts`、`@https://...`、上下文提供者（`@currentFile`、`@repo-map`）、system-message 块，以及递归嵌套。

## 配置

Knox 通过 `~/.knox/` 中的 `config.yaml` 以及应用内 Settings 页面配置。记忆偏好在 Memory 面板中（不在 `settings.json`）。

### VS Code 设置

| 设置 | 默认值 | 说明 |
|---------|---------|-------------|
| `knoxchat.showInlineTip` | `true` | 行内快捷键提示 |
| `knoxchat.enableQuickActions` | `false` | 选区上的快捷操作 |
| `knoxchat.enablePostEditVerification` | `true` | 变更类工具后的诊断 + LLM 修复 |
| `knoxchat.enableShadowPreview` | `false` | Apply 前并排 Accept/Reject |
| `knox.checkpoints.maxCheckpoints` | `1000` | 最多存储的检查点数 |
| `knox.checkpoints.retentionDays` | `7` | 检查点保留天数 |
| `knox.checkpoints.maxStorageBytes` | `1000000000` | 检查点存储上限（1 GB） |
| `knox.checkpoints.maxFilesPerCheckpoint` | `100` | 每个检查点最多列出的文件数 |
| `knox.checkpoints.maxFileSizeBytes` | `5242880` | 捕获文件大小上限（5 MB） |
| `knox.checkpoints.captureBinaryFiles` | `true` | 快照图片、字体、PDF 等 |
| `knox.checkpoints.enableCompression` | `true` | 压缩开关 |
| `knox.checkpoints.enableAutoCheckpoints` | `true` | 文件变化时在 AI 回复后自动创建 |
| `knox.checkpoints.trackedExtensions` | `[js, ts, py, …]` | 额外跟踪的扩展名 |
| `knox.checkpoints.autoCleanup` | `true` | 自动删除旧检查点 |
| `knox.checkpoints.cleanupIntervalHours` | `24` | 清理间隔 |

Agent 循环上限（`experimental.agentMaxSteps` 默认 40，`experimental.agentDoomLoopThreshold` 默认 3）以及路径/命令策略，在应用内 Settings / Tools permissions UI 中。

## 键盘快捷键

| 操作 | macOS | Windows / Linux |
|--------|-------|-----------------|
| 打开 Knox Chat | `Cmd + L` | `Ctrl + L` |
| 将选区添加为上下文 | `Cmd + Shift + L` | `Ctrl + Shift + L` |
| 行内编辑 | `Cmd + I` | `Ctrl + I` |
| 切换 Agent Mode | `Cmd + Shift + Alt + A` | `Ctrl + Shift + Alt + A` |
| 循环 Ask / Edits / Auto | `Shift + Tab` | `Shift + Tab` |
| 接受全部 Diff | `Shift + Cmd + Enter` | `Shift + Ctrl + Enter` |
| 拒绝全部 Diff | `Shift + Cmd + Backspace` | `Shift + Ctrl + Backspace` |
| 接受 Diff 块 | `Alt + Cmd + Y` | `Alt + Ctrl + Y` |
| 拒绝 Diff 块 | `Alt + Cmd + N` | `Alt + Ctrl + N` |
| Debug Terminal | `Cmd + Shift + R` | `Ctrl + Shift + R` |
| 撤销 Agent 操作 | `Cmd + Shift + Alt + Z` | `Ctrl + Shift + Alt + Z` |
| 重做 Agent 操作 | `Cmd + Shift + Alt + Y` | `Ctrl + Shift + Alt + Y` |
| 接受影子预览 | `Cmd + Shift + Alt + S` | `Ctrl + Shift + Alt + S` |
| 拒绝影子预览 | `Cmd + Shift + Alt + Backspace` | `Ctrl + Shift + Alt + Backspace` |
| 从聊天应用代码 | `Alt + A` | `Alt + A` |
| 恢复文件 **以及** 记忆 | Shift-click 恢复 / `cp` 标记 | 相同 |
| 退出编辑模式 | `Escape` | `Escape` |

## 语言与文件支持

Knox 覆盖您已经在用的语言：

JavaScript / TypeScript、Python、Java / Kotlin、C / C++、C#、Go、Rust、PHP、Ruby、Swift、HTML / CSS / SCSS、JSON / YAML、Markdown、SQL —— 以及带语法高亮的自定义 `.prompt` 文件。

## 国际化

- **English**（默认）
- **Chinese**（中文）

在侧边栏 Settings 中切换语言。Agent UI、权限、任务和工具错误卡片均已本地化。

## 要求

- **VS Code** ≥ 1.125.0
- **Node.js** ≥ 24.19.0
- 至少一个受支持 LLM 提供商的 API key（Anthropic、OpenAI 或 Knox）

## 文档与支持

- **文档**：[https://docs.knox.chat](https://docs.knox.chat)
- **Open VSX**：[https://open-vsx.org/extension/knoxchat/knoxchat](https://open-vsx.org/extension/knoxchat/knoxchat)
- **GitHub**：[https://github.com/knoxchat/knoxchat](https://github.com/knoxchat/knoxchat)
- **邮箱**：support@knox.chat
- **主页**：[https://knox.chat](https://knox.chat)
