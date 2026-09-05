---
slug: memory-brain
title: "VSCode KnoxChat — 记忆大脑"
image: /img/memory-brain.png
authors: [knox]
tags: [knoxchat, ai, context, vscode]
---

# 记忆大脑 — 持久化 AI 记忆系统

> **赋予您的 AI 一颗能记忆的大脑。**
>
> Memory Brain 是一个本地优先、SQLite 驱动的记忆系统，赋予 Knox
> 跨对话、跨会话和跨项目的持久化、结构化记忆能力。
> 它用受人类记忆科学启发的多层认知架构，取代了
> 无状态 LLM 的"金鱼记忆"。

<iframe width="100%" height="580" src="https://fast.wistia.net/embed/iframe/5yhgi3h4hf" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

[**在此体验带 Memory Brain 的 KnoxChat VS Code 扩展 >>>**](https://open-vsx.org/extension/knoxchat/knoxchat)

## 目录

- [为什么选择 Memory Brain？](#为什么选择-memory-brain)
- [工作原理](#工作原理)
- [架构概览](#架构概览)
- [记忆类型](#记忆类型)
- [5 层记忆层级](#5-层记忆层级)
- [核心功能](#核心功能)
- [全部 79 个操作参考](#全部-79-个操作参考)
- [数据库架构](#数据库架构)
- [优势](#优势)
- [配置](#配置)
- [测试覆盖](#测试覆盖)
- [工具集成](#工具集成)

## 为什么选择 Memory Brain？

与 LLM 的每次对话都从零开始。AI 忘记了您的偏好、过去的决策、项目上下文以及之前有效的模式。您最终只能反复重复说明、重新解释代码库，并丢失花费数小时才获得的洞察。

**Memory Brain 通过以下方式解决这个问题：**

| 问题 | 解决方案 |
|------|----------|
| AI 在会话之间忘记一切 | 语义记忆持久化事实、偏好和决策 |
| 每次都要重复相同的上下文 | Context Builder 自动组装相关记忆 |
| 无法从过去的错误中学习 | Learning Engine 追踪成功/失败模式 |
| AI 无法跨会话关联概念 | Knowledge Graph 用类型化关系链接实体 |
| 对话历史丢失 | 情景记忆存储完整会话记录 |
| 无法撤销破坏性更改 | 检查点系统支持完整回滚 |
| 记忆无限增长 | 5 层层级结构配合艾宾浩斯衰减自动合并 |

## 工作原理

### 记忆工具调用流程

```
User or Agent
    │
    ▼
┌─────────────────────┐
│   memory tool call  │  action: "store", params: { title, content, ... }
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   BrainManager      │  dispatch(action, params) → routes to handler
│   (Service Layer)   │  emits events, records audit log
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   BrainStore        │  SQLite CRUD, BM25 search, consolidation
│   (Data Layer)      │  17 tables, 27 indexes, WAL mode
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   brain.sqlite      │  ~/.knox/memory/brain.sqlite
│   (Local Database)  │  Your data. Your machine. No cloud.
└─────────────────────┘
```

1. 智能体（或用户）使用 `action` 和 `params` 调用 `memory` 工具。
2. `BrainManager.dispatch()` 路由到 **79 个操作处理器**之一。
3. 处理器调用 `BrainStore`（SQLite 层）或专门的模块（KnowledgeGraph、LearningEngine、CheckpointManager 等）。
4. 事件被发送并记录在审计跟踪中。
5. 向调用者返回人类可读的格式化字符串。

### 自动记忆生命周期

Memory Brain 不仅仅是存储——它主动管理记忆健康：

```
 Store ──► Hot Tier ──► Warm Tier ──► Cold Tier ──► Pruned
           (active)     (1-7 days)   (7-90 days)   (>90 days)
              ▲                                        │
              └─── Promote (frequent retrieval) ◄──────┘

 Background: Ebbinghaus decay, spaced repetition, consolidation
```

频繁访问的记忆会被提升回热层。衰减到重要性阈值以下的记忆会被逐步合并，最终被清除。这使系统保持快速和精准。

## 架构概览

### 模块映射

```
core/context/memory/brain/
├── BrainManager.ts        # Service layer — 79-action dispatch, event bus
├── BrainStore.ts          # SQLite data layer — 17 tables, CRUD, search
├── types.ts               # TypeScript interfaces, enums, input/output models
├── ContextBuilder.ts      # Token-budgeted multi-source context assembly
├── KnowledgeGraph.ts      # Entity/edge CRUD, spreading activation traversal
├── LearningEngine.ts      # Pattern recording, Jaccard similarity suggestions
├── AutoMemory.ts          # Rule-based extraction, topic segmentation
├── CheckpointManager.ts   # Snapshots, rollback, event replay, undo
├── BatchOperations.ts     # Bulk store/delete/update, batch audit logging
├── AdvancedFeatures.ts    # SessionDiscovery, FiveTierHierarchy, SpacedRepetition,
│                          # RootCauseAnalyzer, LruCache, MetricsStorage
├── PerformanceMonitor.ts  # MetricsCollector, HealthScorer, PredictiveAnalytics,
│                          # HealingEngine, ConsolidationTracker
├── LlmMemoryService.ts   # LLM-powered entity extraction, summarization, scoring
├── LlmResilience.ts      # CircuitBreaker, rate limiting, decision caching
├── SleepConsolidation.ts  # Background scheduler, Ebbinghaus decay application
├── WorkingMemory.ts       # In-memory session state, short-term buffer
├── test-memory-tool.ts    # 94 integration tests — 100% pass rate
├── test-brain-debug.ts    # 202 ultra-comprehensive integration tests
├── test-brain-debug-modules.ts  # 59 module-level unit tests
└── test-brain-tool-calls.ts     # 88 end-to-end tool call tests
```

### 设计原则

- **本地优先**：所有数据在 `~/.knox/memory/brain.sqlite`。没有任何数据离开您的机器。
- **零配置**：开箱即用，带合理默认值。
- **LLM 可选**：每个 LLM 增强功能都有基于规则的回退。
- **全程审计**：每个写操作都带有完整撤销支持的日志记录。
- **优雅降级**：断路器、速率限制和弹性回退链。

## 记忆类型

### 1. 语义记忆 — *你知道什么*

从对话中提取的长期事实、决策和知识。

| 类别 | 示例 |
|------|------|
| `fact` | "TypeScript strict mode 启用了更严格的类型检查" |
| `preference` | "用户偏好使用 tab 而非空格" |
| `decision` | "我们为这个项目选择了 PostgreSQL 而非 MySQL" |
| `code_pattern` | "在 Rust 中使用 `Result<T, E>` 进行错误处理" |
| `error_fix` | "通过添加 `Access-Control-Allow-Origin` 头修复了 CORS 错误" |
| `insight` | "BM25 在短文档排名上优于 TF-IDF" |
| `project_context` | "knox-ms 服务处理用户认证" |
| `workflow` | "部署顺序：lint → test → build → push → tag" |
| `summary` | 包含关键决策和结果的会话摘要 |

**特性**：BM25 启发式重排序、重要性评分、情感标签（`positive`、`negative`、`neutral`、`surprise`、`urgency`、`curiosity`）、显著性加权、TTL 过期、关键词索引。

### 2. 情景记忆 — *发生了什么*

完整的对话历史：每条用户消息、助手响应、工具调用和工具结果，按会话存储。

- 追踪 `role`、`token_count`、`importance_score`、`emotional_valence`
- 通过外键链接到会话
- 支持跨会话搜索（`search_backlogs`）
- 自动检测会话内的主题切换（`get_session_topics`）

### 3. 知识图谱 — *事物如何关联*

实体及其关系，建模为有向图。

```
 ┌──────────┐   uses    ┌─────────────┐   depends_on   ┌──────────┐
 │  Knox    ├──────────►│ TypeScript  ├───────────────►│  SQLite  │
 │ (person) │           │ (technology)│                │  (tech)  │
 └──────────┘           └─────────────┘                └──────────┘
```

**13 种实体类型**：person、organization、technology、concept、project、file、function、class、variable、location、event、product、custom。

**图遍历**：扩散激活——从任何实体开始探索，发现按边权重加权的关联节点。

### 4. 学习模式 — *什么有效，什么无效*

按目标类型（coding、debugging、analysis、research 等）追踪方法的成功/失败率。使用 Jaccard 相似度根据过去的结果为新问题建议最佳方法。

### 5. 程序性记忆 — *如何做事*

命名的有序工作流及其步骤。追踪执行次数和成功率。

```json
{
  "name": "deploy-to-production",
  "steps": ["Run lint", "Run tests", "Build", "Push to registry", "Deploy"],
  "success_rate": 0.92,
  "execution_count": 13
}
```

### 6. 工作记忆 — *当下*

内存中的会话状态和短期缓冲区，刷新到磁盘。为当前对话上下文提供快速访问，无需数据库查询。

## 5 层记忆层级

受 CPU 缓存层级和艾宾浩斯遗忘曲线启发。

```
┌─────────────────────────────────────────────────┐
│  TIER 1: ACTIVE   │ Currently in-session        │ Working Memory
├───────────────────┼─────────────────────────────┤
│  TIER 2: HOT      │ Frequently accessed, recent │ Full fidelity
├───────────────────┼─────────────────────────────┤
│  TIER 3: WARM     │ 1-7 days old, moderate use  │ Full fidelity
├───────────────────┼─────────────────────────────┤
│  TIER 4: COLD     │ 7-90 days old, low access   │ Compressed
├───────────────────┼─────────────────────────────┤
│  TIER 5: FROZEN   │ Archived, rarely accessed   │ Compressed
└───────────────────┴─────────────────────────────┘
```

### 自动转换

| 从 | 到 | 触发条件 |
|----|----|----------|
| Hot | Warm | 年龄 > 24h，重要性 < 0.7 |
| Warm | Cold | 年龄 > 7 天，重要性 < 0.5 |
| Cold | Pruned | 年龄 > 90 天，重要性 < 0.3 |
| Semantic Hot | Warm | 7 天无访问，重要性 < 0.6 |
| Semantic Warm | Cold | 30 天无访问，检索次数 < 3 |
| Cold | **Hot**（提升） | 检索次数 ≥ 5，3 天内有访问 |

### 间隔重复

需要复习的记忆会自动浮出。每次检索都会提升记忆的重要性分数，防止衰减——访问越频繁，保留越久。

## 核心功能

### 1. Context Builder

在 token 预算内自动组装最相关的记忆。用于在每次对话开始时为 AI 提供上下文。

**预算分配（默认 4000 tokens）：**

| 来源 | 份额 | 用途 |
|------|------|------|
| 语义记忆 | 40% | 事实、决策、代码模式 |
| 情景历史 | 25% | 近期对话上下文 |
| 知识图谱 | 15% | 实体关系 |
| 程序性记忆 | 10% | 相关工作流 |
| 学习模式 | 10% | 过去方法的成功率 |

```
memory({ action: "build_context", query: "TypeScript migration", max_tokens: 4000 })
```

### 2. 检查点与回滚

完整的记忆状态快照，支持时间点恢复。

- **创建**：快照所有语义记忆、实体和学习模式
- **对比**：查看自检查点以来的变更（新增、删除、修改）
- **回滚**：将记忆恢复到任何检查点——对话历史保留
- **压缩**：gzip 压缩用于节省空间的长期存储
- **生命周期清理**：自动清除旧检查点

**检查点策略：**
- `manual` — 手动显式创建检查点
- `time_based` — 按可配置间隔自动创建
- `adaptive` — 当变更阈值被超过时自动创建
- `hybrid` — 结合时间和自适应触发器

```
memory({ action: "create_checkpoint", label: "before-refactor-v2" })
memory({ action: "rollback_checkpoint", checkpoint_id: 4 })
```

### 3. 完整审计跟踪

每个写操作都被记录，包含目标类型、目标 ID 和详情。支持按操作、时间范围和目标过滤。实现：

- **撤销**：逆转任何特定操作
- **事件重放**：从检查点开始重放变更
- **取证**：准确了解什么在何时发生了变更

### 4. 自动提取

传入原始文本（对话、代码审查、会议记录），Memory Brain 自动提取：

- 语义记忆（事实、决策、洞察）
- 命名实体（人物、技术、项目）
- 情感标签
- 主题分割

默认基于规则工作。配置 LLM 后可使用 LLM 增强提取（LLM 不可用时自动回退到规则）。

### 5. 跨会话搜索

跨所有历史对话会话搜索，支持过滤器：

- 查询文本（全文搜索）
- 日期范围（`from_date`、`to_date`）
- 角色过滤器（user、assistant、tool）
- 会话 ID 过滤器

### 6. 性能监控

实时健康监控和自我修复能力：

- **度量**：追踪操作计数、延迟、缓存命中率
- **健康分数**：碎片化、过时数据、容量的加权综合评分
- **容量预测**：预测何时达到存储或内存限制
- **自动修复**：检测并修复常见问题（孤立记录、索引碎片化）
- **趋势分析**：24 小时回溯的历史度量

### 7. 批量操作

高效的批量操作：

- `batch_store` — 一次调用存储多个记忆
- `batch_delete` — 按 ID 列表删除多个记忆
- `batch_update_importance` — 批量更新重要性分数
- `batch_move_tier` — 在层级之间移动记忆
- `batch_audit_log` — 一次记录多个事件

### 8. LLM 增强功能（可选）

连接 LLM 后解锁高级功能：

| 功能 | 有 LLM | 无 LLM（回退） |
|------|--------|----------------|
| 实体提取 | NER 驱动的提取 | 正则表达式 + 启发式规则 |
| 会话摘要 | 主题检测、决策提取 | 消息计数 + 标题 |
| 重要性评分 | 上下文感知相关性 | 关键词密度 + 长度 |
| 操作后记忆 | LLM 决定记住什么 | 手动 `store` 调用 |

所有 LLM 功能包括：
- **速率限制**：每小时可配置的调用/token 数
- **断路器**：重复失败后自动禁用
- **决策缓存**：避免对类似输入的冗余 LLM 调用

## 全部 79 个操作参考

### 核心记忆（6 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `store` | 保存语义记忆 | `category`、`title`、`content`、`keywords`、`importance`、`ttl_hours` |
| `recall` | 检索相关记忆（语义 + 情景 + 关联） | `query`、`category`、`limit` |
| `search` | 全文搜索语义记忆 | `query`、`category`、`limit` |
| `delete` | 按 ID 删除记忆 | `id` |
| `build_context` | Token 预算化上下文组装 | `query`、`max_tokens`、`include_graph`、`include_procedures`、`include_patterns` |
| `get_stats` | 全面的大脑统计 | — |

### 会话管理（5 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `summarize_session` | 生成会话摘要 | `session_id`、`title`、`workspace_directory` |
| `list_sessions` | 列出已追踪的会话 | `limit`、`workspace_directory` |
| `get_session` | 会话详情 + 历史 | `session_id`、`limit` |
| `close_session` | 关闭并自动摘要 | `session_id` |
| `get_session_topics` | 查看主题切换 | `session_id` |

### 知识图谱（6 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `add_entity` | 添加实体节点 | `name`、`entity_type`、`description`、`properties`、`confidence` |
| `search_entities` | 搜索实体 | `query`、`entity_type`、`limit` |
| `add_edge` | 创建关系 | `source_entity_id`、`target_entity_id`、`relationship`、`weight` |
| `explore_graph` | 扩散激活遍历 | `entity_id`、`depth`、`min_weight` |
| `get_graph_stats` | 图统计 | — |
| `extract_entities` | 从文本自动提取 | `text` |

### 学习引擎（3 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `learn_pattern` | 记录成功/失败 | `goal_type`、`description`、`success`、`tokens_used`、`pattern_signature` |
| `suggest_approach` | 获取方法建议 | `query`、`goal_type` |
| `get_patterns` | 列出学到的模式 | `goal_type`、`limit` |

### 程序性记忆（3 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `store_procedure` | 存储命名工作流 | `name`、`description`、`steps`、`trigger_pattern`、`category` |
| `get_procedures` | 列出工作流 | `category`、`limit` |
| `execute_procedure` | 记录执行 | `procedure_id`、`success` |

### 标签与集合（6 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `tag` | 为记忆添加标签 | `memory_type`、`memory_id`、`tag` |
| `untag` | 移除标签 | `memory_type`、`memory_id`、`tag` |
| `search_by_tag` | 按标签查找 | `tag`、`memory_type` |
| `create_collection` | 创建集合 | `name`、`description` |
| `list_collections` | 列出集合 | — |
| `add_to_collection` | 将记忆添加到集合 | `collection_id`、`memory_type`、`memory_id` |

### 关联（1 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `associate` | 链接两个记忆 | `source_type`、`source_id`、`target_type`、`target_id`、`relationship`、`strength` |

### 自动记忆（1 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `auto_extract` | 从文本提取记忆 + 实体 | `text`、`session_id` |

### 维护（5 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `consolidate` | 运行记忆分层 + 清理 | — |
| `get_health` | 健康检查及建议 | — |
| `optimize` | VACUUM + REINDEX + ANALYZE | — |
| `get_config` | 查看配置 | `key` |
| `update_config` | 更新配置 | `key`、`value` |

### 检查点与回滚（5 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `create_checkpoint` | 快照记忆状态 | `label` |
| `list_checkpoints` | 列出所有检查点 | `limit` |
| `rollback_checkpoint` | 恢复到检查点 | `checkpoint_id` |
| `delete_checkpoint` | 删除检查点 | `checkpoint_id` |
| `compress_checkpoint` | gzip 压缩快照 | `checkpoint_id` |

### 审计与撤销（4 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `get_audit_log` | 查看审计跟踪 | `action`、`target_type`、`limit` |
| `undo_operation` | 逆转特定操作 | `audit_id` |
| `get_undoable_operations` | 列出可撤销条目 | `limit` |
| `replay_events` | 从检查点重放事件 | `checkpoint_id`、`from_time`、`to_time` |

### 跨会话搜索（1 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `search_backlogs` | 跨所有会话搜索 | `query`、`from_date`、`to_date`、`role`、`session_id`、`limit` |

### 导出 / 导入（2 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `export` | 将所有记忆导出为 JSON | — |
| `import` | 从 JSON 导入记忆 | `data` |

### 检查点策略（4 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `checkpoint_strategy_config` | 获取策略配置 | — |
| `update_checkpoint_strategy` | 设置策略模式 | `mode`、`interval_minutes`、`max_checkpoints`、`compress_snapshots` |
| `checkpoint_lifecycle_cleanup` | 清除旧检查点 | — |
| `diff_checkpoint` | 显示自检查点以来的变更 | `checkpoint_id` |

### 批量操作（5 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `batch_store` | 存储多个记忆 | `items[]` |
| `batch_delete` | 按 ID 列表删除 | `ids[]` |
| `batch_update_importance` | 批量更新重要性 | `updates[]` |
| `batch_move_tier` | 在层级间移动记忆 | `ids[]`、`target_tier` |
| `batch_audit_log` | 记录多个事件 | `events[]` |

### 高级功能（7 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `find_related_sessions` | 发现相关会话 | `session_id`、`limit` |
| `five_tier_consolidate` | 运行 5 层合并 | — |
| `get_tier_distribution` | 每层记忆数量 | — |
| `get_tier_configs` | 查看层级配置 | — |
| `update_tier_config` | 更新层级设置 | `tier`、`max_age_hours`、`importance_threshold` |
| `root_cause_analysis` | 分析记忆问题 | — |
| `get_review_due` | 间隔重复待复习列表 | `limit` |

### 性能与健康（11 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `boost_memory` | 间隔重复提升 | `memory_id` |
| `get_cache_stats` | LRU 缓存统计 | — |
| `clear_cache` | 清除 LRU 缓存 | — |
| `get_metrics` | 性能度量 | — |
| `get_health_score` | 加权健康分数 | — |
| `get_capacity_forecast` | 存储增长预测 | — |
| `heal` | 自动修复检测到的问题 | — |
| `get_healing_strategies` | 修复效果 | — |
| `get_consolidation_stats` | 合并元数据 | — |
| `store_metrics_snapshot` | 存储周期性度量 | — |
| `get_metrics_trend` | 历史度量趋势 | `hours` |

### LLM 增强（4 个操作）

| 操作 | 描述 | 关键参数 |
|------|------|----------|
| `llm_extract_entities` | LLM NER 实体提取 | `text` |
| `llm_summarize_session` | LLM 会话摘要 | `session_id` |
| `llm_evaluate_importance` | LLM 重要性评分 | `content`、`context` |
| `llm_post_action_memory` | LLM 操作后记忆 | `action_type`、`input`、`output`、`context` |

## 数据库架构

**17 张表**配合 **27 个优化索引**，运行在启用 WAL 模式和外键约束的 SQLite 上。

```
brain_sessions           — Conversation sessions
brain_episodic           — Conversation turns (messages, tool calls)
brain_semantic           — Long-term factual memories
brain_associations       — Cross-memory links
brain_entities           — Knowledge graph nodes
brain_graph_edges        — Knowledge graph relationships
brain_learning_patterns  — Success/failure patterns
brain_procedures         — Named workflows
brain_tags               — Memory tags (many-to-many)
brain_collections        — Named memory groups
brain_collection_items   — Collection membership
brain_config             — Configuration key/value store
brain_checkpoints        — Memory state snapshots
brain_rate_limits        — LLM rate limit tracking
brain_audit_log          — Full audit trail
brain_session_topics     — Auto-detected topic shifts
brain_metrics_snapshots  — Performance metrics history
```

**存储**：单文件 `~/.knox/memory/brain.sqlite`。活跃使用数月后典型大小为 1-10 MB。

## 优势

### 对比向量数据库（Pinecone、Chroma、Weaviate）

| 方面 | Memory Brain | 向量数据库 |
|------|-------------|-----------|
| **部署** | 零配置，单个 SQLite 文件 | 需要服务器、API 密钥、嵌入 |
| **隐私** | 100% 本地 | 云托管或自托管服务器 |
| **成本** | 免费 | 嵌入 API 成本 + 托管 |
| **延迟** | 大多数查询 < 1ms | 网络往返 + 嵌入 |
| **搜索** | BM25 + TF-IDF（无需嵌入） | 语义向量相似度 |
| **结构** | 知识图谱 + 类型化类别 | 扁平向量空间 |
| **可移植性** | 复制一个文件 | 导出/导入管线 |

### 对比基于文件的记忆（.md 文件、JSON）

| 方面 | Memory Brain | 基于文件 |
|------|-------------|----------|
| **搜索** | 带 BM25 排名的全文搜索 | grep / 字符串匹配 |
| **组织** | 9 种语义类别 + 标签 + 集合 | 手动文件夹结构 |
| **生命周期** | 自动分层 + 衰减 + 提升 | 手动清理 |
| **关系** | 知识图谱 + 关联 | 无 |
| **撤销** | 完整审计跟踪 + 检查点回滚 | Git 历史 |
| **性能** | 27 个索引查询，WAL 模式 | 文件 I/O 瓶颈 |

### 对比无记忆（无状态 LLM）

| 能力 | 有 Memory Brain | 无 |
|------|----------------|------|
| 记住过去的决策 | ✓ 自动 | ✗ 每次会话重复 |
| 从错误中学习 | ✓ 模式追踪 | ✗ 反复犯同样的错误 |
| 关联概念 | ✓ 知识图谱 | ✗ 无交叉引用 |
| 恢复中断的工作 | ✓ 会话历史 | ✗ 从头开始 |
| 个性化响应 | ✓ 存储偏好 | ✗ 通用响应 |
| 随使用扩展 | ✓ 自动合并 | N/A |

### 主要优点

1. **隐私优先** — 一切存储在本地。核心功能无需 API 调用。
2. **自维护** — 自动合并、衰减、提升和修复。
3. **弹性** — 断路器、回退、速率限制。无单点故障。
4. **可观测** — 完整审计跟踪、健康度量、性能监控。
5. **可逆** — 任何破坏性操作都有检查点/回滚。
6. **Token 高效** — Context Builder 只组装 token 预算内的内容。
7. **结构化** — 不只是文本块：类型化实体、加权边、分类事实。
8. **经过测试** — 4 个测试套件中 443 个集成测试，覆盖所有 79 个操作，100% 通过率。
9. **LLM 可选** — 每项功能都无需 LLM 即可工作。增强功能优雅降级。
10. **可移植** — 以 JSON 导出/导入一切。在机器间自由迁移。

## 配置

所有设置存储在 `brain_config` 表中，可通过工具调用读取/更新。

| 键 | 默认值 | 描述 |
|----|--------|------|
| `auto_extract_enabled` | `true` | 自动从对话中提取记忆 |
| `consolidation_interval_hours` | `24` | 自动合并运行间隔（小时） |
| `max_episodic_per_session` | `1000` | 每会话最大情景条目数 |
| `max_hot_memories` | `500` | 热记忆上限（触发合并） |
| `hot_to_warm_hours` | `24` | 情景降级到 warm 前的小时数 |
| `warm_to_cold_days` | `7` | 降级到 cold 前的天数 |
| `cold_prune_days` | `90` | cold 记忆被清除前的天数 |
| `graph_enabled` | `true` | 启用知识图谱 |
| `learning_enabled` | `true` | 启用学习模式追踪 |
| `context_max_tokens` | `4000` | 默认 context builder 的 token 预算 |
| `llm_calls_per_hour_limit` | `60` | 每小时最大 LLM 调用数 |
| `llm_tokens_per_hour_limit` | `50000` | 每小时最大 LLM token 数 |

```
memory({ action: "get_config" })
memory({ action: "update_config", key: "max_hot_memories", value: "1000" })
```

## 测试覆盖

四个测试套件执行 **443 个集成测试**，覆盖所有 79 个操作，通过实际的 dispatch 管线在真实 SQLite 数据库上调用每个操作。

### 套件 1：`test-memory-tool.ts` — 94 个测试

覆盖所有核心 dispatch 操作的原始集成测试。

| 章节 | 测试数 | 覆盖范围 |
|------|--------|----------|
| 核心记忆操作 | 6 | store、recall、search、delete |
| 会话操作 | 2 | list、stats |
| 知识图谱 | 8 | 实体、边、搜索、遍历、提取 |
| 学习引擎 | 4 | 模式、建议 |
| 程序性记忆 | 3 | store、list、execute |
| 自动提取 | 1 | 完整提取管线 |
| Context Builder | 2 | 完整和最小上下文 |
| 标签与集合 | 5 | tag/untag、搜索、集合 |
| 关联 | 1 | 跨记忆链接 |
| 维护 | 3 | 健康、优化、配置、合并 |
| 检查点与回滚 | 5 | 创建、对比、压缩、回滚、验证 |
| 审计与主题 | 2 | 审计日志、过滤 |
| 跨会话搜索 | 1 | 历史搜索 |
| 导出 / 导入 | 1 | JSON 导出 |
| 检查点策略与批量 | 6 | 策略配置、批量操作 |
| 高级功能（Tier D） | 7 | 5 层、间隔重复、缓存 |
| 性能监控 | 7 | 度量、健康、预测、修复 |
| LLM 增强（回退） | 2 | 实体提取、重要性评分 |
| 边缘用例 | 5 | 不存在的 ID、空查询 |
| 批量删除 | 2 | 批量删除、未知操作 |
| **总计** | **94** | **100% 通过率** |

### 套件 2：`test-brain-debug.ts` — 202 个测试

超全面的集成测试，对每个 dispatch 操作进行深度输出验证、边缘用例和多步骤工作流。

| 章节 | 测试数 | 覆盖范围 |
|------|--------|----------|
| 核心记忆（CRUD） | 12 | store、recall、search、delete、重复 |
| 会话生命周期 | 10 | 创建、列出、获取、关闭、摘要、主题 |
| 知识图谱 | 16 | 实体、边、遍历、统计、提取 |
| 学习引擎 | 10 | 模式、建议、目标类型、相似度 |
| 程序性记忆 | 8 | store、list、execute、成功追踪 |
| 自动提取管线 | 6 | 文本提取、实体检测、情感标签 |
| Context Builder | 8 | token 预算、来源分配、过滤器 |
| 标签与集合 | 12 | tag、untag、搜索、集合、成员资格 |
| 关联 | 6 | 跨记忆链接、关系类型 |
| 维护 | 10 | 健康、优化、配置 CRUD、合并 |
| 检查点与回滚 | 14 | 创建、对比、压缩、回滚、生命周期 |
| 审计跟踪与撤销 | 12 | 审计日志、过滤、撤销、重放 |
| 跨会话搜索 | 6 | 历史搜索、日期/角色过滤器 |
| 导出 / 导入 | 4 | JSON 导出、导入、往返 |
| 批量操作 | 14 | 批量 store、delete、update、move、audit |
| 高级功能 | 18 | 5 层、间隔重复、缓存、根因分析 |
| 性能监控 | 20 | 度量、健康分数、预测、修复 |
| LLM 增强回退 | 8 | 实体提取、摘要、重要性 |
| 检查点策略 | 10 | manual、time、adaptive、hybrid 模式 |
| 边缘用例与错误 | 18 | 无效 ID、空输入、并发 |
| **总计** | **202** | **100% 通过率** |

### 套件 3：`test-brain-debug-modules.ts` — 59 个测试

各个类的模块级别单元测试（BrainStore、KnowledgeGraph、LearningEngine、ContextBuilder、CheckpointManager、BatchOperations、AdvancedFeatures、PerformanceMonitor）。

| 模块 | 测试数 | 覆盖范围 |
|------|--------|----------|
| BrainStore | 10 | 表创建、CRUD、索引、WAL 模式 |
| KnowledgeGraph | 8 | 实体/边 CRUD、扩散激活 |
| LearningEngine | 6 | 模式记录、Jaccard 相似度 |
| ContextBuilder | 8 | Token 预算、来源分配 |
| CheckpointManager | 7 | 快照、回滚、压缩 |
| BatchOperations | 6 | 批量 store、delete、update、move |
| AdvancedFeatures | 8 | 5 层层级、间隔重复、LRU 缓存 |
| PerformanceMonitor | 6 | MetricsCollector、HealthScorer、修复 |
| **总计** | **59** | **100% 通过率** |

### 套件 4：`test-brain-tool-calls.ts` — 88 个测试

端到端测试，验证所有 79 个工具枚举操作通过 `BrainManager.dispatch()` 工作，按操作层级组织。

| 层级 | 测试数 | 覆盖范围 |
|------|--------|----------|
| Tier A — 核心记忆 | 6 | store、recall、search、delete、context、stats |
| Tier A — 会话 | 5 | summarize、list、get、close、topics |
| Tier A — 维护 | 5 | consolidate、health、optimize、config |
| Tier A — 知识图谱 | 6 | entity、edge、search、explore、stats、extract |
| Tier A — 学习引擎 | 3 | learn、suggest、get patterns |
| Tier A — 程序性 | 3 | store、list、execute |
| Tier A — 自动提取 | 1 | 完整管线 |
| Tier A — 标签与集合 | 6 | tag、untag、search、collection CRUD |
| Tier A — 导出/导入 | 2 | JSON 往返 |
| Tier A — 自管理 | 5 | checkpoint、rollback、audit、undo |
| Tier A — LLM 增强 | 4 | 实体提取、摘要、重要性、操作后 |
| Tier A — 检查点 | 5 | list、delete、compress、diff、replay |
| Tier B — 性能 | 6 | 度量、健康分数、预测、修复、策略 |
| Tier C — 检查点策略 | 4 | config、update、lifecycle、合并统计 |
| Tier C — 事件重放/撤销 | 3 | replay、undo、可撤销操作 |
| Tier C — 批量操作 | 5 | store、delete、update、move、audit |
| Tier D — 层级 | 5 | 5 层、分布、配置、更新、相关 |
| Tier D — 根因分析与重复 | 3 | 根因、待复习、提升 |
| Tier D — 缓存与度量 | 5 | 缓存统计、清除、度量快照、趋势 |
| 覆盖验证 | 1 | 验证所有 79 个枚举值已 dispatch |
| **总计** | **88** | **100% 通过率** |

### 总结

| 套件 | 测试数 | 重点 |
|------|--------|------|
| test-memory-tool.ts | 94 | 原始集成测试 |
| test-brain-debug.ts | 202 | 超全面深度验证 |
| test-brain-debug-modules.ts | 59 | 模块级别单元测试 |
| test-brain-tool-calls.ts | 88 | 端到端工具枚举覆盖 |
| **总计** | **443** | **所有 79 个操作 — 100% 通过率** |

每个测试套件使用全新的临时数据库，验证输出格式，并在完成后自行清理。

## 快速入门

### 存储记忆

```
memory({ action: "store", category: "decision", title: "Use SQLite for memory",
         content: "Chose SQLite over Postgres for zero-config local storage.",
         keywords: "database,sqlite,architecture", importance: 0.9 })
```

### 召回相关上下文

```
memory({ action: "recall", query: "database choice", limit: 5 })
```

### 构建对话前上下文

```
memory({ action: "build_context", query: "TypeScript migration project",
         max_tokens: 4000 })
```

### 在风险操作前创建安全检查点

```
memory({ action: "create_checkpoint", label: "before-major-refactor" })
// ... do risky work ...
memory({ action: "rollback_checkpoint", checkpoint_id: 1 })  // oops, undo
```

### 追踪有效方法

```
memory({ action: "learn_pattern", goal_type: "debugging",
         description: "Binary search through git history to isolate regression",
         success: true, tokens_used: 1200 })

// Next time:
memory({ action: "suggest_approach", query: "find regression", goal_type: "debugging" })
```

## 工具集成

Memory Brain 作为一等内置工具完全集成到 Knox 工具调用系统中，具有自己的 UI 类别、拦截器验证和权限控制。

### 注册架构

```
core/tools/definitions/memory.ts     → Tool definition (schema, 79 actions, params)
core/tools/implementations/memory.ts → Implementation (routes to BrainManager.dispatch)
core/tools/callTool.ts               → Dispatch (BuiltInToolNames.Memory → memoryImpl)
core/tools/builtIn.ts                → Enum (Memory = "builtin_memory")
core/tools/index.ts                  → allTools array (includes memoryTool)
core/config/load.ts                  → Config (tools: [...allTools])
```

### 工具标识

| 属性 | 值 |
|------|-----|
| **内部名称** | `builtin_memory` |
| **显示标题** | `Memory` |
| **UI 类别** | `[Memory]` |
| **权限组** | `Permissions`（内置） |
| **默认权限** | `allowedWithoutPermission`（自动批准） |
| **只读** | `false` |

### 在 UI 中的显示

memory 工具显示在 **Tools** 面板的 **Permissions** 组下：

```
● Permissions  [12]                              ⬤ ON
  [Files] Read File                        Auto-Approve
  [Files] Create New File                  Auto-Approve
  [Terminal] Run Terminal Command          Auto-Approve
  [Files] View Subdirectory                Auto-Approve
  [Files] View Repo Structure              Auto-Approve
  [Search] Exact Search                    Auto-Approve
  [Search] Web Search                      Auto-Approve
  [Diff] View Diff                         Auto-Approve
  [Files] Read Currently Open File         Auto-Approve
  [Tool] Load Skill                        Auto-Approve
  [Tool] LSP                               Auto-Approve
  [Memory] Memory                          Auto-Approve
```

### 文件位置

| 组件 | 路径 | 用途 |
|------|------|------|
| 工具定义 | `core/tools/definitions/memory.ts` | LLM 面向的 schema：79 个操作，所有参数 |
| 工具实现 | `core/tools/implementations/memory.ts` | 路由 `args.action` → `BrainManager.dispatch()` |
| 工具分发 | `core/tools/callTool.ts` | `BuiltInToolNames.Memory` → `memoryImpl()` |
| 工具枚举 | `core/tools/builtIn.ts` | `Memory = "builtin_memory"` |
| 工具注册表 | `core/tools/index.ts` | `allTools` 数组、`allAvailableTools` |
| 配置加载器 | `core/config/load.ts` | `KnoxConfig` 中的 `tools: [...allTools]` |
| 拦截器 | `extensions/vscode/src/agent/ToolCallInterceptor.ts` | 验证、日志、度量 |
| UI 权限 | `gui/src/redux/slices/uiSlice.ts` | `toolSettings` 初始状态 |
| UI 类别 | `gui/src/util/toolNameFormatter.ts` | `[Memory]` 类别前缀 |
| UI 对话框 | `gui/src/components/.../ToolPermissionsDialog.tsx` | 渲染工具权限开关 |

### 权限状态

每个工具可以处于三种权限状态之一，通过点击循环切换：

| 状态 | 行为 |
|------|------|
| `allowedWithoutPermission` | **自动批准** — 工具调用无需确认即执行 |
| `allowedWithPermission` | **询问** — 用户必须批准每次工具调用 |
| `disabled` | **禁用** — 工具永远不会被调用 |

整个 `Permissions` 组也可以通过组开关整体开关。

### 工具调用流程（端到端）

```
1. LLM generates tool call:
   { name: "builtin_memory", arguments: { action: "store", ... } }

2. ToolCallInterceptor validates:
   - Tool exists in registry ✓
   - Required params present (action) ✓
   - Logs call to history, tracks metrics

3. Permission check:
   - toolSettings["builtin_memory"] === "allowedWithoutPermission"
   - Auto-approved (no user prompt)

4. callTool() dispatches:
   - Matches BuiltInToolNames.Memory
   - Calls memoryImpl(args, extras)

5. memoryImpl() routes:
   - Gets BrainManager singleton
   - Calls brain.dispatch(args.action, args)

6. BrainManager.dispatch() handles:
   - Routes to appropriate handler (store, recall, search, etc.)
   - Records audit trail
   - Emits events
   - Returns formatted string

7. Result returned to LLM as ContextItem[]
```

[**在此体验带 Memory Brain 的 KnoxChat VS Code 扩展 >>>**](https://open-vsx.org/extension/knoxchat/knoxchat)

*Memory Brain 是 KnoxCore 平台的一部分。所有数据保留在您的机器上。*