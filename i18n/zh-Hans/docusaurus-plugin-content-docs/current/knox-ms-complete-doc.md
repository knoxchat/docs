---
sidebar_position: 19
title: Knox-MS 1.0 — 开发者文档
sidebar_label: Knox-MS 1.0 — 开发者文档
description: Knox.chat 记忆系统的开发者与用户完整指南。
keywords: [knox, knox api, ai integration, knox-ms, memory system, developer guide]
---

# Knox-MS 1.0 开发者文档

> **Base URL:** `https://api.knox.chat`  
> **API 版本:** v1

Knox-MS 是一个 SI 编排引擎，采用受人脑启发的记忆架构，具备自主执行与可度量的召回。其理念是**有界上下文，无界记忆**：每次调用都适配路由模型的窗口，而记忆库本身没有上限，按需检索。

## 目录

- [快速开始](#quick-start)
- [认证](#authentication)
- [聊天补全](#chat-completions)
  - [基本请求](#basic-request)
  - [流式传输](#streaming)
  - [Knox-MS 模型](#knox-ms-model)
  - [Knox-MS 参数](#knox-ms-parameters)
  - [响应中的 Knox-MS 元数据](#knox-ms-metadata-in-responses)
- [模型](#models)
- [图像生成](#image-generation)
- [音频](#audio)
- [内容审核](#moderations)
- [Anthropic Messages API (Claude Code)](#anthropic-messages-api)
- [自主执行](#autonomous-execution)
  - [启动执行](#start-execution)
  - [流式事件 (SSE)](#stream-events-sse)
  - [获取状态](#get-status)
  - [取消执行](#cancel-execution)
  - [从检查点恢复](#resume-from-checkpoint)
- [会话与记忆](#session--memory)
  - [列出会话](#list-sessions)
  - [创建会话](#create-a-session)
  - [获取会话](#get-a-session)
  - [删除会话](#delete-a-session)
  - [获取会话历史](#get-session-history)
- [遗忘与记忆 API](#forgetting--memory-api)
- [知识库](#knowledge-base)
  - [搜索知识](#search-knowledge)
  - [添加知识](#add-knowledge)
- [用户偏好设置](#user-preferences)
- [速率限制](#rate-limits)
- [错误处理](#errors)
- [SDK 示例](#sdk-examples)
  - [Python (OpenAI SDK)](#python-openai-sdk)
  - [Node.js (OpenAI SDK)](#nodejs-openai-sdk)
  - [cURL](#curl)
  - [Claude Code / Anthropic SDK](#claude-code--anthropic-sdk)
## 快速开始 {#quick-start}

```bash
# 1. Get your API key from the Knox dashboard → Settings → API Keys

# 2. Make your first request
curl https://api.knox.chat/v1/chat/completions \
  -H "Authorization: Bearer sk-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "knox/knox-ms",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

就是这么简单。Knox-MS 完全兼容 OpenAI — 任何 OpenAI SDK、库或工具都可以直接使用。
## 认证 {#authentication}

所有 API 请求都需要 Bearer 令牌。请在 Knox 仪表板的 **Settings → API Keys** 中创建 API 密钥。

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx
```

在每个请求的 `Authorization` 头中传递密钥。
## 聊天补全 {#chat-completions}

### 基本请求 {#basic-request}

```
POST /v1/chat/completions
```

发送消息列表并接收模型生成的回复。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `model` | string | 是 | 模型 ID。使用 `knox/knox-ms` 表示 Knox-MS 引擎，或使用其他可用模型（如 `anthropic/claude-sonnet-4.6`、`openai/gpt-4o`）。 |
| `messages` | array | 是 | 包含 `role` 和 `content` 的消息对象列表。 |
| `stream` | boolean | 否 | 设为 `true` 时，以 SSE 事件形式发送部分消息增量。默认 `false`。 |
| `max_tokens` | integer | 否 | 最大生成令牌数。 |
| `temperature` | number | 否 | 采样温度（0–2）。默认值因模型而异。 |
| `top_p` | number | 否 | 核采样参数（0–1）。 |
| `frequency_penalty` | number | 否 | 对重复令牌施加惩罚（−2 到 2）。 |
| `presence_penalty` | number | 否 | 对已出现的令牌施加惩罚（−2 到 2）。 |
| `stop` | string/array | 否 | 停止序列。 |
| `tools` | array | 否 | 模型可调用的工具/函数定义列表。 |
| `tool_choice` | string/object | 否 | 控制工具使用：`"auto"`、`"none"`、`"required"` 或指定函数。 |
| `response_format` | object | 否 | 强制响应格式（如 `{"type": "json_object"}`）。 |
| `seed` | integer | 否 | 用于确定性输出的种子值。 |

**示例：**

```json
{
  "model": "knox/knox-ms",
  "messages": [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**响应：**

```json
{
  "id": "chatcmpl-abc123def456",
  "object": "chat.completion",
  "created": 1740422400,
  "model": "knox/knox-ms",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's an efficient fibonacci function..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 28,
    "completion_tokens": 150,
    "total_tokens": 178
  }
}
```

### 流式传输 {#streaming}

设置 `"stream": true` 以 Server-Sent Events 形式接收响应。每个事件包含一个带有 JSON 数据块的 `data:` 行。

```
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{"content":"Here's"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{"content":" an"},"finish_reason":null}]}

...

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Knox-MS 模型 {#knox-ms-model}

`knox/knox-ms` 模型是一个元模型，能够自动：

1. **规划** — 将您的请求分解为一组任务
2. **路由** — 将每个任务发送到最佳模型，根据难度选择（简单任务使用快速模型，复杂任务使用强大模型）
3. **记忆** — 将重要内容存入长期记忆，并在每次调用时只注入适配记忆预算 `W_mem` 的最有用记忆，使对话能够远超任何单一模型的上下文窗口
4. **学习** — 记录成功的模式并随时间改进

它通过与其他任何模型相同的 `/v1/chat/completions` 端点访问。您无需做任何特殊操作 — 只需设置 `"model": "knox/knox-ms"` 即可。

### Knox-MS 参数 {#knox-ms-parameters}

`knox/knox-ms` 从请求体中标准的 OpenAI 风格 `metadata` 对象读取选项。未知字段会被忽略；**格式错误的记忆字段会返回 `400`**（静默丢弃 `as_of` 会让回答基于错误版本的事实）。

```json
{
  "model": "knox/knox-ms",
  "messages": [...],
  "metadata": {
    "session_id": "my-project-session",
    "project_id": "billing-service",
    "task_difficulty": "hard",
    "as_of": "2026-09-30",
    "channels": ["lexical", "graph"],
    "memory_budget": 6000,
    "cross_session": true,
    "extract_knowledge": true
  }
}
```

| 字段 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `session_id` | string | 自动生成 | 持久会话 ID。在多次请求中使用相同 ID 以维持对话上下文。 |
| `project_id` | string | — | 检索的项目范围。 |
| `task_difficulty` | number \| string | 自动 | `0`–`1`，或 `"easy"` / `"medium"` / `"hard"`。影响路由以及值得投入的记忆量。 |
| `as_of` | string | 当前时间 | RFC 3339 时间戳或 `YYYY-MM-DD`（当天结束，UTC）。依据该时间点有效的事实作答。 |
| `channels` | array \| object | 全部开启 | 要运行的检索通道：`lexical`（BM25）、`ripgrep`、`graph`（个性化 PageRank）、`tree`（摘要树）。可为列表（`["lexical", "graph"]`）或开关（`{"ripgrep": false}`，未列出的通道保持开启）。至少保留一个。 |
| `memory_budget` | integer | 自动 | 记忆块 `W_mem` 的正整数令牌数，优先于已保存的偏好。仍会被限制，确保整个提示适配窗口。 |
| `cross_session` | boolean | 偏好设置 | 同时检索您账户的其他会话。 |
| `memory_mode` | string | `"summarized"` | 较早轮次在提示中的保留方式：`"full"`、`"summarized"`、`"selective"`、`"minimal"`。无论哪种方式都不会删除任何内容；被省略的轮次仍保留在存储中。 |
| `verbosity` | string | `"normal"` | `"minimal"`、`"normal"`、`"verbose"`。 |
| `include_reasoning` | boolean | `false` | 在响应中包含规划/推理步骤。 |
| `auto_plan` | boolean | `true` | 将请求分解为任务。 |
| `max_tasks` | integer | — | 规划任务数量上限。 |
| `enable_parallel` | boolean | `true` | 并行运行相互独立的任务。 |
| `force_model` | string | — | 覆盖自动路由，对所有任务使用指定模型。 |
| `extract_knowledge` | boolean | `false` | 将关键事实提取到长期记忆中。 |
| `final_only` | boolean | `false` | 仅返回最终结果，不返回中间任务输出。 |
| `system_prompt` | string | — | 本次运行的额外系统提示。 |

标准的顶层参数（`temperature`、`top_p`、`top_k`、`stop`、`seed`、`response_format`、`tools`、`tool_choice`、`parallel_tool_calls` 等）会透传至底层模型。

### 响应中的 Knox-MS 元数据 {#knox-ms-metadata-in-responses}

响应中包含一个额外的 `knox_ms_meta` 字段：

```json
{
  "id": "chatcmpl-abc123",
  "model": "knox/knox-ms",
  "choices": [...],
  "usage": {...},
  "knox_ms_meta": {
    "session_id": "my-project-session",
    "plan_id": "plan-xyz",
    "tasks_completed": 1,
    "tasks_total": 1,
    "tasks_failed": 0,
    "total_model_calls": 2,
    "models_used": {"anthropic/claude-sonnet-4.6": 1, "anthropic/claude-haiku-4.5": 1},
    "memory_tokens_saved": 5000,
    "context_tokens_used": 1200,
    "execution_time_ms": 3200,
    "summary_updated": false,
    "call_id": "0b0e8f7a-2c5e-4d57-9a53-6d1a7e0c9f11",
    "routed_model": "anthropic/claude-sonnet-4.6",
    "injected_memories": [
      {
        "id": 1042,
        "rank": 0,
        "tokens": 87,
        "score": 0.61,
        "p_helpful": 0.74,
        "explored": false,
        "channels": {"lexical": 1, "graph": 3}
      }
    ],
    "budget": {
      "window": 200000, "w_out": 8192, "system": 640, "goal": 120, "recent": 2300,
      "w_mem": 4000, "floor": 1000, "memory_tokens": 1180, "total_tokens": 12432,
      "dropped_turns": 0, "summary_used": false
    }
  }
}
```

| 字段 | 描述 |
|---|---|
| `session_id` | 该请求使用的会话 |
| `plan_id` | 生成的执行计划 ID |
| `tasks_completed` / `tasks_total` / `tasks_failed` | 任务执行摘要 |
| `models_used` | 模型 → 调用次数的映射 |
| `memory_tokens_saved` | 通过摘要从提示中省去的令牌数 |
| `context_tokens_used` | 该请求中用于上下文的令牌数 |
| `execution_time_ms` | 总处理时间 |
| `call_id` | 本次调用的标识。可配合 `GET /api/knox-ms/calls/{call_id}/explain` 与 `/budget` 使用。 |
| `routed_model` | 其窗口限定了上下文的模型 |
| `injected_memories` | 以 `[mem:<id>]` 形式放入提示的记忆（最佳优先）：`rank`（从 0 起）、`tokens`（占用 `W_mem` 的成本）、融合后的 `score`、校准后的 `p_helpful`（采用 top-k 回退时缺省）、`explored`（由探索策略选中）、`channels`（在返回它的各通道中的排名，从 1 起）。 |
| `budget` | 本次调用如何分配窗口（见下文）。 |

仅当本次调用执行了记忆检索时，才会出现 `call_id`、`injected_memories`、`budget` 和 `routed_model`。

#### 令牌预算如何推导

路由模型的窗口 `W` 划分为

$$W = \text{system} + \text{goal} + \text{recent} + W_{mem} + W_{out} + \text{slack}$$

- `system`、`goal` 与 `recent` 分别是系统提示、当前请求和最近的轮次，始终保留。
- `W_out` 为回答预留。
- `W_mem` 是留给记忆的部分。没有路由模型时默认为 4,000 令牌；`memory_budget` 可覆盖。下限（`floor`，至多 1,000 令牌且不超过 `W` 的一定比例）可保证提示拥挤时仍保留少量记忆，做法是用会话摘要替换较早的最近轮次（`dropped_turns`、`summary_used`）。
- 记忆通过次模选择挑选：`p_helpful` 低于校准阈值的条目被丢弃，每个条目的成本为其令牌数加分词器安全余量，因此始终满足 `memory_tokens <= w_mem` 且 `total_tokens <= window`。

存储本身没有上限；只有注入的记忆块有界。

## 模型 {#models}

### 列出模型

```
GET /v1/models
```

返回当前您的账户可用的所有模型列表。

**响应：**

```json
{
  "object": "list",
  "data": [
    {
      "id": "knox/knox-ms",
      "object": "model",
      "created": 1740422400,
      "owned_by": "knox"
    },
    {
      "id": "anthropic/claude-sonnet-4.6",
      "object": "model",
      "created": 1740422400,
      "owned_by": "anthropic"
    }
  ]
}
```

### 检索模型

```
GET /v1/models/{model_id}
```

返回指定模型的详细信息。
## 图像生成 {#image-generation}

```
POST /v1/images/generations
```

根据文本提示生成图像。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `model` | string | 否 | 图像模型 ID。 |
| `prompt` | string | 是 | 图像的文本描述。 |
| `n` | integer | 否 | 要生成的图像数量。 |
| `size` | string | 否 | 图像尺寸（如 `1024x1024`）。 |

## 音频 {#audio}

### 语音转文字

```
POST /v1/audio/transcriptions
```

将音频转录为文本。接受 multipart/form-data 格式。

### 音频翻译

```
POST /v1/audio/translations
```

将音频翻译为英文文本。

### 文字转语音

```
POST /v1/audio/speech
```

从文本输入生成音频。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `model` | string | 是 | TTS 模型 ID。 |
| `input` | string | 是 | 要转换为语音的文本。 |
| `voice` | string | 是 | 声音 ID。 |

## 内容审核 {#moderations}

```
POST /v1/moderations
```

对文本进行内容政策违规分类。
## Anthropic Messages API

Knox 完全兼容 Anthropic Messages API，因此 **Claude Code** 和 **Anthropic Python/JS SDK** 等工具可以原生使用。

```
POST /v1/messages
```

**Claude Code 配置：**

```bash
export ANTHROPIC_BASE_URL="https://api.knox.chat"
export ANTHROPIC_API_KEY="sk-your-knox-api-key"
```

**Anthropic Python SDK 配置：**

```python
import anthropic

client = anthropic.Anthropic(
    base_url="https://api.knox.chat/v1",
    api_key="sk-your-knox-api-key",
)

message = client.messages.create(
    model="anthropic/claude-sonnet-4.6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude!"}
    ],
)
print(message.content[0].text)
```

该端点接受完整的 Anthropic 请求格式（独立的 `system` 字段、必填的 `max_tokens`、内容块、工具使用、扩展思考）并返回 Anthropic 格式的响应。
## 自主执行 {#autonomous-execution}

对于复杂的多步骤任务，Knox-MS 可以运行**自主执行循环**，迭代地规划、执行、评估和优化，直到达成您的目标 — 并支持实时进度流式传输。

> 所有自主执行端点均需要认证，路径前缀为 `/api/knox-ms/autonomous`。

### 启动执行 {#start-execution}

```
POST /api/knox-ms/autonomous/execute
```

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `message` | string | 是 | 要完成的目标或任务。 |
| `session_id` | string | 否 | 用于上下文持久化的会话 ID。如省略则自动生成。 |
| `stream_events` | boolean | 否 | 启用实时 SSE 事件流。默认 `true`。 |
| `config.max_iterations` | integer | 否 | 最大执行迭代次数（安全限制）。 |
| `config.max_time_secs` | integer | 否 | 最大执行时间（秒）。 |
| `config.confidence_threshold` | number | 否 | 认为目标完成所需的置信度（0–1）。 |
| `config.enable_checkpointing` | boolean | 否 | 启用定期状态检查点以供恢复。 |
| `config.checkpoint_interval` | integer | 否 | 每 N 次迭代创建检查点。 |
| `config.enable_smart_tasks` | boolean | 否 | 启用智能任务分解。 |
| `config.enable_adaptive_retry` | boolean | 否 | 启用失败后自动调整策略重试。 |

**示例：**

```json
{
  "message": "Analyze this codebase and produce a comprehensive architecture document",
  "session_id": "arch-review-session",
  "config": {
    "max_iterations": 50,
    "max_time_secs": 1800,
    "confidence_threshold": 0.85,
    "enable_checkpointing": true
  }
}
```

**响应：**

```json
{
  "execution_id": "exec-a1b2c3d4e5f6",
  "session_id": "arch-review-session",
  "status": "running",
  "result": null,
  "error": null,
  "events_url": "/api/knox-ms/autonomous/arch-review-session/events"
}
```

### 流式事件 (SSE) {#stream-events-sse}

```
GET /api/knox-ms/autonomous/{session_id}/events
```

返回包含实时进度更新的 Server-Sent Events 流。连接此 URL 以在执行过程中接收事件。

**事件类型：**

| 事件 | 描述 |
|---|---|
| `execution_started` | 执行已开始，包含计划概述。 |
| `plan_updated` | 生成了新的或修订后的计划。 |
| `task_started` | 任务开始执行，包含模型和难度信息。 |
| `task_progress` | 长时间运行任务的进度更新。 |
| `task_content_chunk` | 任务的流式内容（增量输出）。 |
| `task_completed` | 任务完成，包含令牌使用量和计时信息。 |
| `task_failed` | 任务失败，包含错误和重试信息。 |
| `task_evaluated` | 已完成任务的质量评估。 |
| `memory_operation` | 执行了记忆操作（摘要、归档等）。 |
| `context_updated` | 会话上下文已更新或压缩。 |
| `knowledge_extracted` | 从结果中提取了知识条目。 |
| `checkpoint_created` | 执行状态已保存。 |
| `progress_update` | 整体进度摘要。 |
| `execution_completed` | 执行完成，包含最终结果。 |
| `execution_paused` | 执行已暂停（可恢复）。 |
| `error` | 发生错误，包含恢复信息。 |

**事件示例：**

```
event: task_completed
data: {"event_type":"task_completed","task_id":"task-1","status":"completed","tokens_used":1250,"execution_time_ms":2800,"attempt":1,"result_preview":"The architecture follows a layered pattern..."}

event: progress_update
data: {"event_type":"progress_update","session_id":"arch-review","iteration":3,"tasks_completed":4,"tasks_total":6,"tasks_failed":0,"tokens_used":8500,"elapsed_secs":45}
```

### 获取状态 {#get-status}

```
GET /api/knox-ms/autonomous/{session_id}/status
```

**响应：**

```json
{
  "session_id": "arch-review-session",
  "status": "running",
  "current_iteration": 3,
  "tasks_completed": 4,
  "tasks_failed": 0,
  "total_tokens_used": 8500,
  "elapsed_time_secs": 45,
  "current_task": "document_patterns",
  "goal_confidence": 0.72,
  "checkpoints_created": 1
}
```

### 取消执行 {#cancel-execution}

```
POST /api/knox-ms/autonomous/cancel
```

**请求体：**

```json
{
  "session_id": "arch-review-session",
  "reason": "No longer needed"
}
```

### 从检查点恢复 {#resume-from-checkpoint}

```
POST /api/knox-ms/autonomous/resume
```

从上一个检查点恢复已取消或失败的执行。

**请求体：**

```json
{
  "checkpoint_id": "cp-abc123",
  "session_id": "arch-review-session",
  "config_overrides": {
    "max_iterations": 100
  }
}
```
## 会话与记忆 {#session--memory}

Knox-MS 将对话上下文持久化在**会话**中。使用会话可以在多次 API 调用之间维持记忆。

> 所有会话端点均需要认证，路径前缀为 `/api/knox-ms`。

### 列出会话 {#list-sessions}

```
GET /api/knox-ms/sessions
```

**响应：**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "my-project",
        "created_at": 1740422400,
        "last_accessed": 1740508800,
        "total_messages": 42,
        "total_tokens": 125000,
        "has_active_plan": false
      }
    ],
    "total": 1
  }
}
```

### 创建会话 {#create-a-session}

```
POST /api/knox-ms/sessions
```

**请求体：**

```json
{
  "session_id": "my-project",
  "tags": ["coding", "rust"]
}
```

两个字段均为可选。如果省略 `session_id`，将自动生成一个。

### 获取会话 {#get-a-session}

```
GET /api/knox-ms/sessions/{session_id}
```

返回会话元数据，包括消息数量、令牌使用量和活动计划状态。

### 删除会话 {#delete-a-session}

```
DELETE /api/knox-ms/sessions/{session_id}
```

擦除会话及其所有派生内容。这是一次**传播式擦除**：会话的记忆、包含它们的摘要树节点、仅依赖它们的图谱边，以及缓存或冷存储副本会一次性删除，并留下墓碑记录，防止被过期副本重新生成。若擦除失败，则不会报告已删除。参见[遗忘与记忆 API](#forgetting--memory-api)。

### 获取会话历史 {#get-session-history}

```
GET /api/knox-ms/sessions/{session_id}/history
```

返回该会话中存储的完整对话历史。
## 遗忘与记忆 API {#forgetting--memory-api}

您拥有自己的记忆。所有端点均需认证，位于 `/api/knox-ms` 之下。

| 端点 | 用途 |
|---|---|
| `GET /memory` | 列出记忆（筛选：层级、类别、层、来源、`as_of`、含已被取代）。 |
| `GET /memory/{id}` · `GET /memory/{id}/history` | 单条记忆及其 FSRS 状态、来源、有效期与版本历史。 |
| `POST /memory/search` | 全通道搜索，附带每个通道的排名。请求体：`query`、`limit`、`as_of`、`session_id`、`project_id`、`cross_session`、`channels`。只读：不注入、不记录、不强化。 |
| `POST /memory/lexical-search` | 仅 BM25。请求体：`query`、`limit`。 |
| `POST /memory/grep` | 对记忆文本执行 ripgrep。请求体：`pattern`、`regex`（默认 `false`）、`case_insensitive`（默认 `true`）、`limit`。 |
| `DELETE /memory/{id}` | 遗忘单条记忆（传播式擦除）。 |
| `POST /memory/forget` | 按 `ids`、`session_id`、`project_id` 或全部（`all: true` 且 `confirm: true`）遗忘。只允许一个选择器。返回受影响的产物。 |
| `GET /memory/tombstones` · `GET /memory/audit` | 擦除了什么、何时、为何；记忆操作审计。 |
| `GET /memory/tree` · `GET /memory/tree/{node}` | 浏览摘要树，直至原文。 |
| `GET /calls/{call_id}/explain` | 每条记忆为何（未）被注入：通道排名、融合分数、先验、`p_helpful`、阈值。 |
| `GET /calls/{call_id}/budget` | 一次调用的令牌预算。 |
| `POST /graph/ppr` | 从种子实体出发的个性化 PageRank。 |
| `GET /consolidation/status` · `POST /consolidation/run` | 您范围内的后台整合（分层、摘要、合并）。 |
| `GET /metrics` | 记忆质量指标。 |

### 擦除保证

遗忘是传播式擦除。Knox-MS 会一次性移除记忆文本、其搜索索引条目、包含它的摘要树节点、仅依赖它的图谱边、缓存的提示材料以及冷存储对象。系统会保留一条**墓碑**（id、范围、原因、时间，不含内容），防止已擦除的记忆被过期副本或导入重新生成，并便于您核验擦除。擦除成功后，任何检索通道在任何 `as_of` 下都不会再返回已擦除的内容。

```bash
curl -X POST https://api.knox.chat/api/knox-ms/memory/forget \
  -H "Authorization: Bearer sk-your-knox-api-key" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "my-project-session"}'
```

删除会话（`DELETE /sessions/{session_id}`）会对该会话执行同样的操作。

## 知识库 {#knowledge-base}

Knox-MS 自动从对话中提取事实、概念和模式到知识库中，可在不同会话间搜索和复用。搜索是词法检索（BM25 与 ripgrep），不是向量相似度。

### 搜索知识 {#search-knowledge}

```
GET /api/knox-ms/knowledge
```

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `q` | string | `""` | 搜索查询。 |
| `category` | string | — | 按类别过滤。 |
| `limit` | integer | `20` | 返回的最大结果数。 |

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "kn-abc123",
      "category": "programming",
      "title": "Rust Ownership Rules",
      "content": "In Rust, each value has exactly one owner...",
      "source_session": "my-project",
      "created_at": 1740422400,
      "keywords": ["rust", "ownership", "borrowing"]
    }
  ]
}
```

### 添加知识 {#add-knowledge}

```
POST /api/knox-ms/knowledge
```

手动向知识库添加条目。

**请求体：**

```json
{
  "category": "architecture",
  "title": "Service Communication Pattern",
  "content": "Services communicate via async message queues...",
  "keywords": ["architecture", "async", "messaging"]
}
```
## 用户偏好设置 {#user-preferences}

自定义 Knox-MS 在您账户下的行为方式。

### 获取偏好设置

```
GET /api/knox-ms/user/preferences
```

### 更新偏好设置

```
PUT /api/knox-ms/user/preferences
```

仅需包含您要更改的字段。

**请求体：**

```json
{
  "use_custom_models": true,
  "easy_model": "openai/gpt-4o-mini",
  "medium_model": "anthropic/claude-sonnet-4.6",
  "hard_model": "anthropic/claude-opus-4.6",
  "max_context_tokens": 200000,
  "auto_summarize": true,
  "default_verbosity": "verbose",
  "max_output_tokens": -1
}
```

| 字段 | 类型 | 描述 |
|---|---|---|
| `use_custom_models` | boolean | 启用自定义模型路由（覆盖系统默认值）。 |
| `plan_model` | string | 用于任务规划的模型。 |
| `easy_model` | string | 用于简单任务的模型。 |
| `medium_model` | string | 用于中等复杂度任务的模型。 |
| `hard_model` | string | 用于复杂任务的模型。 |
| `max_context_tokens` | integer | 最大上下文窗口大小。 |
| `auto_summarize` | boolean | 自动压缩旧上下文。 |
| `enable_knowledge_extraction` | boolean | 自动从对话中提取知识条目。 |
| `summarize_threshold` | integer | 触发摘要的消息数量。 |
| `max_tasks_per_plan` | integer | 每个执行计划的最大任务数。 |
| `enable_parallel_tasks` | boolean | 并行执行独立任务。 |
| `default_verbosity` | string | `"minimal"`、`"normal"` 或 `"verbose"`。 |
| `max_output_tokens` | integer | 每次响应的最大输出令牌数（`-1` = 无限制）。 |

---

## 速率限制 {#rate-limits}

| 范围 | 限制 |
|---|---|
| API 端点 (`/v1/*`) | 240 次请求 / 60 秒 |
| 管理端点 (`/api/*`) | 120 次请求 / 60 秒 |

当达到速率限制时，API 返回 HTTP `429 Too Many Requests`。请在您的集成中实现指数退避。
## 错误处理 {#errors}

所有响应遵循一致的格式。

**成功：**

```json
{
  "success": true,
  "data": { ... }
}
```

**错误：**

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**OpenAI 兼容错误（在中继端点上）：**

```json
{
  "error": {
    "message": "Descriptive error message",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### HTTP 状态码

| 状态码 | 含义 |
|---|---|
| `200` | 成功 |
| `201` | 已创建 |
| `400` | 请求错误 — 参数无效或缺少必填字段 |
| `401` | 未授权 — 缺少或无效的 API 密钥 |
| `403` | 禁止 — 余额不足或权限不足 |
| `404` | 未找到 — 会话、检查点或资源不存在 |
| `429` | 超出速率限制 |
| `500` | 内部服务器错误 |
| `503` | 服务不可用 — 请求的服务未初始化 |

## SDK 示例 {#sdk-examples}

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.knox.chat/v1",
    api_key="sk-your-knox-api-key",
)

# Simple chat completion
response = client.chat.completions.create(
    model="knox/knox-ms",
    messages=[
        {"role": "user", "content": "Explain how async/await works in Rust"}
    ],
)

print(response.choices[0].message.content)
```

**流式传输：**

```python
stream = client.chat.completions.create(
    model="knox/knox-ms",
    messages=[
        {"role": "user", "content": "Write a web scraper in Python"}
    ],
    stream=True,
)

for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
```

**使用 Knox-MS 会话持久化：**

```python
import requests

response = requests.post(
    "https://api.knox.chat/v1/chat/completions",
    headers={"Authorization": "Bearer sk-your-knox-api-key"},
    json={
        "model": "knox/knox-ms",
        "messages": [
            {"role": "user", "content": "Let's design a REST API for a blog"}
        ],
        "metadata": {
            "session_id": "blog-api-design",
            "memory_mode": "summarized",
            "extract_knowledge": True,
        },
    },
)

print(response.json()["choices"][0]["message"]["content"])

# Later, continue the same conversation — Knox-MS retrieves the relevant memories:
response = requests.post(
    "https://api.knox.chat/v1/chat/completions",
    headers={"Authorization": "Bearer sk-your-knox-api-key"},
    json={
        "model": "knox/knox-ms",
        "messages": [
            {"role": "user", "content": "Now add pagination to the list endpoints we discussed"}
        ],
        "metadata": {
            "session_id": "blog-api-design",
        },
    },
)
```

### Node.js (OpenAI SDK)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.knox.chat/v1",
  apiKey: "sk-your-knox-api-key",
});

const response = await client.chat.completions.create({
  model: "knox/knox-ms",
  messages: [
    { role: "user", content: "Build a React component for a data table" },
  ],
});

console.log(response.choices[0].message.content);
```

**流式传输：**

```javascript
const stream = await client.chat.completions.create({
  model: "knox/knox-ms",
  messages: [
    { role: "user", content: "Build a React component for a data table" },
  ],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

### cURL

```bash
# Chat completion
curl https://api.knox.chat/v1/chat/completions \
  -H "Authorization: Bearer sk-your-knox-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "knox/knox-ms",
    "messages": [{"role": "user", "content": "Hello, Knox!"}],
    "stream": false
  }'

# List available models
curl https://api.knox.chat/v1/models \
  -H "Authorization: Bearer sk-your-knox-api-key"

# Start autonomous execution
curl -X POST https://api.knox.chat/api/knox-ms/autonomous/execute \
  -H "Authorization: Bearer sk-your-knox-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze and refactor this code for better performance",
    "config": {"max_iterations": 30}
  }'
```

### Claude Code / Anthropic SDK

Knox 可作为 Anthropic API 的直接替代：

```bash
# For Claude Code
export ANTHROPIC_BASE_URL="https://api.knox.chat"
export ANTHROPIC_API_KEY="sk-your-knox-api-key"

# That's it — Claude Code will now use Knox as its backend
```

```python
# For the Anthropic Python SDK
import anthropic

client = anthropic.Anthropic(
    base_url="https://api.knox.chat/v1",
    api_key="sk-your-knox-api-key",
)

message = client.messages.create(
    model="anthropic/claude-sonnet-4.6",
    max_tokens=4096,
    messages=[
        {"role": "user", "content": "Explain monads in simple terms"}
    ],
)

print(message.content[0].text)
```
*需要帮助？请访问 [Knox.chat](https://knox.chat) 管理您的 API 密钥、查看使用量和充值余额。*
