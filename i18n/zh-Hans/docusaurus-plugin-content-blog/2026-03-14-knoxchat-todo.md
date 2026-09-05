---
slug: knoxchat-todo
title: "KnoxChat VSCode 扩展 — TODO"
image: /img/knoxchat-todo.png
authors: [knox]
tags: [knoxchat, api, ai, context, vscode]
---

### Todo/Task 管理系统 — AI 驱动的任务编排

一个全面的 Todo/Task 管理系统，分析复杂的用户请求，将其分解为结构化的依赖感知任务，并通过工具调用驱动的流同步和持久化会话管理来跟踪进度。

| ![](/img/knoxchat-vscode-preview.png) |
|-|

> [在此安装 KnoxChat 扩展 >>>](https://open-vsx.org/extension/knoxchat/knoxchat)

#### 问题 — 非结构化的任务执行

此前，复杂的多步骤请求以整体操作方式处理：
- **无可见性**：用户无法看到 AI 正在处理什么或还有什么待处理
- **无恢复**：失败的步骤需要重新启动整个请求
- **无持久化**：如果会话中断，进度就会丢失
- **无依赖管理**：不了解任务排序或前置条件

#### 解决方案 — 流同步任务引擎

一个完整的任务编排系统，涵盖 VS Code 扩展后端（`TodoManager`）、双向协议层、Redux 状态管理（`todoSlice` + `planTaskSlice`）、工具调用驱动的流同步（`todoStreamSync`）以及 React GUI（`TodoPanel` + `PlanTaskStatusPanel`）。

#### 核心架构

##### 1. 丰富的数据模型 (`core/index.d.ts`)

每个任务是一个包含 30 个字段的 `TodoItem`：

```typescript
type TodoStatus = "pending" | "in-progress" | "completed" | "failed" | "cancelled" | "blocked";
type TodoPriority = "high" | "medium" | "low";
type TodoComplexity = "simple" | "medium" | "complex";
type TodoCategory = "coding" | "analysis" | "research" | "testing" | "documentation" | "refactoring" | "devops" | "general";

interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  complexity: TodoComplexity;
  category: TodoCategory;
  dependsOn: string[];           // Upstream task IDs
  blockedBy: string[];           // Tasks blocking this one
  filePaths: string[];           // Associated file paths
  toolsNeeded: string[];         // Tools needed (edit_file, run_terminal_cmd, etc.)
  estimatedTimeMs: number;       // Estimated time in milliseconds
  actualTimeMs: number;          // Actual time spent in milliseconds
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  resultPreview?: string;        // Human-readable evidence summary
  verified?: boolean;            // true if completion verified by evidence
  evidenceScore?: number;        // 0-1 confidence score
  toolCallCount?: number;        // Number of tool calls that contributed
  subtasks: TodoItem[];          // Recursive nesting
  parentId?: string;             // Parent todo ID (if subtask)
  orderIndex: number;            // Display order
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  progress: number;              // 0-100
  tags: string[];                // Technology tags (typescript, react, docker, etc.)
}
```

##### 2. 会话管理

任务被分组到具有完整生命周期的 `TodoSession` 对象中：

```typescript
interface TodoSession {
  id: string;
  title: string;
  description: string;
  prompt: string;                          // Original user request
  todos: TodoItem[];
  status: "idle" | "active" | "paused" | "completed" | "failed";
  progress: number;                        // 0-100
  stats: TodoSessionStats;
  config: TodoSessionConfig;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  workspaceDirectory?: string;
  conversationId?: string;
}
```

**统计数据** — 11 个聚合计数器，包括 `verifiedTodos`：

```typescript
interface TodoSessionStats {
  totalTodos: number;
  completedTodos: number;
  verifiedTodos: number;     // Completed todos verified by tool-call evidence
  failedTodos: number;
  cancelledTodos: number;
  inProgressTodos: number;
  pendingTodos: number;
  blockedTodos: number;
  totalEstimatedTimeMs: number;
  totalActualTimeMs: number;
  totalRetries: number;
}
```

---

#### 功能 1：AI 驱动的任务分析与分解

自动分析用户消息以检测何时任务分解有价值，然后使用 `ReasoningEngine` 或本地 NLP 回退来将其分解。

**智能检测 (`shouldCreateTodos()`)：**
- 显式触发器：消息中包含 `/todo` 或 `@todo`
- 模式匹配：17 个正则模式用于检测复杂任务（全栈、CRUD、REST API、CI/CD、auth、GraphQL、微服务、架构、迁移、数据库架构、组件库、测试框架等）
- 多子句检测：包含 3+ 个由逗号、分号、`and` 或 `then` 分隔的子句（每个 >10 字符）的消息
- 阈值：2+ 模式匹配触发创建

**AI 分析（通过 `ReasoningEngine.performTaskAnalysis()`）：**
```
User: "Build a REST API with authentication, add unit tests, and set up Docker deployment"

AI Analysis Result:
├── Todo 1: Set up Express.js REST API scaffold     [high, coding, simple]
├── Todo 2: Implement JWT authentication middleware  [high, coding, medium]
├── Todo 3: Create CRUD endpoints                   [medium, coding, medium]
├── Todo 4: Write unit tests with Jest              [medium, testing, medium]  → depends on [1,2,3]
└── Todo 5: Create Dockerfile and docker-compose    [low, devops, simple]     → depends on [1]
```

**本地回退分析 (`performLocalAnalysis()`)：**
- 句子边界分割（`. ; and then, then`）
- 单句输入的逗号分割回退
- 通过 8 个关键词字典自动推断类别（coding、analysis、research、testing、documentation、refactoring、devops、general）
- 复杂度：`simple`（≤2 步）、`medium`（3–5）、`complex`（>5）
- 优先级分配：前三分之一 = high，中间 = medium，后三分之一 = low
- 通过正则提取文件路径（`/path/to/file.ext`）
- 技术标签检测：TypeScript、JavaScript、React、Node.js、Python、Rust、API、Database、UI、CSS、HTML、Docker
- 从动作动词推断工具：`create` → `edit_file`、`test` → `run_terminal_cmd`、`search` → `grep_search`/`codebase_search`、`install` → `run_terminal_cmd`、`delete` → `delete_file`、`list` → `list_dir`

**计划生成：**
对于复杂任务（>2 步），系统通过 `ReasoningEngine.generateImplementationPlan()` 生成结构化实施计划并写入 `.knox/plans/plan_{sessionId}.md`。计划步骤有状态标记（❌ → 🔄 → ✅），随着 todo 进展而更新。

#### 功能 2：顺序流同步执行引擎

任务在流同步模型中**逐个执行**。GUI 的 `todoStreamSync` 驱动推进——后端 `TodoManager.processNextTodos()` 只将下一个就绪的 todo 标记为 `in-progress`（最多 1 个并发）。

**依赖解析：**
```
[Task A] ──→ [Task C] ──→ [Task E]
[Task B] ──→ [Task D] ──┘

• Tasks execute sequentially (1 at a time)
• Task B starts only after Task A completes
• Dependency-blocked tasks transition: blocked → pending when upstream completes
```

**关键机制：**
- **`processNextTodos()`**：选择第一个就绪的 todo（pending + 依赖已满足）并标记为 `in-progress`。一次只允许 1 个。
- **`areDependenciesMet()`**：检查所有 `dependsOn` 的 todo 是否为 `completed` 或 `cancelled`
- **`unblockDependentTodos()`**：当依赖解决时将 `blocked` → `pending`；清除 `blockedBy` 引用
- **`getReadyTodos()`**：返回所有依赖已满足的 pending todo
- **`advanceToNextTodo()`**：从 GUI 流同步调用；完成当前进行中的 todo，触发 `processNextTodos()`
- **AbortController**：在暂停/取消时干净地取消进行中的执行

**执行模型（流同步）：**
```
todoStreamSync.ts (GUI)                        TodoManager.ts (IDE)
────────────────────                           ─────────────────────
onStreamStart()                                
  ├─ Build tracker state                       
  ├─ dispatch(startTodoSession)  ──────────→   startSession()
  │                                              └─ processNextTodos() → mark first todo in-progress
  │                                            
onToolCallEvent() × N                          
  ├─ Count tool calls on current task          
  ├─ Collect affected file paths               
  ├─ If toolCallCount ≥ 3 (AUTO_ADVANCE):     
  │   dispatch(completeTodo)     ──────────→   completeTodo() → unblock deps → processNextTodos()
  │                                            
onStreamEnd() [wrapperDepth === 0 only]        
  ├─ Complete ALL remaining tasks              
  └─ dispatch(completeTodo) for each  ─────→   completeTodo() → checkSessionCompletion()
```

#### 功能 3：带退避的自动重试

失败的任务以递增的延迟自动重试。

**配置：**
- `retryOnFailure`：开关自动重试（默认：`true`）
- `maxRetries`：每个任务的最大重试次数（默认：`2`）

**退避公式：** `1000 × retryCount` ms
- 第 1 次重试：1 秒延迟
- 第 2 次重试：2 秒延迟

**行为：**
- 如果还有重试次数：重置状态为 `pending`，增加 `retryCount`，在退避后安排重试
- 如果重试次数耗尽：永久标记为 `failed` 并附带 `errorMessage`，仍处理下一个 todo
- 手动重试：通过 UI 按钮可用，增加 `retryCount`，重置状态为 `pending`

#### 功能 4：持久化会话存储

会话自动保存到磁盘，在编辑器重启后依然存在。

**存储布局：**
```
.knox/
├── todos/
│   ├── {sessionId}.json         # Full session + all todos (JSON)
│   └── ...
└── plans/
    ├── plan_{sessionId}.md      # Implementation plan (Markdown)
    └── ...
```

**特性：**
- **自动保存计时器**：每个会话的可配置间隔（默认 30s），通过 `setInterval`
- **事件触发保存**：在状态变化时通过 `persistSession()` 调用
- **原子写入**：通过 `vscode.workspace.fs.writeFile` API
- **启动时加载**：`loadPersistedSessions()` 从 `.knox/todos/` 读取所有 `.json` 文件
- **会话删除**：同时移除内存中的 map 条目和磁盘上的 JSON 文件

#### 功能 5：实时进度跟踪 UI

两个 React 面板，集成到聊天界面中，支持实时更新。

**主面板 — `TodoPanel.tsx`（9 个子组件）：**

| 组件 | 用途 |
|------|------|
| `StatusIcon` | 状态指示器，带动画旋转器、对勾、警告、锁定；显示验证盾牌 + 证据分数 |
| `CategoryIcon` | 7 种类别特定图标：Code2、Lightbulb、Globe、FlaskConical、FileText、Wrench、Sparkles |
| `PriorityBadge` | 颜色编码药丸标签 — H（红色）、M（黄色）、L（灰色） |
| `ProgressBar` | 带 CSS 宽度过渡的动画水平进度条 |
| `TodoItemRow` | 递归行，带基于深度的缩进、可展开子任务、重试/跳过操作 |
| `SessionStatusLine` | 状态点 + 标签 + 完成计数 + 百分比 |
| `SessionStatsFooter` | 已完成、已验证、失败、跳过、重试、总耗时 |
| `ActionButton` | 可复用的主题按钮组件 |
| `TodoPanel` | 主容器 — 折叠/展开状态、会话创建表单、操作按钮 |

**次要面板 — `PlanTaskStatusPanel.tsx`：**
- 统一的流式进度面板，合并 Knox MS 任务元数据和 todo 进度
- `TodoTaskRow` 子组件渲染带状态图标和工具调用计数的个别 todo 项
- 当 Knox MS 任务为空时回退到基于 todo 的任务列表
- 在流式传输期间显示来自 `planTaskSlice` 的 `todoCurrentTitle`

**使用 29 个 Lucide React 图标**，包括 `Shield`、`Zap`、`CheckCircle2`、`Loader2`、`Lock`、`AlertTriangle`、`Code2`、`FlaskConical`、`Globe`、`FileText`、`Wrench`、`Sparkles`、`Lightbulb` 等。

**面板状态：**

```
Collapsed:  [Todo Progress ▼] [75%] ████████░░
Expanded:   Status • 3/4 completed • 75% with full task list, actions, stats
No Session: Create form with prompt input
```

#### 功能 6：双向协议层

在 VS Code 扩展和 React webview 之间完全类型化的消息传递，定义在 `core/protocol/` 中。

**IDE → Webview（5 种消息）** — `ToWebviewFromIdeOrCoreProtocol`：

| 消息 | 载荷 | 用途 |
|------|------|------|
| `todo/sessionCreated` | `{ session: TodoSession }` | 新会话通知 |
| `todo/sessionUpdated` | `{ session: TodoSession }` | 会话状态变更 |
| `todo/sessionCompleted` | `{ session: TodoSession }` | 会话完成 |
| `todo/todoUpdated` | `{ sessionId, todo: TodoItem }` | 单个任务更新 |
| `todo/progressUpdate` | `{ sessionId, progress, stats }` | 进度推送 |

**Webview → IDE（13 种消息）** — `ToIdeFromWebviewProtocol`：

| 消息 | 载荷 → 响应 | 用途 |
|------|------------|------|
| `todo/createSession` | `{ prompt, config? }` → `{ session }` | 从描述创建 |
| `todo/startSession` | `{ sessionId }` → `{ success }` | 开始执行 |
| `todo/pauseSession` | `{ sessionId }` → `{ success }` | 暂停活跃会话 |
| `todo/resumeSession` | `{ sessionId }` → `{ success }` | 恢复暂停的会话 |
| `todo/cancelSession` | `{ sessionId }` → `{ success }` | 带清理的取消 |
| `todo/retryTodo` | `{ sessionId, todoId }` → `{ success }` | 重试失败任务 |
| `todo/skipTodo` | `{ sessionId, todoId }` → `{ success }` | 跳过阻塞/失败的任务 |
| `todo/completeTodo` | `{ sessionId, todoId, resultPreview? }` → `{ success }` | 完成任务（流同步） |
| `todo/advanceSession` | `{ sessionId }` → `{ success }` | 推进到下一个 todo（流结束） |
| `todo/getSession` | `{ sessionId }` → `{ session }` | 按 ID 获取会话 |
| `todo/getCurrentSession` | `undefined` → `{ session }` | 获取活跃会话 |
| `todo/listSessions` | `undefined` → `{ sessions[] }` | 列出所有会话 |
| `todo/deleteSession` | `{ sessionId }` → `{ success }` | 删除会话 + 磁盘数据 |

#### 功能 7：Redux 状态管理

两个 Redux Toolkit slice，包含 12 个异步 thunk，覆盖完整的会话生命周期。

**`todoSlice` 状态：**
```typescript
interface TodoState {
  currentSession: TodoSession | null;
  sessions: TodoSession[];
  isPanelVisible: boolean;
  isPanelCollapsed: boolean;
  isLoading: boolean;
  error: string | null;
  autoCreateEnabled: boolean;
  viewingSessionId: string | null;
}
```

**12 个异步 Thunk：** `createTodoSession`、`startTodoSession`、`pauseTodoSession`、`resumeTodoSession`、`cancelTodoSession`、`retryTodo`、`skipTodo`、`completeTodo`、`advanceSession`、`fetchCurrentSession`、`fetchAllSessions`、`deleteTodoSession`

**12 个同步 Reducer：** `sessionCreated`、`sessionUpdated`、`sessionCompleted`、`todoUpdated`、`progressUpdated`、`togglePanelVisible`、`togglePanelCollapsed`、`setPanelCollapsed`、`setPanelVisible`、`toggleAutoCreate`、`setViewingSession`、`clearError`

**`planTaskSlice` 集成：**
`planTaskSlice` 跟踪流式传输元数据（Knox MS + todo 同步），字段包括：
- `hasTodoSync`、`todoSessionId`、`todoCurrentIndex`、`todoCompletedCount`
- 由 `todoStreamSync` 通过 `syncTodoProgress` action 更新

**自动重置：** 当新聊天会话开始时，Todo 状态通过 `newSession` extra reducer 重置。

#### 功能 8：会话配置

每个会话 8 个可调参数（`TodoSessionConfig`）：

| 参数 | 默认值 | 描述 |
|------|--------|------|
| `maxConcurrentTodos` | 3 | 最大并发槽位（当前由流同步强制为 1） |
| `autoStartNextTodo` | true | 完成时自动开始下一个任务 |
| `showProgressNotifications` | true | VS Code 通知弹窗 |
| `autoSaveInterval` | 30000 | 持久化计时器间隔（ms） |
| `retryOnFailure` | true | 自动重试失败的任务 |
| `maxRetries` | 2 | 每个任务的最大重试次数 |
| `autoGenerateSubtasks` | true | 为复杂 todo 自动生成子任务 |
| `analyzeDependencies` | true | 运行依赖分析（将任务串联排序） |

#### 功能 9：国际化 (i18n)

跨英语和中文的 107 个翻译键，提供完整的多语言支持。

**扩展 (`extensions/vscode/src/i18n/locales/en/todo.json`)：** 43 个键，覆盖会话生命周期、任务操作、状态消息、计划审批、验证轮次

**GUI (`gui/src/locales/en/todo.json`)：** 64 个键，覆盖面板 UI、状态标签、操作按钮、统计数据、空状态、提示信息、验证徽章、难度等级

**语言：** English (`en`) + Chinese (`zh`)

#### 功能 10：VS Code 命令注册

通过 `TodoManager.registerCommands()` 中的 `vscode.commands.registerCommand` 注册 18 个命令：

| 类别 | 命令 |
|------|------|
| **会话 CRUD** | `knox.todo.createSession`、`knox.todo.startSession`、`knox.todo.pauseSession`、`knox.todo.resumeSession`、`knox.todo.cancelSession`、`knox.todo.deleteSession` |
| **Todo 操作** | `knox.todo.retryTodo`、`knox.todo.skipTodo` |
| **查询** | `knox.todo.getCurrentSession`、`knox.todo.getSession`、`knox.todo.listSessions` |
| **计划工作流** | `knox.todo.approvePlan`、`knox.todo.rejectPlan`、`knox.todo.getPlan` |
| **交互式** | `knox.todo.createInteractive` — 命令面板输入框 → 会话创建 → 可选立即开始 |

#### 功能 11：工具调用驱动的进度跟踪 (`todoStreamSync`)

**设计原则：**
1. **工具调用 = 进度。** 每个工具调用推进当前任务的计数。足够多的调用后，任务被标记为完成。
2. **顺序模型。** AI 按顺序执行任务。`currentIndex` 指针向前推进。
3. **不得提前完成。** 任务仅在积累足够的工具调用后 或 整个对话结束时（在 `wrapperDepth === 0` 的最外层包装退出）才完成。
4. **每个完成的任务都获得盾牌图标。** 在跟踪器层面没有"低证据"与"已验证"的区分。

**架构：**
```
callTool.ts          todoStreamSync.ts              TodoManager.ts
───────────         ──────────────────             ──────────────────
ToolCallEvent ──→   onToolCallEvent()
                      ├─ Count on current task
                      ├─ Collect file paths
                      ├─ If count ≥ 3 (AUTO_ADVANCE_THRESHOLD):
                      │   completeCurrentAndAdvance()
                      │     └─ dispatch(completeTodo) ──────→  completeTodo()
                      │                                          ├─ Parse verification metadata
                      │                                          ├─ Update plan file (🔄 → ✅)
                      │                                          ├─ Unblock dependents
                      │                                          └─ processNextTodos()
                      │
                      └─ emitProgress() → syncTodoProgress   planTaskSlice
                                           (Redux action)       → PlanTaskStatusPanel (UI)
                                                                → TodoPanel (UI)
```

**跟踪器状态：**
```typescript
interface TrackerState {
  sessionId: string;
  todos: TodoEntry[];      // { id, title, completed, toolCallCount, files, chars }
  currentIndex: number;
  totalToolCalls: number;
  totalChars: number;
  finished: boolean;
  roundCount: number;
}
```

**关键常量：**
- `AUTO_ADVANCE_THRESHOLD = 3` — 自动推进到下一个任务所需的工具调用次数

**包装深度跟踪：**
- `onWrapperEnter()` / `onWrapperExit()` 管理一个 `wrapperDepth` 计数器
- 流结束协调（`onStreamEnd()`）仅在 `wrapperDepth === 0` 时触发
- 中间工具调用轮次（depth > 0）为空操作

**会话初始化：**
- 如果 Redux 中存在会话且为 `idle` → 初始化跟踪器 + 启动后端会话
- 如果会话为 `active` → 附加跟踪器而不重新启动
- 如果没有会话 → 每 200ms 轮询一次，最长 8 秒，然后放弃
- 早期的工具调用和数据块在跟踪器初始化前被缓冲

**流结束行为：**
- 在最外层退出时：**无条件完成所有剩余任务**
- 每个剩余任务获得 `dispatch(completeTodo)` 并附带结果预览（例如，"Completed with N tool call(s), M file(s)"）
- 通过 `setCompletionSummary` 分发完成摘要

**验证元数据解析 (TodoManager)：**
当 `completeTodo()` 接收到 `resultPreview` 字符串时，`parseVerificationMetadata()` 提取：
- `verified`：如果预览包含 `[verified]`、`Verified:`、`text verified` 或 `[tool-evidence]` 则为 `true`
- `evidenceScore`：从 `score: N%`、`evidence: N%`、`keyword match: N%` 或 `(N%)` 提取；如果已验证默认为 0.8，否则为 0
- `toolCallCount`：从 `N tool call` 模式提取

**UI 指示器：**
- **盾牌图标**（🛡 青色）：带工具调用证据的已验证完成
- **对勾**（✓）：标准完成
- **警告**（⚠ 黄色）：低证据完成 — 可能需要审查
- **闪电徽章**（⚡N）：工具调用计数指示器
- **百分比徽章**：低置信度项目的证据分数
- **结果预览提示**：悬停时显示完整证据摘要