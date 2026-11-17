---
sidebar_position: 19
title: Knox-MS 2.0 Developer Documentation
description: A comprehensive guide to Knox.chat's memory system for developers and users.
keywords: [knox, knox api, ai integration, knox-ms, memory system, developer guide]
---

# Knox-MS 2.0 Developer Documentation

> **Base URL:** `https://api.knox.chat` (KnoxChat) or `https://api.knoxstudio.ai` (KnoxStudio). Both hosts are the same API.  
> **API Version:** v1  
> **Memory model:** [KMS Unlimited Context Theorem](./knox-ms-unlimited-formula.md) V2

Knox-MS is an SI orchestration engine with a human-brain-inspired memory architecture, autonomous execution and measured recall. Its motto is **bounded context, unbounded memory, measured recall**: every call fits the routed model's window, while the memory store itself is not capped and is searched on demand. The formal model, assumptions and guarantees behind this are in the [KMS Unlimited Context Theorem](./knox-ms-unlimited-formula.md); the [Memory Model](#memory-model) section below maps them to the API.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Chat Completions](#chat-completions)
  - [Basic Request](#basic-request)
  - [Streaming](#streaming)
  - [Knox-MS Model](#knox-ms-model)
  - [Knox-MS Parameters](#knox-ms-parameters)
  - [Knox-MS Metadata in Responses](#knox-ms-metadata-in-responses)
- [Memory Model (KMS V2)](#memory-model)
- [Models](#models)
- [Image Generation](#image-generation)
- [Audio](#audio)
- [Moderations](#moderations)
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
- [Forgetting & Memory API](#forgetting--memory-api)
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
## Authentication

All API requests require a Bearer token. Create API keys from the Knox dashboard under **Settings → API Keys**.

```
Authorization: Bearer sk-xxxxxxxxxxxxxxxxxxxx
```

Pass the key in the `Authorization` header for every request.
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
3. **Remembers** — Stores what matters in long-term memory (originals are kept, never replaced by summaries) and, on each call, injects only the most useful memories that fit the memory budget `W_mem`, so conversations can span far beyond any single model's context window
4. **Learns** — Records which injected memories actually helped, strengthens those, lets the rest fade, and improves over time

It is accessed through the same `/v1/chat/completions` endpoint as any other model. There is nothing special you need to do — just set `"model": "knox/knox-ms"`.

### Knox-MS Parameters

`knox/knox-ms` reads its options from the standard OpenAI-style `metadata` object of the request body. Fields it does not know are ignored; **malformed memory fields are rejected with `400`** (a silently dropped `as_of` would answer from the wrong version of the facts).

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

| Field | Type | Default | Description |
|---|---|---|---|
| `session_id` | string | auto-generated | Persistent session ID. Use the same ID across requests to maintain conversation context. |
| `project_id` | string | — | Project scope for retrieval. |
| `task_difficulty` | number \| string | auto | `0`–`1`, or `"easy"` / `"medium"` / `"hard"`. Steers routing and the amount of memory worth spending. |
| `as_of` | string | now | RFC 3339 timestamp or `YYYY-MM-DD` (end of that day, UTC). Answer from the facts that were valid at that time. |
| `channels` | array \| object | all on | Retrieval channels to run: `lexical` (BM25), `ripgrep`, `graph` (personalized PageRank), `tree` (summary tree). Either a list (`["lexical", "graph"]`) or toggles (`{"ripgrep": false}`; unlisted channels stay on). At least one must stay on. |
| `memory_budget` | integer | automatic | Positive token count for the memory block `W_mem`. Wins over the stored preference. It is still clamped so the whole prompt fits the window. |
| `cross_session` | boolean | preference | Also retrieve from other sessions of your account. |
| `memory_mode` | string | `"summarized"` | How older turns are kept in the prompt: `"full"`, `"summarized"`, `"selective"`, `"minimal"`. Nothing is deleted either way; turns left out stay in the store. |
| `verbosity` | string | `"normal"` | `"minimal"`, `"normal"`, `"verbose"`. |
| `include_reasoning` | boolean | `false` | Include planning/reasoning steps in the response. |
| `auto_plan` | boolean | `true` | Decompose the request into tasks. |
| `max_tasks` | integer | — | Upper bound on planned tasks. |
| `enable_parallel` | boolean | `true` | Run independent tasks in parallel. |
| `force_model` | string | — | Override auto-routing and use a specific model for all tasks. |
| `extract_knowledge` | boolean | `false` | Extract key facts into long-term memory. |
| `final_only` | boolean | `false` | Return only the final result, not intermediate task outputs. |
| `system_prompt` | string | — | Extra system prompt for the run. |

Standard top-level parameters (`temperature`, `top_p`, `top_k`, `stop`, `seed`, `response_format`, `tools`, `tool_choice`, `parallel_tool_calls`, and so on) are passed through to the underlying models.

### Knox-MS Metadata in Responses

Responses include an additional `knox_ms_meta` field:

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

| Field | Description |
|---|---|
| `session_id` | The session used for this request |
| `plan_id` | ID of the generated execution plan |
| `tasks_completed` / `tasks_total` / `tasks_failed` | Task execution summary |
| `models_used` | Map of model → number of calls |
| `memory_tokens_saved` | Tokens left out of the prompt by summarization |
| `context_tokens_used` | Tokens used for context in this request |
| `execution_time_ms` | Total processing time |
| `call_id` | Identifies this call. Use it with `GET /api/knox-ms/calls/{call_id}/explain` and `/budget`. |
| `routed_model` | The model whose window bounded the context |
| `injected_memories` | The memories placed in the prompt as `[mem:<id>]` items, best first: `rank` (0-based), `tokens` (cost against `W_mem`), fused `score`, calibrated `p_helpful` (absent when the top-k fallback applied), `explored` (picked by the exploration policy) and `channels` (1-based rank in each channel that returned it). |
| `budget` | How the window was spent on this call (see below). |

`call_id`, `injected_memories`, `budget` and `routed_model` are only present when memory retrieval ran for the call.

#### How the token budget is derived

The window `W` of the routed model is split as

$$W = \text{system} + \text{goal} + \text{recent} + W_{mem} + W_{out} + \text{slack}$$

- `system`, `goal` and `recent` are the system prompt, the current request and the latest turns, which are always kept.
- `W_out` is reserved for the answer.
- `W_mem` is what is left for memories. Without a routed model it defaults to 4,000 tokens; `memory_budget` overrides it. A floor (`floor` = `min(1000, W/8)`) keeps a small memory block even when the prompt is crowded, by replacing older recent turns with the session summary (`dropped_turns`, `summary_used`). The originals of those turns stay retrievable. If `system`, `goal`, `W_out` and the floor alone exceed `W`, the call is routed to a model with a larger window or rejected with an explicit error. It is never truncated silently.
- Memories are chosen by a submodular selection that rewards both relevance and coverage, so near-duplicates add almost nothing. Items below the calibrated threshold on `p_helpful` are dropped. Each item costs its tokens plus a tokenizer safety margin (5%, counted with the routed model's own tokenizer), so `memory_tokens <= w_mem` and `total_tokens + w_out <= window` always hold.
- The strongest items are placed at the start and end of the memory block, where models attend most reliably.

The store itself is unbounded; only the injected block is bounded.

## Memory Model

This section summarizes the V2 [KMS Unlimited Context Theorem](./knox-ms-unlimited-formula.md) in terms of what you can observe through the API. "Unlimited context" does not mean the model reads everything. Three quantities are kept apart:

| Quantity | Meaning | Bounded? |
|---|---|---|
| Addressable memory | Everything stored for your account | No |
| Usable context | Tokens placed in one model call (`budget.memory_tokens` plus the rest of the prompt) | Yes, always within the routed model's window minus `w_out` |
| Recall | Fraction of the relevant memories that actually reach the call | Measured, and kept above a published bound as history grows |

Storage alone is not enough: with a flat top-k search, recall falls toward zero as history grows, even if nothing is deleted. Knox-MS therefore adds structure (scoping, a summary tree, budgeted selection), and the recall bound holds with tree routing cost that grows only logarithmically in the scoped history.

### Memory hierarchy

| Level | Name | Lifetime |
|---|---|---|
| M1 | Input buffer | one turn |
| M2 | Working memory (the injected block, `W_mem`) | one model call |
| M3 | Session memory | one session |
| M4 | Long-term memory (facts, episodes, summary tree) | until superseded or forgotten |
| M5 | Procedural memory (workflows, learned patterns) | until superseded or forgotten |

M1 and M2 are buffers, not stores. **Summaries are pointers**: every summary node in the tree keeps links to its children down to the original text, and only originals enter the prompt. Compression therefore never loses information; summary quality only affects how well a search is routed. Browse the tree with `GET /memory/tree`.

### Writing memory

- **Encoding is lexical** (BM25 terms, trigrams, entities, provenance). There is no embedding model or vector index.
- **Write-time reconciliation** against existing facts in the same scope: add, update, supersede, merge, or no-op. A superseded fact is closed, not deleted. Facts are bitemporal (valid time and transaction time), which is what `as_of` queries use.
- **Idempotent, serialized per scope**: two sessions writing the same fact cannot create duplicate or conflicting valid facts.
- **Read-your-writes**: a memory written in turn `t` is retrievable from turn `t+1`. Only summary text and parameter refits are deferred to background consolidation.
- **Provenance and trust**: every memory is tagged `user`, `assistant`, `tool` or `external`, ordered by trust in that sequence. Memories from `tool` and `external` sources (web pages, files, API output) are injected as quoted data, never as instructions, and cannot supersede a `user` fact on their own.

### Retrieval

Each query searches only its scope. Tenant and user are a hard access boundary applied inside every index. Project and session (plus your cross-project preferences) are the soft relevance scope, and `cross_session` widens it. A query about the past switches to as-of mode (`as_of`) and searches facts valid at that time, including superseded ones.

| Channel | Signal |
|---|---|
| `lexical` | BM25 with trigram fuzzy match and rule-based synonyms |
| `ripgrep` | exact, regex and identifier hits (200 ms limit) |
| `graph` | hub-damped personalized PageRank over entities |
| `tree` | beam search over the summary tree's term sketches |

Channel ranks are combined by rank fusion (never by adding raw scores). Utility and retrievability then scale relevance within a fixed factor range, so an irrelevant memory can never be selected because it is important or recent. The cut-off is calibrated to mean `P(helpful) >= theta`. Only the `tree` channel carries the logarithmic cost and recall bound; the other channels improve recall in practice but are not needed for the bound. See `GET /calls/{call_id}/explain` for the per-memory breakdown.

### Forgetting and tiers

Each memory has a stability `S` (days until its retrievability falls to 90%), following a power-law forgetting curve. A memory strengthens only when it was injected **and actually used** (cited as `[mem:<id>]`, or credited by an ablation probe). Being retrieved is not enough, so a memory cannot reinforce itself by being retrieved. Tiers come from the same model:

| Tier | Rule | Storage |
|---|---|---|
| Active | memories of sessions touched in the last 30 minutes | memory (RAM) |
| Hot | retrievability >= 0.9 | full fidelity, all indexes |
| Warm | 0.7 to 0.9 | full fidelity |
| Cold | 0.3 to 0.7 | summarized in the tree, originals kept |
| Frozen | below 0.3, or low value | compressed archive, reachable on demand |
| Deleted | only explicit `forget`, a TTL, or a privacy policy | tombstone only |

**Tiers change cost, never reachability.** Age alone never deletes anything.

### Outcome attribution

For every call, Knox-MS logs which memories were injected and whether they helped. A cited memory in a successful turn gains evidence; a memory the next user turn corrects loses it; an injected but uncited memory loses a small fraction (silence is weak evidence). Two mechanisms correct for noisy citations: offline **ablation probes** on about 2% of successful turns, and **exploration** on about 5% of calls (`explored` in `injected_memories`), with selection propensities logged so calibration stays unbiased. This feeds the utility estimate, the channel weights and the threshold.

### Guarantees

| Invariant | Meaning |
|---|---|
| Budget | `context + w_out <= window` on every call |
| Reachability | every non-deleted memory is reachable from the tree and at least one other index, in every tier |
| Losslessness | every leaf under a summary is a retained original or a tombstone |
| Freshness | read-your-writes from the next turn |
| Erasure | no index, edge or summary contains content from an erased memory |

The recall bound is `Rec >= 1 - e_scope - e_select - e_route * ceil(log_b n)`, measured over a query distribution and a gold set that fits the budget. Its error terms are measured on a recall-versus-history scaling benchmark and published with each release. Each release is gated on recall versus history size, answer accuracy (LongMemEval, LoCoMo), the answerable horizon, p95 retrieval latency (under 300 ms at 10^6 memories) and erasure (zero hits). Defaults are listed in the theorem's parameter table, for example tree branching 8, beam width 4, rank-fusion constant 60, threshold 0.35, and 50 fused candidates plus reserved tree slots.

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

Erases the session and everything derived from it. This is a *propagating erase*: the session's memories, their summary-tree nodes, graph edges that rest only on them, and cached or cold copies are removed in one step, and a tombstone records that they were erased so they cannot be re-created from a stale copy. If the erase fails, nothing is reported as deleted. See [Forgetting & Memory API](#forgetting--memory-api).

### Get Session History

```
GET /api/knox-ms/sessions/{session_id}/history
```

Returns the full conversation history stored in this session.
## Forgetting & Memory API

You own your memories. All endpoints require authentication and live under `/api/knox-ms`.

| Endpoint | Purpose |
|---|---|
| `GET /memory` | List memories (filters: level, category, tier, source, `as_of`, include superseded). |
| `GET /memory/{id}` · `GET /memory/{id}/history` | One memory with its FSRS state, provenance, validity and version history. |
| `POST /memory/search` | All-channel search with per-channel ranks. Body: `query`, `limit`, `as_of`, `session_id`, `project_id`, `cross_session`, `channels`. Read-only: nothing is injected, logged or strengthened. |
| `POST /memory/lexical-search` | BM25 only. Body: `query`, `limit`. |
| `POST /memory/grep` | ripgrep over memory text. Body: `pattern`, `regex` (default `false`), `case_insensitive` (default `true`), `limit`. |
| `DELETE /memory/{id}` | Forget one memory (propagating erase). |
| `POST /memory/forget` | Forget by `ids`, `session_id`, `project_id`, or everything (`all: true` with `confirm: true`). Exactly one selector is allowed. Returns the affected artifacts. |
| `GET /memory/tombstones` · `GET /memory/audit` | What was erased, when and why; audit trail of memory operations. |
| `GET /memory/tree` · `GET /memory/tree/{node}` | Browse the summary tree down to the original text. |
| `GET /calls/{call_id}/explain` | Why each memory was (not) injected: channel ranks, fused score, priors, `p_helpful`, threshold. |
| `GET /calls/{call_id}/budget` | The token budget of one call. |
| `POST /graph/ppr` | Personalized PageRank from seed entities. |
| `GET /consolidation/status` · `POST /consolidation/run` | Background consolidation (tiering, summaries, merges) for your scope. |
| `GET /metrics` | Memory quality metrics. |

### Erasure guarantee

Forgetting is a propagating erase. In one step Knox-MS removes the memory text, its search-index entries, summary-tree nodes that contained it, graph edges that rest only on it, cached prompt material and cold-storage objects. A **tombstone** (id, scope, reason, time; no content) remains so an erased memory is not resurrected by a stale replica or an import, and so you can verify the erase. After a successful erase, no retrieval channel returns the erased content, for any `as_of`.

The erase runs in four steps, and is acknowledged only after the last one, so no summary can leak forgotten content:

1. Remove the row and write the tombstone.
2. Remove its postings from the BM25 and n-gram indexes and its text from the ripgrep corpus.
3. Remove graph edges whose only evidence was the memory, and entities left with no evidence.
4. Regenerate every ancestor summary node from its remaining children, bottom-up.

Retrieved memories are injected verbatim as a quoted block of `[mem:<id>]` items in a user-role message (never the system prompt). Citations of `[mem:<id>]` in the reply feed outcome attribution.

```bash
curl -X POST https://api.knox.chat/api/knox-ms/memory/forget \
  -H "Authorization: Bearer sk-your-knox-api-key" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "my-project-session"}'
```

Deleting a session (`DELETE /sessions/{session_id}`) does the same for that session.

## Knowledge Base

Knox-MS automatically extracts facts, concepts, and patterns from conversations into a knowledge base that can be searched and reused across sessions. Search is lexical (BM25 and ripgrep), not vector similarity.

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
*Need help? Visit the [Knox.chat](https://knox.chat) to manage your API keys, check your usage, and top up your balance.*

