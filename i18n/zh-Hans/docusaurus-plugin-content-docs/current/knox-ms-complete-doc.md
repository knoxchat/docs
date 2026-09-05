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

Knox-MS 是一个 AI 编排引擎，采用受人脑启发的记忆架构，具备分层记忆级别、自主执行和智能上下文管理功能，实现有效的无限上下文窗口和跨会话持久记忆。

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
- [嵌入](#embeddings)
- [图像生成](#image-generation)
- [音频](#audio)
- [内容审核](#moderations)
- [重排序](#reranking)
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
Knox.chat
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
Knox.chat
## 认证 {#authentication}

所有 API 请求都需要 Bearer 令牌。请在 Knox 仪表板的 **Settings → API Keys** 中创建 API 密钥。

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx
```

在每个请求的 `Authorization` 头中传递密钥。
Knox.chat
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
3. **记忆** — 将对话上下文持久化到记忆系统中，使您的对话能够远超任何单一模型的上下文窗口
4. **学习** — 记录成功的模式并随时间改进

它通过与其他任何模型相同的 `/v1/chat/completions` 端点访问。您无需做任何特殊操作 — 只需设置 `"model": "knox/knox-ms"` 即可。

### Knox-MS 参数 {#knox-ms-parameters}

使用 `knox/knox-ms` 时，您可以在请求体的顶层 `knox_ms` 对象中传递附加参数：

```json
{
  "model": "knox/knox-ms",
  "messages": [...],
  "knox_ms": {
    "session_id": "my-project-session",
    "memory_mode": "summarized",
    "verbosity": "verbose",
    "include_reasoning": true,
    "use_vector_search": true,
    "extract_knowledge": true
  }
}
```

| 参数 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `session_id` | string | 自动生成 | 持久会话 ID。在多次请求中使用相同 ID 以维持对话上下文。 |
| `memory_mode` | string | `"summarized"` | 上下文管理方式：`"full"`（保留全部）、`"summarized"`（压缩较早上下文）、`"selective"`（仅保留相关上下文）。 |
| `verbosity` | string | `"normal"` | 响应详细程度：`"minimal"`、`"normal"`、`"verbose"`。 |
| `include_reasoning` | boolean | `false` | 在响应中包含规划/推理步骤。 |
| `use_vector_search` | boolean | `false` | 启用对过往会话的语义向量搜索以获取相关上下文。 |
| `vector_top_k` | integer | `30` | 检索的向量搜索候选数量。 |
| `rerank_threshold` | number | `0.5` | 向量搜索结果的最低相关性分数（0.0–1.0）。 |
| `max_context_tokens` | integer | — | 覆盖此请求的上下文窗口大小。 |
| `force_model` | string | — | 覆盖自动路由，对所有任务使用指定模型。 |
| `task_difficulty` | string | — | 覆盖自动检测：`"easy"`、`"medium"`、`"hard"`。 |
| `extract_knowledge` | boolean | `false` | 将关键事实和概念提取到知识库中。 |
| `final_only` | boolean | `false` | 仅返回最终结果，不返回中间任务输出。 |
| `project_id` | string | — | 用于限定范围的向量嵌入检索的项目 ID。 |
| `temperature` | number | — | 透传至底层模型。 |
| `top_p` | number | — | 透传至底层模型。 |
| `tools` | array | — | 透传至底层模型的工具/函数定义。 |
| `tool_choice` | string/object | — | 透传至底层模型的工具选择策略。 |

### 响应中的 Knox-MS 元数据 {#knox-ms-metadata-in-responses}

使用 `knox/knox-ms` 时，响应中包含一个额外的 `knox_ms_meta` 字段：

```json
{
  "id": "chatcmpl-abc123",
  "model": "knox/knox-ms",
  "choices": [...],
  "usage": {...},
  "knox_ms_meta": {
    "session_id": "my-project-session",
    "plan_id": "plan-xyz",
    "plan_description": "Implement fibonacci function with memoization",
    "current_task": "write_function",
    "task_status": "completed",
    "tasks_completed": 1,
    "tasks_total": 1,
    "tasks_failed": 0,
    "total_model_calls": 2,
    "models_used": {"anthropic/claude-sonnet-4.6": 1, "anthropic/claude-haiku-4.5": 1},
    "memory_mode": "summarized",
    "memory_tokens_saved": 5000,
    "context_tokens_used": 1200,
    "execution_time_ms": 3200,
    "vector_search_results": 0,
    "summary_updated": false
  }
}
```

| 字段 | 描述 |
|---|---|
| `session_id` | 该请求使用的会话 |
| `plan_id` | 生成的执行计划 ID |
| `tasks_completed` / `tasks_total` / `tasks_failed` | 任务执行摘要 |
| `models_used` | 模型 → 调用次数的映射 |
| `memory_tokens_saved` | 通过摘要/压缩节省的令牌数 |
| `context_tokens_used` | 该请求中用于上下文的令牌数 |
| `execution_time_ms` | 总处理时间 |
| `vector_search_results` | 检索到的相关历史上下文块数量 |

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
Knox.chat
## 嵌入 {#embeddings}

```
POST /v1/embeddings
```

为文本输入生成向量嵌入。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `model` | string | 是 | 嵌入模型 ID（如 `voyage-4-lite`、`text-embedding-3-small`）。 |
| `input` | string/array | 是 | 要嵌入的文本。 |

**示例：**

```json
{
  "model": "voyage-4-lite",
  "input": "Knox-MS is an AI orchestration engine."
}
```

**响应：**

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0123, -0.0456, ...]
    }
  ],
  "model": "voyage-4-lite",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```
Knox.chat
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
Knox.chat
## 重排序 {#reranking}

```
POST /v1/rerank
```

按与查询的相关性对文档列表进行重排序（兼容 VoyageAI）。

**请求体：**

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `model` | string | 是 | 重排序模型 ID（如 `rerank-2.5`）。 |
| `query` | string | 是 | 用于对文档进行排序的查询。 |
| `documents` | array | 是 | 要重排序的文档字符串列表。 |
| `top_n` | integer | 否 | 返回的前 N 个结果数量。 |

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
Knox.chat
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
Knox.chat
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

永久删除会话及所有关联的记忆。

### 获取会话历史 {#get-session-history}

```
GET /api/knox-ms/sessions/{session_id}/history
```

返回该会话中存储的完整对话历史。
Knox.chat
## 知识库 {#knowledge-base}

Knox-MS 自动从对话中提取事实、概念和模式到知识库中，可在不同会话间搜索和复用。

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
Knox.chat
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
| `embedding_model_general` | string | 用于通用文本的嵌入模型。 |
| `embedding_model_code` | string | 用于代码的嵌入模型。 |
| `rerank_model` | string | 用于搜索结果重排序的模型。 |
| `enable_rerank` | boolean | 启用向量搜索的重排序。 |
| `rerank_top_n` | integer | 重排序的前 N 个结果数量。 |
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
Knox.chat
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
        "knox_ms": {
            "session_id": "blog-api-design",
            "memory_mode": "summarized",
            "extract_knowledge": True,
        },
    },
)

print(response.json()["choices"][0]["message"]["content"])

# Later, continue the same conversation — Knox-MS remembers everything:
response = requests.post(
    "https://api.knox.chat/v1/chat/completions",
    headers={"Authorization": "Bearer sk-your-knox-api-key"},
    json={
        "model": "knox/knox-ms",
        "messages": [
            {"role": "user", "content": "Now add pagination to the list endpoints we discussed"}
        ],
        "knox_ms": {
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
Knox.chat
*需要帮助？请访问 [Knox.chat](https://knox.chat) 管理您的 API 密钥、查看使用量和充值余额。*
