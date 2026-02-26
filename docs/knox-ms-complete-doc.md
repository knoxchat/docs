---
sidebar_position: 19
title: Knox-MS 1.0 — Developer Documentation
description: A comprehensive guide to Knox.chat's memory system for developers and users.
keywords: [knox, knox api, ai integration, knox-ms, memory system, developer guide]
---

# Knox-MS 1.0 Developer Documentation

> **Base URL:** `https://api.knox.chat`  
> **API Version:** v1

Knox-MS is an AI orchestration engine with a human-brain-inspired memory architecture with hierarchical memory levels, autonomous execution, and intelligent context management that enables effectively unlimited context windows and persistent memory across sessions.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Chat Completions](#chat-completions)
  - [Basic Request](#basic-request)
  - [Streaming](#streaming)
  - [Knox-MS Model](#knox-ms-model)
  - [Knox-MS Parameters](#knox-ms-parameters)
  - [Knox-MS Metadata in Responses](#knox-ms-metadata-in-responses)
- [Models](#models)
- [Embeddings](#embeddings)
- [Image Generation](#image-generation)
- [Audio](#audio)
- [Moderations](#moderations)
- [Reranking](#reranking)
- [Anthropic Messages API (Claude Code)](#anthropic-messages-api)
- [Autonomous Execution](#autonomous-execution)
  - [Start Execution](#start-execution)
  - [Stream Events (SSE)](#stream-events-sse)
  - [Get Status](#get-status)
  - [Cancel Execution](#cancel-execution)
  - [Resume from Checkpoint](#resume-from-checkpoint)
- [Session & Memory](#session--memory)
  - [List Sessions](#list-sessions)
  - [Create a Session](#create-a-session)
  - [Get a Session](#get-a-session)
  - [Delete a Session](#delete-a-session)
  - [Get Session History](#get-session-history)
- [Knowledge Base](#knowledge-base)
  - [Search Knowledge](#search-knowledge)
  - [Add Knowledge](#add-knowledge)
- [User Preferences](#user-preferences)
- [Rate Limits](#rate-limits)
- [Errors](#errors)
- [SDK Examples](#sdk-examples)
  - [Python (OpenAI SDK)](#python-openai-sdk)
  - [Node.js (OpenAI SDK)](#nodejs-openai-sdk)
  - [cURL](#curl)
  - [Claude Code / Anthropic SDK](#claude-code--anthropic-sdk)
Knox.chat
## Quick Start

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

That's it. Knox-MS is fully OpenAI-compatible — any OpenAI SDK, library, or tool works out of the box.
Knox.chat
## Authentication

All API requests require a Bearer token. Create API keys from the Knox dashboard under **Settings → API Keys**.

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx
```

Pass the key in the `Authorization` header for every request.
Knox.chat
## Chat Completions

### Basic Request

```
POST /v1/chat/completions
```

Send a list of messages and receive a model-generated response.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `model` | string | Yes | Model ID. Use `knox/knox-ms` for the Knox-MS engine, or any other available model (e.g., `anthropic/claude-sonnet-4.6`, `openai/gpt-4o`). |
| `messages` | array | Yes | List of message objects with `role` and `content`. |
| `stream` | boolean | No | If `true`, partial message deltas are sent as SSE events. Default `false`. |
| `max_tokens` | integer | No | Maximum tokens to generate. |
| `temperature` | number | No | Sampling temperature (0–2). Default varies by model. |
| `top_p` | number | No | Nucleus sampling parameter (0–1). |
| `frequency_penalty` | number | No | Penalizes repeated tokens (−2 to 2). |
| `presence_penalty` | number | No | Penalizes tokens already present (−2 to 2). |
| `stop` | string/array | No | Stop sequence(s). |
| `tools` | array | No | List of tool/function definitions the model may call. |
| `tool_choice` | string/object | No | Controls tool use: `"auto"`, `"none"`, `"required"`, or a specific function. |
| `response_format` | object | No | Force response format (e.g., `{"type": "json_object"}`). |
| `seed` | integer | No | Seed for deterministic output. |

**Example:**

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

**Response:**

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

### Streaming

Set `"stream": true` to receive the response as Server-Sent Events. Each event contains a `data:` line with a JSON chunk.

```
data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{"content":"Here's"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{"content":" an"},"finish_reason":null}]}

...

data: {"id":"chatcmpl-abc","object":"chat.completion.chunk","created":1740422400,"model":"knox/knox-ms","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Knox-MS Model

The `knox/knox-ms` model is a meta-model that automatically:

1. **Plans** — Decomposes your request into a set of tasks
2. **Routes** — Sends each task to the best model based on difficulty (fast models for simple tasks, powerful models for complex ones)
3. **Remembers** — Persists conversation context to memory, so you can have conversations that span far beyond any single model's context window
4. **Learns** — Records successful patterns and improves over time

It is accessed through the same `/v1/chat/completions` endpoint as any other model. There is nothing special you need to do — just set `"model": "knox/knox-ms"`.

### Knox-MS Parameters

When using `knox/knox-ms`, you can pass additional parameters in a `knox_ms` object at the top level of your request body:

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

| Parameter | Type | Default | Description |
|---|---|---|---|
| `session_id` | string | auto-generated | Persistent session ID. Use the same ID across requests to maintain conversation context. |
| `memory_mode` | string | `"summarized"` | How context is managed: `"full"` (keep everything), `"summarized"` (compress older context), `"selective"` (only relevant context). |
| `verbosity` | string | `"normal"` | Response detail level: `"minimal"`, `"normal"`, `"verbose"`. |
| `include_reasoning` | boolean | `false` | Include planning/reasoning steps in the response. |
| `use_vector_search` | boolean | `false` | Enable semantic vector search over past sessions for relevant context. |
| `vector_top_k` | integer | `30` | Number of vector search candidates to retrieve. |
| `rerank_threshold` | number | `0.5` | Minimum relevance score for vector search results (0.0–1.0). |
| `max_context_tokens` | integer | — | Override the context window size for this request. |
| `force_model` | string | — | Override auto-routing and use a specific model for all tasks. |
| `task_difficulty` | string | — | Override auto-detection: `"easy"`, `"medium"`, `"hard"`. |
| `extract_knowledge` | boolean | `false` | Extract key facts and concepts into the knowledge base. |
| `final_only` | boolean | `false` | Return only the final result, not intermediate task outputs. |
| `project_id` | string | — | Project ID for scoped vector embeddings retrieval. |
| `temperature` | number | — | Passed through to underlying models. |
| `top_p` | number | — | Passed through to underlying models. |
| `tools` | array | — | Tool/function definitions passed through to underlying models. |
| `tool_choice` | string/object | — | Tool choice strategy passed through to underlying models. |

### Knox-MS Metadata in Responses

When using `knox/knox-ms`, responses include an additional `knox_ms_meta` field:

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

| Field | Description |
|---|---|
| `session_id` | The session used for this request |
| `plan_id` | ID of the generated execution plan |
| `tasks_completed` / `tasks_total` / `tasks_failed` | Task execution summary |
| `models_used` | Map of model → number of calls |
| `memory_tokens_saved` | Tokens saved via summarization/compression |
| `context_tokens_used` | Tokens used for context in this request |
| `execution_time_ms` | Total processing time |
| `vector_search_results` | Number of relevant past context chunks retrieved |

## Models

### List Models

```
GET /v1/models
```

Returns a list of all models currently available to your account.

**Response:**

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

### Retrieve Model

```
GET /v1/models/{model_id}
```

Returns details about a specific model.
Knox.chat
## Embeddings

```
POST /v1/embeddings
```

Generate vector embeddings for text input.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `model` | string | Yes | Embedding model ID (e.g., `voyage-4-lite`, `text-embedding-3-small`). |
| `input` | string/array | Yes | Text(s) to embed. |

**Example:**

```json
{
  "model": "voyage-4-lite",
  "input": "Knox-MS is an AI orchestration engine."
}
```

**Response:**

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
## Image Generation

```
POST /v1/images/generations
```

Generate images from a text prompt.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `model` | string | No | Image model ID. |
| `prompt` | string | Yes | Text description of the image. |
| `n` | integer | No | Number of images to generate. |
| `size` | string | No | Image size (e.g., `1024x1024`). |

## Audio

### Transcription

```
POST /v1/audio/transcriptions
```

Transcribe audio to text. Accepts multipart/form-data.

### Translation

```
POST /v1/audio/translations
```

Translate audio to English text.

### Text-to-Speech

```
POST /v1/audio/speech
```

Generate audio from text input.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `model` | string | Yes | TTS model ID. |
| `input` | string | Yes | Text to convert to speech. |
| `voice` | string | Yes | Voice ID. |

## Moderations

```
POST /v1/moderations
```

Classify text for content policy violations.
Knox.chat
## Reranking

```
POST /v1/rerank
```

Rerank a list of documents by relevance to a query (VoyageAI-compatible).

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `model` | string | Yes | Rerank model ID (e.g., `rerank-2.5`). |
| `query` | string | Yes | The query to rank documents against. |
| `documents` | array | Yes | List of document strings to rerank. |
| `top_n` | integer | No | Number of top results to return. |

## Anthropic Messages API

Knox provides full compatibility with the Anthropic Messages API, so tools like **Claude Code** and the **Anthropic Python/JS SDK** work natively.

```
POST /v1/messages
```

**Setup for Claude Code:**

```bash
export ANTHROPIC_BASE_URL="https://api.knox.chat"
export ANTHROPIC_API_KEY="sk-your-knox-api-key"
```

**Setup for the Anthropic Python SDK:**

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

The endpoint accepts the full Anthropic request format (separate `system` field, `max_tokens` required, content blocks, tool use, extended thinking) and returns Anthropic-formatted responses.
Knox.chat
## Autonomous Execution

For complex, multi-step tasks, Knox-MS can run an **autonomous execution loop** that iteratively plans, executes, evaluates, and refines until your goal is achieved — with real-time progress streaming.

> All autonomous endpoints require authentication and are under `/api/knox-ms/autonomous`.

### Start Execution

```
POST /api/knox-ms/autonomous/execute
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | Yes | The goal or task to accomplish. |
| `session_id` | string | No | Session ID for context persistence. Auto-generated if omitted. |
| `stream_events` | boolean | No | Enable real-time SSE event streaming. Default `true`. |
| `config.max_iterations` | integer | No | Maximum execution iterations (safety limit). |
| `config.max_time_secs` | integer | No | Maximum execution time in seconds. |
| `config.confidence_threshold` | number | No | Confidence level required to consider the goal complete (0–1). |
| `config.enable_checkpointing` | boolean | No | Enable periodic state checkpoints for recovery. |
| `config.checkpoint_interval` | integer | No | Checkpoint every N iterations. |
| `config.enable_smart_tasks` | boolean | No | Enable smart task decomposition. |
| `config.enable_adaptive_retry` | boolean | No | Enable automatic retry with adapted strategy on failure. |

**Example:**

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

**Response:**

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

### Stream Events (SSE)

```
GET /api/knox-ms/autonomous/{session_id}/events
```

Returns a Server-Sent Events stream with real-time progress updates. Connect to this URL to receive events as the execution progresses.

**Event types:**

| Event | Description |
|---|---|
| `execution_started` | Execution has begun, includes plan overview. |
| `plan_updated` | A new or revised plan was generated. |
| `task_started` | A task began execution, includes model and difficulty. |
| `task_progress` | Progress update for a long-running task. |
| `task_content_chunk` | Streaming content from a task (incremental output). |
| `task_completed` | A task finished, includes token usage and timing. |
| `task_failed` | A task failed, includes error and retry info. |
| `task_evaluated` | Quality evaluation of a completed task. |
| `memory_operation` | A memory operation was performed (summarize, archive, etc.). |
| `context_updated` | Session context was updated or compressed. |
| `knowledge_extracted` | Knowledge entries were extracted from results. |
| `checkpoint_created` | Execution state was saved. |
| `progress_update` | Overall progress summary. |
| `execution_completed` | Execution finished, includes final results. |
| `execution_paused` | Execution was paused (can be resumed). |
| `error` | An error occurred, includes recovery info. |

**Example event:**

```
event: task_completed
data: {"event_type":"task_completed","task_id":"task-1","status":"completed","tokens_used":1250,"execution_time_ms":2800,"attempt":1,"result_preview":"The architecture follows a layered pattern..."}

event: progress_update
data: {"event_type":"progress_update","session_id":"arch-review","iteration":3,"tasks_completed":4,"tasks_total":6,"tasks_failed":0,"tokens_used":8500,"elapsed_secs":45}
```

### Get Status

```
GET /api/knox-ms/autonomous/{session_id}/status
```

**Response:**

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

### Cancel Execution

```
POST /api/knox-ms/autonomous/cancel
```

**Request body:**

```json
{
  "session_id": "arch-review-session",
  "reason": "No longer needed"
}
```

### Resume from Checkpoint

```
POST /api/knox-ms/autonomous/resume
```

Resume a cancelled or failed execution from the last checkpoint.

**Request body:**

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
## Session & Memory

Knox-MS persists conversation context in **sessions**. Use sessions to maintain memory across multiple API calls.

> All session endpoints require authentication and are under `/api/knox-ms`.

### List Sessions

```
GET /api/knox-ms/sessions
```

**Response:**

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

### Create a Session

```
POST /api/knox-ms/sessions
```

**Request body:**

```json
{
  "session_id": "my-project",
  "tags": ["coding", "rust"]
}
```

Both fields are optional. If `session_id` is omitted, one will be auto-generated.

### Get a Session

```
GET /api/knox-ms/sessions/{session_id}
```

Returns session metadata including message count, token usage, and active plan status.

### Delete a Session

```
DELETE /api/knox-ms/sessions/{session_id}
```

Permanently deletes the session and all associated memory.

### Get Session History

```
GET /api/knox-ms/sessions/{session_id}/history
```

Returns the full conversation history stored in this session.
Knox.chat
## Knowledge Base

Knox-MS automatically extracts facts, concepts, and patterns from conversations into a knowledge base that can be searched and reused across sessions.

### Search Knowledge

```
GET /api/knox-ms/knowledge
```

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `q` | string | `""` | Search query. |
| `category` | string | — | Filter by category. |
| `limit` | integer | `20` | Maximum results to return. |

**Response:**

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

### Add Knowledge

```
POST /api/knox-ms/knowledge
```

Manually add an entry to your knowledge base.

**Request body:**

```json
{
  "category": "architecture",
  "title": "Service Communication Pattern",
  "content": "Services communicate via async message queues...",
  "keywords": ["architecture", "async", "messaging"]
}
```
Knox.chat
## User Preferences

Customize how Knox-MS behaves for your account.

### Get Preferences

```
GET /api/knox-ms/user/preferences
```

### Update Preferences

```
PUT /api/knox-ms/user/preferences
```

Only include the fields you want to change.

**Request body:**

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

| Field | Type | Description |
|---|---|---|
| `use_custom_models` | boolean | Enable custom model routing (overrides system defaults). |
| `plan_model` | string | Model for task planning. |
| `easy_model` | string | Model for simple tasks. |
| `medium_model` | string | Model for medium-complexity tasks. |
| `hard_model` | string | Model for complex tasks. |
| `embedding_model_general` | string | Embedding model for general text. |
| `embedding_model_code` | string | Embedding model for code. |
| `rerank_model` | string | Model for search result reranking. |
| `enable_rerank` | boolean | Enable reranking for vector search. |
| `rerank_top_n` | integer | Number of top results to rerank. |
| `max_context_tokens` | integer | Maximum context window size. |
| `auto_summarize` | boolean | Automatically compress old context. |
| `enable_knowledge_extraction` | boolean | Auto-extract knowledge entries from conversations. |
| `summarize_threshold` | integer | Message count that triggers summarization. |
| `max_tasks_per_plan` | integer | Maximum tasks per execution plan. |
| `enable_parallel_tasks` | boolean | Execute independent tasks in parallel. |
| `default_verbosity` | string | `"minimal"`, `"normal"`, or `"verbose"`. |
| `max_output_tokens` | integer | Maximum output tokens per response (`-1` = unlimited). |

---

## Rate Limits

| Scope | Limit |
|---|---|
| API endpoints (`/v1/*`) | 240 requests / 60 seconds |
| Management endpoints (`/api/*`) | 120 requests / 60 seconds |

When you hit a rate limit, the API returns HTTP `429 Too Many Requests`. Implement exponential backoff in your integration.
Knox.chat
## Errors

All responses follow a consistent format.

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**OpenAI-compatible error (on relay endpoints):**

```json
{
  "error": {
    "message": "Descriptive error message",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request — invalid parameters or missing required fields |
| `401` | Unauthorized — missing or invalid API key |
| `403` | Forbidden — insufficient balance or permissions |
| `404` | Not found — session, checkpoint, or resource doesn't exist |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `503` | Service unavailable — the requested service is not initialized |

## SDK Examples

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

**With streaming:**

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

**With Knox-MS session persistence:**

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

**With streaming:**

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

Knox works as a drop-in replacement for the Anthropic API:

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
*Need help? Visit the [Knox.chat](https://knox.chat) to manage your API keys, check your usage, and top up your balance.*

