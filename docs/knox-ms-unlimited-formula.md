---
sidebar_position: 17
title: KMS Unlimited Context Theorem
description: Bounded context, unbounded memory, measured recall. The formal model behind the Knox-MS memory-centric architecture, with testable guarantees.
keywords: [knox, knox api, ai integration, knox-ms, unlimited context, context theorem, recall theorem, bounded context, brain-inspired, memory system, fsrs, neural architecture]
---

# KMS Unlimited Context Theorem

**Bounded context, unbounded memory, measured recall.**

Knox-MS gives a model a memory horizon that is not limited by its context window. This page states exactly what that means, what it does not mean, and which measurable assumptions it rests on. The architecture borrows its structure from human memory: encoding, consolidation, retrieval, and adaptive forgetting.

:::info
An earlier version of this page "proved" unlimited context by showing that storage is unbounded. That holds for any disk and says nothing about what a model can use. Every correction is listed in [Revision notes](#revision-notes).
:::

## What "unlimited context" means

Three quantities must be kept apart:

| Symbol | Meaning | Bounded? |
|---|---|---|
| $C_{\text{addr}}$ | **Addressable memory**: everything stored | No |
| $C_{\text{use}}(q) = \lvert C(q) \rvert$ | **Usable context**: tokens actually placed in one model call for query $q$ | Yes, always $\le W - W_{\text{out}}$ (the model window minus the reserved output) |
| $\text{Rec}(q) = \dfrac{\lvert G(q) \cap C(q) \rvert}{\lvert G(q) \rvert}$ | **Recall**: fraction of the relevant (gold) memories $G(q)$ that reach the call | Must stay high as history grows |

**The Knox-MS claim:** as the history $N$ grows without bound, average recall stays above a measured bound, usable context stays within the window, and tree-routing cost grows only logarithmically in $N$.

Unbounded storage ($C_{\text{addr}} \to \infty$) is *necessary but not sufficient*. Part VIII shows that storage alone makes recall collapse.

## Knox-MS (KMS) Architecture

### Core Principle: Memory as Central Orchestrator

All processing flows through the memory system $\mathcal{H}$, wrapped by brain-inspired stages:

$$
\boxed{
\mathcal{O}(x) = \mathcal{B}_s\Big(\mathcal{B}_g\Big(\mathcal{H}\Big(\mathcal{P}\Big(\mathcal{A}\Big(\mathcal{T}\big(\mathcal{S}(x)\big)\Big)\Big)\Big)\Big)\Big)
}
$$

The brain-region names are labels *inspired by* neuroscience. They are not a model of neuroanatomy.

## Part I: Neural Architecture Flow

### The Processing Pipeline

The same order is used everywhere on this page (boxed formula, arrow diagram, and composition):

$$
x \xrightarrow{\text{encode}} \mathcal{S} \xrightarrow{\text{filter}} \mathcal{T} \xrightarrow{\text{weight}} \mathcal{A} \xrightarrow{\text{plan}} \mathcal{P} \xrightarrow{\text{recall / store}} \mathcal{H} \xrightarrow{\text{procedure}} \mathcal{B}_g \xrightarrow{\text{generate}} \mathcal{B}_s \xrightarrow{\text{respond}} y
$$

Where:
- $\mathcal{S}$ = **Sensory Cortex**: input processing (parse, tokenize, extract entities)
- $\mathcal{T}$ = **Thalamus**: relay and filter (scope and attention)
- $\mathcal{A}$ = **Amygdala**: salience weighting (initial importance $I_0$)
- $\mathcal{P}$ = **Prefrontal Cortex**: planning and task decomposition
- $\mathcal{H}$ = **Hippocampus**: memory hub (retrieve, reconcile, store)
- $\mathcal{B}_g$ = **Basal Ganglia**: procedural memory (learned workflows)
- $\mathcal{B}_s$ = **Brainstem**: output generation
- $y$ = final response

**Complete Neural Transfer Function:**

$$
\mathcal{N}(x, t) = \mathcal{B}_s \circ \mathcal{B}_g \circ \mathcal{H} \circ \mathcal{P} \circ \mathcal{A} \circ \mathcal{T} \circ \mathcal{S}(x, t)
$$

**Feedback loops:**

$$
\mathcal{H} \to \mathcal{P} \;\;(\text{retrieved memory can trigger re-planning}), \quad
\mathcal{B}_s \to \mathcal{H} \;\;(\text{outcome attribution, Part V}), \quad
\mathcal{B}_s \to \mathcal{T} \;\;(\text{turn } t \text{ output is input at } t+1)
$$

## Part II: 5-Level Memory Hierarchy

### Memory Hierarchy Model

$$
\mathcal{M} = \{ M_1, M_2, M_3, M_4, M_5 \}
$$

| Level | Name | Lifetime | Capacity | Representation | Inspired by |
|---|---|---|---|---|---|
| $M_1$ | Input Buffer | one turn | current message and tool results | raw | Sensory cortex |
| $M_2$ | Working Memory | one model call | $\le W_{\text{mem}}$ tokens | selected memories and scratchpad | Prefrontal cortex |
| $M_3$ | Session Memory | one session | the session transcript | raw turns and topic summaries | Hippocampus |
| $M_4$ | Long-Term Memory | until superseded or forgotten | unbounded | facts, episodes, summary tree (originals kept) | Neocortex |
| $M_5$ | Procedural Memory | until superseded or forgotten | unbounded | workflows and learned patterns | Basal ganglia |

$M_1$ and $M_2$ are per-turn and per-call *buffers*, not stores, so they do not count toward storage.

**Storage Lemma.** The addressable memory

$$
C_{\text{addr}}(N) = \lvert M_3 \rvert + \lvert M_4 \rvert + \lvert M_5 \rvert
$$

grows without bound as the history $N$ grows. This is true of any persistent store. Part VIII shows why it is not enough on its own.

### Lossless Hierarchy: Summaries Are Pointers

Every summary node keeps pointers to its children, all the way down to the original rows. Compression never deletes originals. Only an explicit `forget`, a TTL, or a privacy policy removes data, and it leaves a tombstone in the audit log.

**Deletion propagates.** A delete is complete only when the original, every derived artifact, and every summary that mentions it are gone:

1. Remove the row and write the tombstone (no content, only id, scope, reason, and time).
2. Remove its postings from the BM25 and n-gram indexes and its text from the ripgrep corpus.
3. Remove graph edges whose only evidence was the deleted memory, and entities left with no evidence.
4. Regenerate every ancestor summary node from its remaining children, bottom-up.

The delete is acknowledged only after step 4, so no summary can leak forgotten content.

Why this matters: suppose each round of summarization kept a fraction $\beta$ of the information and discarded the originals. After $h$ rounds only $\beta^h$ would remain, for example $0.9^{10} \approx 0.35$. In Knox-MS, summaries are used to **route** a search toward the right originals. The originals are what enter the context. Summary quality therefore affects only routing accuracy (measured as $\varepsilon_B$ in Part VIII), and information loss does not compound.

## Part III: 8-Phase Memory Cycle

### The Cognitive Processing Cycle

$$
\Phi = \{ \phi_1, \phi_2, \phi_3, \phi_4, \phi_5, \phi_6, \phi_7, \phi_8 \}
$$

**Phase Definitions:**

1. **$\phi_1$: Input**. The turn enters the buffer.
   $$\phi_1(x_t) = \mathcal{S}(x_t) \to M_1$$

2. **$\phi_2$: Encoding**. Lexical indexing (BM25 terms, n-grams, ripgrep-ready text), entity extraction, and provenance tagging. There is no embedding vector.
   $$\phi_2(x) = \big(\text{terms}(x),\; \text{ngrams}(x),\; \text{ent}(x),\; \text{src}(x)\big), \qquad \text{src}(x) \in \{\text{user}, \text{assistant}, \text{tool}, \text{external}\}$$
   Provenance sets a trust level. Memories from `tool` and `external` sources (web pages, files, API output) are always injected as quoted data, never as instructions, and cannot supersede a `user` fact on their own.

3. **$\phi_3$: Working Memory**. Budgeted context assembly (Part VII).
   $$\phi_3(q) = \text{Select}\big(\text{Cand}(q),\, W_{\text{mem}}\big) \to M_2$$

4. **$\phi_4$: Consolidation**. Write-time reconciliation against existing valid facts in the same scope.
   $$\phi_4(m) \in \{\text{ADD}, \text{UPDATE}, \text{SUPERSEDE}, \text{MERGE}, \text{NOOP}\} \to M_3, M_4$$
   A superseded fact is closed (its validity end time is set), not deleted, so earlier states stay queryable. Facts are bitemporal: *valid time* records when the fact was true, *transaction time* records when Knox-MS learned it.
   Writes are idempotent (keyed by a content hash within the scope) and reconciliation is serialized per scope, so two sessions writing the same fact cannot produce duplicate or conflicting valid facts.

5. **$\phi_5$: Long-Term Storage**. The new leaf is inserted under a summary node. The original is kept.
   $$\phi_5(m) = \text{insert}(m, \text{Tree}) \to M_4, M_5$$
   Insertion updates the **term sketch** of every ancestor (a Bloom filter plus top-term counts over all descendant leaves). A node with more than $b$ children splits, as in a B-tree, so depth stays $\lceil \log_b N_q \rceil$. Ancestor summary text is refreshed lazily by $\phi_7$; the sketches are refreshed synchronously.

6. **$\phi_6$: Retrieval**. Scoped, multi-channel, fused candidate generation (Part V).
   $$\phi_6(q) = \text{Cand}(q) \subseteq \Omega(q)$$

7. **$\phi_7$: Sleep Consolidation**. Background maintenance that runs on a schedule and when a scope is idle, not on every turn: deduplicate, scan for contradictions, maintain the summary tree, refresh lexical indexes (BM25, n-grams, ripgrep corpus), and refit parameters from outcomes. Strengthening is driven by *use* (Part IV). Low-value memories are archived, not deleted.
   $$\phi_7(\mathcal{M}) = \text{refit} \circ \text{archive}_{\text{Value} < \theta_{\text{arch}}} \circ \text{tree} \circ \text{reconcile} \circ \text{dedup}(\mathcal{M})$$

8. **$\phi_8$: Output and Attribution**. Respond, then log which memories were used and whether they helped.
   $$\phi_8(q) = \mathcal{B}_s\big(q, C(q)\big), \quad \text{then } \text{attribute}\big(C(q), y\big) \to \mathcal{H}$$

**Cycle Invariants** (all five are testable):

$$
\begin{aligned}
&\textbf{Budget:} && \forall q:\; \lvert C(q) \rvert + W_{\text{out}} \le W \\
&\textbf{Reachability:} && \forall m \in \mathcal{M} \text{ not deleted, in every tier}:\; m \text{ is reachable from the tree and from at least one other index} \\
&\textbf{Losslessness:} && \text{every leaf under a summary node is a retained original or a tombstone} \\
&\textbf{Freshness:} && \text{a memory written in turn } t \text{ is retrievable from turn } t+1 \text{ (read-your-writes)} \\
&\textbf{Erasure:} && \text{no index, edge, or summary contains content from a tombstoned memory}
\end{aligned}
$$

Freshness holds because $\phi_2$, $\phi_4$, and $\phi_5$ (including term sketches) run on the write path. Only summary text and refits are deferred to $\phi_7$.

## Part IV: Forgetting, Stability & Spaced Repetition

### Power-Law Forgetting Curve

Every memory $m$ carries a **stability** $S_m > 0$ (in days), a **difficulty** $D_m \in [1, 10]$, and $t$, the time since its last *useful* access:

$$
R(t, S) = \left(1 + F \cdot \frac{t}{S}\right)^{-c}, \qquad F = \tfrac{19}{81},\; c = 0.5 \quad\Longrightarrow\quad R(S, S) = 0.9
$$

- $R \in (0, 1]$ is the retrievability: the estimated probability that the memory is still worth recalling.
- $S$ has a direct meaning: **the number of days until $R$ falls to 90%**.
- A power law fits human forgetting data better than an exponential, and its long tail keeps old but valuable memories from collapsing.
- **No division by zero.** New memories start with a category-dependent $S_0 > 0$, scaled by initial importance $I_0 \in [0, 1]$, and a neutral difficulty $D_0$:

$$
S_0(m) = S_{\text{cat}(m)} \cdot 2^{\,2 (I_0(m) - 0.5)} \in \big[\tfrac{1}{2} S_{\text{cat}},\; 2\, S_{\text{cat}}\big], \qquad D_0 = 5
$$

| Category | $S_{\text{cat}}$ ($S_0$ at $I_0 = 0.5$) |
|---|---|
| episodic turn | 1 day |
| fact, error_fix, code_pattern | 14 days |
| preference, workflow | 30 days |
| decision, project_context | 60 days |

### Strengthening on Use (Spacing Effect)

A memory gets stronger only when it was **injected into a call and actually used** (cited or credited, see Part V). Being retrieved is not enough:

$$
S' = \min\!\Big( S \cdot \Big(1 + a\,(11 - D)\, S^{-\gamma} \big(e^{\,g(1 - R)} - 1\big)\Big),\;\; \rho_{\max}\, S,\;\; S_{\max} \Big), \qquad a = e^{1.5},\; \gamma = 0.2,\; g = 1,\; \rho_{\max} = 10,\; S_{\max} = 3650\text{ d}
$$

| Event | Update |
|---|---|
| Used and helpful | $S \leftarrow S'$ (above), $\; D \leftarrow \max(1, D - 0.5)$ |
| Used but contradicted or harmful | $S \leftarrow \max(S_{\min},\, 0.3\,S)$, $\; D \leftarrow \min(10, D + 1)$, $\; S_{\min} = 0.1$ d |
| Retrieved but not used | no change |

After every update, difficulty reverts toward the prior: $D \leftarrow 0.95\, D + 0.05\, D_0$. Without this, a few early mistakes would pin $D$ at 10 for good.

Properties:
- **Spacing effect.** The gain factor $e^{g(1-R)} - 1$ is near 0 when $R \approx 1$, so ten accesses in one minute add almost nothing. A memory revived just before being forgotten gains the most.
- **Saturation.** $S^{-\gamma}$ makes strong memories grow more slowly. Uncapped, one use at $S = 1$, $D = 1$, $R \to 0$ would multiply $S$ by about 78, so a single use is capped at $\rho_{\max} = 10\times$ and stability is capped at ten years.
- **No popularity runaway.** Retrieval alone never strengthens a memory, so a memory cannot reinforce itself just by being retrieved.

The defaults are standard FSRS-style starting values. Knox-MS refits them per user from the attribution log (Part V).

### Bounded Utility and Value

Initial importance $I_0$ becomes the prior of a learned estimate of "this memory helps when injected":

$$
U(m) = \frac{h_m + \kappa\, I_0(m)}{h_m + u_m + \kappa} \in [0, 1], \qquad \kappa = 5
$$

$$
\boxed{\text{Value}(m, t) = R(t, S_m) \cdot U(m) \in [0, 1]}
$$

Here $h_m$ is the helpful evidence and $u_m$ the unhelpful evidence from the attribution log (Part V). A correction adds 1 to $u_m$; an injection that is not cited adds a fractional $\omega = 0.1$, because silence is weak evidence. Unlike $I_0 \cdot R \cdot (1 + \alpha n)$, Value is **bounded** and **self-correcting**: a memory injected 50 times and never cited has $u_m = 5$, so $U = \kappa I_0 / (5 + \kappa) = I_0 / 2$, and it keeps drifting toward 0.

Some memories shape answers without being cited (for example "the user writes TypeScript"). Their evidence comes from the ablation probes in Part V rather than from citations, so they are not starved by $\omega$.

### Tiers Derived from One Model

All tier transitions come from the same $R$ and Value. There is no separate decay rate and no separate hard-coded age thresholds:

| Tier | Rule | Storage |
|---|---|---|
| Active | in the current session's working set | memory (RAM) |
| Hot | $R \ge 0.9$ | full fidelity, all indexes |
| Warm | $0.7 \le R < 0.9$ | full fidelity |
| Cold | $0.3 \le R < 0.7$ | summarized in the tree, originals kept |
| Frozen | $R < 0.3$ or $\text{Value} < \theta_{\text{arch}}$ | compressed archive, reachable on demand |
| Deleted | only an explicit `forget`, a TTL, or a privacy policy | tombstone in the audit log (deletion propagates, Part II) |

**Tiers change cost, never reachability.** Every non-deleted tier stays in the tree and in the lexical index (Frozen postings live in a slower, compressed segment). A Frozen memory costs more latency to fetch, but it can still be routed to, so the recall theorem in Part VIII covers all tiers.

**Worked example.** An episodic turn with $S_0 = 1$ day and no reinforcement leaves Hot after **1 day**, Warm after **≈ 4.4 days**, and Cold after **≈ 43 days**:

$$
R = 0.7 \Rightarrow t = \left(0.7^{-2} - 1\right)\tfrac{81}{19} \approx 4.4\text{ d}, \qquad
R = 0.3 \Rightarrow t = \left(0.3^{-2} - 1\right)\tfrac{81}{19} \approx 43\text{ d}
$$

A decision with $S_0 = 60$ days stays Hot for two months, and each useful access pushes every boundary further out. Age alone never deletes anything.

## Part V: Multi-Strategy Retrieval

### Stage 1: Scoped Candidate Channels

Each query searches only its **scope** $\Omega(q)$. Write $N_q = \lvert \Omega(q) \rvert$. The scope has two parts:

- **Access boundary (hard).** Tenant and user are an access-control filter applied inside every index, before ranking. No ranking signal can cross it.
- **Relevance scope (soft).** The current project and session, plus user-global memories (preferences, workflows) that apply across projects. By default only facts valid now are searched. A query about the past ("what did we use before?") switches to **as-of mode** and searches facts valid at the referenced time, including superseded ones.

Four channels each return a ranked list over $\Omega(q)$. There is no embedding model, vector index, or neural reranker. Each channel has a hard cost limit, so no single channel can make a query scan the whole store:

| Channel $s$ | Ranking signal | Cost limit |
|---|---|---|
| lexical | BM25 over terms, with trigram fuzzy overlap and rule-based synonyms | top-$k$ with WAND / MaxScore early termination |
| ripgrep | exact, regex, and identifier hits over stored text and project files | scoped file set, 200 ms time limit |
| graph | Personalized PageRank (Part VI) | $O(1/(\alpha\, \epsilon_{\text{ppr}}))$ pushes |
| tree | beam search over term sketches of the summary tree (Part VIII) | $O(B\, b\, \log_b N_q)$ nodes |

BM25 and ripgrep work still grows with $N_q$. Only the tree channel has a logarithmic bound, and the recall theorem relies on the tree channel alone.

### Stage 2: Scale-Free Fusion

Channel scores live on different scales (BM25 in $[0, \infty)$, ripgrep hit counts, graph scores of arbitrary size), so they are **never added directly**. Only ranks are combined, using Reciprocal Rank Fusion:

$$
\text{rel}(m, q) = \sum_{s} \frac{w_s}{k_0 + \text{rank}_s(m)}, \qquad k_0 = 60
$$

A channel that does not return $m$ contributes 0. The channel weights $w_s$ start at 1 and are refit from outcomes.

### Stage 3: Priors Modulate Relevance

Utility and retrievability are query-independent. They therefore **scale** relevance instead of competing with it:

$$
\boxed{
\text{score}(m, q) = \text{rel}(m, q) \cdot \big(1 + \eta_U\, U(m)\big) \cdot \big(1 + \eta_R\, R(t, S_m)\big), \qquad \eta_U = 0.5,\; \eta_R = 0.3
}
$$

**Relevance-dominance property.** Because the prior factors lie in $[1,\, (1 + \eta_U)(1 + \eta_R)] = [1,\, 1.95]$:
- $\text{rel}(m, q) = 0 \Rightarrow \text{score}(m, q) = 0$, so an irrelevant memory can never be selected because it is important or recent.
- $m$ can outrank $m'$ only if $\text{rel}(m, q) > \text{rel}(m', q) / 1.95$.

### Stage 4: Candidate Cut and Calibrated Threshold

The candidate set is the top 50 fused candidates **plus** every leaf the tree channel routed to (at most $B \cdot b$ reserved slots). The other channels can therefore add candidates but never push a tree-routed leaf out.

Candidates are then cut by $\theta$. The cut-off is **calibrated** so that it means $P(\text{helpful} \mid m, q) \ge \theta$, instead of a raw BM25 or ripgrep score:

$$
\hat{P}(\text{helpful} \mid m, q) = \text{iso}\big(\text{score}(m, q)\big)
$$

where $\text{iso}$ is an isotonic regression fit on the attribution log, weighted by inverse selection propensity (below) so that memories the selector rarely shows are not judged on a biased sample. Until a scope has 200 logged injections, the global fit is used, and before any fit exists the cut-off is the top 20 by score. Relevance stays the fused lexical / ripgrep / graph / tree rank; nothing is re-scored by an embedding or rerank model.

### Outcome Attribution (closes the loop)

For every call, Knox-MS logs which memories were injected and whether they helped:

| Signal | Effect |
|---|---|
| Model cites `[mem:id]` and the turn succeeds (accepted, tests pass, no correction) | $h_m \mathrel{+}= 1$, useful access in Part IV |
| Next user turn corrects a cited memory | $u_m \mathrel{+}= 1$, harmful update in Part IV |
| Injected, not cited | $u_m \mathrel{+}= \omega$ ($\omega = 0.1$), no stability change |
| Ablation probe: removing $m$ changes the answer, and the original answer succeeded | $h_m \mathrel{+}= 1$, useful access in Part IV |

Citations are a noisy signal: models omit them, and cite memories they did not rely on. Two mechanisms correct for this:

- **Ablation probes.** On a small sample of successful turns (default 2%), one injected memory is removed offline and the answer regenerated. A changed answer credits the memory even if it was never cited.
- **Exploration with logged propensities.** For a small share of calls (default 5%), $U(m)$ in Stage 3 is replaced by a draw from its Beta posterior $\text{Beta}\big(h_m + \kappa I_0,\; u_m + \kappa (1 - I_0)\big)$ (Thompson sampling). Every injection logs the probability that $m$ was selected, so calibration and refits can reweight by inverse propensity. Rarely shown memories still collect evidence.

This log feeds $U(m)$, the FSRS refit, the channel weights $w_s$, and the threshold $\theta$.

## Part VI: Knowledge Graph (Associative Network)

### Entity-Relationship Model

$$
\mathcal{G} = (V, E, \psi_V, \psi_E), \qquad \psi_V: V \to \text{aliases and types}, \qquad \psi_E: E \to [0, 1]
$$

There is **no fixed entity cap**. Entities are deduplicated by entity resolution (for example, "TS" and "TypeScript" are merged). Edges carry validity intervals, just like facts.

### Weighted, Hub-Damped Personalized PageRank

$$
\pi_q = \alpha\, e_q + (1 - \alpha)\, \pi_q P, \qquad
P_{uv} = \frac{\psi_E(u, v) / \log(2 + \deg v)}{\sum_{v'} \psi_E(u, v') / \log(2 + \deg v')}, \qquad \alpha = 0.15
$$

- $e_q$ is the normalized indicator vector of the entities found in the query.
- **Edge weights are used** and high-degree hubs are damped, so a generic entity does not activate everything.
- $\pi_q$ is a probability distribution, so graph scores lie in $[0, 1]$ and no node is counted twice across depths.
- Approximate push-based PPR with tolerance $\epsilon_{\text{ppr}}$ touches $O\!\big(1 / (\alpha\, \epsilon_{\text{ppr}})\big)$ nodes, **independent of $\lvert V \rvert$**. The graph can therefore grow without a cap.

Memory score from the graph channel:

$$
S_{\text{graph}}(m, q) = \max_{e \in \text{ent}(m)} \pi_q(e)
$$

The graph is a **retrieval channel** over the same memories. It is not additional context capacity.

## Part VII: Dynamic Context Assembly

### Budget

The window $W$ is that of the model routed for the task (Part X). It is not a fixed constant:

$$
\lvert C(q) \rvert + W_{\text{out}} = \lvert C_{\text{system}} \rvert + \lvert C_{\text{goal}} \rvert + \lvert C_{\text{recent}} \rvert + \lvert C_{\text{mem}} \rvert + W_{\text{out}} \;\le\; W\big(\text{Model}(x)\big)
$$

$$
W_{\text{mem}} = W - \lvert C_{\text{system}} \rvert - \lvert C_{\text{goal}} \rvert - \lvert C_{\text{recent}} \rvert - W_{\text{out}}
$$

$W_{\text{out}}$ is reserved for the response. All sizes are counted with the routed model's own tokenizer and include a 5% safety margin for tokenizer drift.

**Floor.** $W_{\text{mem}}$ never drops below $W_{\text{mem}}^{\min} = \min(1\text{K},\, W/8)$. If the recent turns would push it lower, $C_{\text{recent}}$ is shrunk first (overflow handling, below). If $C_{\text{system}} + C_{\text{goal}} + W_{\text{out}} + W_{\text{mem}}^{\min}$ alone exceeds $W$, the request is routed to a model with a larger window, or rejected with an explicit error. It is never truncated silently.

### Selection as Budgeted Submodular Maximization

Instead of fixed per-source quotas, all sources (facts, episodes, graph, procedures, patterns, summary nodes) compete on **marginal value per token**:

$$
\max_{X \subseteq \text{Cand}(q)} F(X) = \sum_{m \in X} \text{score}(m, q) \;+\; \lambda \sum_{c \in \text{Cand}(q)} \text{score}(c, q)\, \max_{m \in X} \text{sim}(c, m)
\quad \text{s.t.} \quad \sum_{m \in X} \text{tok}(m) \le W_{\text{mem}}
$$

with $\lambda = 0.5$ and $\max_{m \in \emptyset} = 0$. The first term rewards relevance and the second rewards coverage. Similarity is lexical, consistent with the rest of the pipeline:

$$
\text{sim}(c, m) = \text{Jaccard}\big(\text{shingles}_3(c),\, \text{shingles}_3(m)\big) \in [0, 1]
$$

estimated with 128-permutation MinHash signatures computed at encoding time. Because $\text{sim} \ge 0$, $F$ is monotone submodular, so:
- Lazy greedy (take the better of the value-greedy and value-per-token-greedy solutions) guarantees $F(X) \ge \tfrac{1}{2}(1 - 1/e)\, F(X^*)$.
- Near-duplicates add almost no coverage, so the selected context is diverse automatically.

**Ordering.** The highest-scoring items are placed at the start and the end of the memory block, where models attend most reliably.

### Overflow Handling

There is no "compress the oldest" step. If $C_{\text{recent}}$ grows too large, older turns are replaced by their session summary node, and the original turns remain retrievable through the tree (lossless hierarchy, Part II).

## Part VIII: The Bounded-Context Recall Theorem

### Why Unbounded Storage Is Not Enough (Dilution Lemma)

Consider **flat** retrieval: one fixed top-$k$ list over all $N$ stored memories. Take a relevant memory $m^*$, and let $p > 0$ be the probability that a random distractor outscores it. The number of distractors ranked above $m^*$ is $\text{Bin}(N, p)$, so for $Np > k$ Hoeffding's inequality gives

$$
P\big(m^* \in \text{top-}k\big) = P\big(\text{Bin}(N, p) \le k - 1\big) \;\le\; \exp\!\left(-\frac{2\,(Np - k)^2}{N}\right) \xrightarrow[N \to \infty]{} 0 .
$$

**With flat top-$k$, recall goes to zero as history grows, even if nothing is ever deleted.** "Every relevant memory has a non-zero chance of retrieval" is therefore too weak to support any claim about long histories. Unbounded context needs **structure**: scoping, hierarchy, and budgeted selection.

### Assumptions

**Where the probability comes from.** Retrieval is deterministic for a fixed query, so every probability below is over a **query distribution** $\mathcal{Q}$ (the benchmark's sampled queries, or logged production traffic) and a gold memory $m$ drawn uniformly from $G_W(q)$, defined next.

**Budgeted gold set.** If the relevant memories do not all fit in the budget, no selector can deliver all of them. Recall is therefore measured against $G_W(q) \subseteq G(q)$, the annotator-prioritized gold memories that fit in $W_{\text{mem}}$:

$$
\text{Rec}_W(q) = \frac{\lvert G_W(q) \cap C(q) \rvert}{\lvert G_W(q) \rvert}, \qquad \sum_{m \in G_W(q)} \text{tok}(m) \le W_{\text{mem}}
$$

Each assumption names a quantity that is measured and published, not taken on faith:

| # | Assumption | Measured quantity |
|---|---|---|
| A1 | **Scoping.** Query $q$ searches only its scope $\Omega(q)$, of size $N_q = \sigma(q)\, N$. A gold memory falls outside the scope (wrong project, missing as-of mode) with probability at most $\varepsilon_\Omega$. | selectivity $\sigma$, scope miss rate $\varepsilon_\Omega$ |
| A2 | **Hierarchical routing.** $\Omega(q)$ is indexed by a summary tree with branching factor $b$, searched by beam search of width $B$ over each node's term sketch. At each level the subtree holding a given gold leaf drops out of the beam with probability at most $\varepsilon_B$. This is an assumption, not a consequence of the design: upper-level nodes summarize $N_q / b^{\ell}$ leaves, so $\varepsilon_B$ can grow with $N$ and must be measured at several $N$. Term sketches keep exact-term routing free of false negatives; misses come from vocabulary mismatch and beam competition. | per-level miss rate $\varepsilon_B$ at several $N$ |
| A3 | **Selection.** A gold memory that reaches the candidate set passes the calibrated cut-off and is selected into the budget with probability at least $1 - \varepsilon_S$. $\varepsilon_S$ depends on the budget, so it is measured separately for each $W_{\text{mem}}$ tier (4K, 32K, 200K). | selection miss rate $\varepsilon_S(W_{\text{mem}})$ |
| A4 | **Beam capacity.** $\lvert G_W(q) \rvert \le B$ for the queries in $\mathcal{Q}$, so the beam can hold a path to every gold leaf at once. Queries that need more are answered by multi-hop re-planning ($\mathcal{H} \to \mathcal{P}$, Part I). | share of queries with $\lvert G_W(q) \rvert > B$ |

### Main Theorem

**Knox-MS Bounded-Context Recall Theorem.** Under A1–A4, for every history length $N$ and every scope size $n$:

$$
\boxed{
\mathbb{E}_{q \sim \mathcal{Q}}\big[\text{Rec}_W(q) \mid N_q = n\big] \;\ge\; 1 - \varepsilon_\Omega - \varepsilon_S(W_{\text{mem}}) - \varepsilon_B \left\lceil \log_b n \right\rceil,
\qquad
\lvert C(q) \rvert + W_{\text{out}} \le W,
\qquad
\text{Route}(q) = O\!\left(B\, b\, \log_b n\right)
}
$$

**Proof.**

1. **Storage.** By the Storage Lemma (Part II), every memory in $\Omega(q)$ is retained and stays reachable from the tree in every tier (Reachability invariant, Part III).
2. **Losslessness.** Leaves are originals (Part II), so a gold leaf that is routed to is delivered at full fidelity. Losses from repeated summarization ($\beta^h$) do not apply. Summary quality enters only through $\varepsilon_B$.
3. **Scoping.** By A1, $P(m \notin \Omega(q)) \le \varepsilon_\Omega$.
4. **Routing.** The tree over $n$ leaves has depth $h = \lceil \log_b n \rceil$. A gold leaf $m \in \Omega(q)$ reaches the candidate set if its ancestor survives the beam at every level. By A2, A4, and a union bound over the $h$ levels, $P(m \in \Omega(q),\, m \notin \text{Cand}(q)) \le h\, \varepsilon_B$. No independence assumption is needed. Tree-routed leaves hold reserved candidate slots (Part V, Stage 4), so the other channels can only add candidates.
5. **Selection.** By A3 and another union bound, $P(m \notin C(q)) \le \varepsilon_\Omega + h\, \varepsilon_B + \varepsilon_S$.
6. **Recall.** $\mathbb{E}[\text{Rec}_W(q)]$ equals $P(m \in C(q))$ for $q \sim \mathcal{Q}$ and $m$ uniform in $G_W(q)$, by linearity of expectation. Step 5 gives the bound.
7. **Budget.** The selector in Part VII enforces $\lvert C(q) \rvert + W_{\text{out}} \le W$ by construction.
8. **Cost.** Each of the $h$ levels scores $B \cdot b$ sketches, so routing costs $O(B\, b\, h)$. Graph retrieval costs $O(1/(\alpha\, \epsilon_{\text{ppr}}))$, independent of $\lvert V \rvert$ (Part VI). ∎

If level failures are independent, the routing term tightens to $1 - (1 - \varepsilon_B)^h$.

### What the Theorem Says

| | Flat top-$k$ | Knox-MS |
|---|---|---|
| Recall as $N \to \infty$ | $\to 0$, decaying exponentially (Dilution Lemma) | $\ge 1 - \varepsilon_\Omega - \varepsilon_S - \varepsilon_B \lceil \log_b N_q \rceil$, decaying **logarithmically** |
| Context per call | $\le W - W_{\text{out}}$ | $\le W - W_{\text{out}}$ |
| Retrieval cost | $O(N)$ flat scan | $O(B\, b \log_b N_q)$ tree routing; lexical and ripgrep channels capped by early termination and time limits (Part V) |

The guarantee rests on the tree channel alone. The lexical, ripgrep, and graph channels improve recall in practice but are not needed for the bound.

**Worked example.** With $\varepsilon_B = 0.02$, $b = 8$, and $\varepsilon_\Omega = \varepsilon_S = 0$:

| $N_q$ | Depth $h$ | Recall bound |
|---|---|---|
| $10^3$ | 4 | 0.92 |
| $10^6$ | 7 | 0.86 |
| $10^9$ | 10 | 0.80 |

The bound becomes vacuous only when $h\,\varepsilon_B \ge 1$, that is, when $N_q \ge b^{1/\varepsilon_B} = 8^{50} \approx 10^{45}$ memories.

**The bound is only as strong as $\varepsilon_\Omega$, $\varepsilon_B$, $\varepsilon_S$, and $\sigma$.** These are measured on a recall-versus-$N$ scaling benchmark and published with each release. A measured curve that stays above the bound is empirical support for the theorem's assumptions. A curve that falls below it shows that at least one assumption is wrong.

### Answerable Horizon

A single headline number:

$$
H_\rho = \sup\big\{ L \;:\; \mathbb{E}[\text{Rec} \mid \text{fact age} = L] \ge \rho \big\}
$$

The answerable horizon $H_{0.85}$ is the age up to which facts are still recalled at least 85% of the time. It can be compared directly with full-context models and other memory systems.

### Measurement and Release Gate

Recall shows that the right memories reached the call. It does not show that the answer was right. Each release therefore publishes, and is gated on, both kinds of measurement:

| Measurement | How | Gate |
|---|---|---|
| Recall vs. $N$ | Synthetic histories at $N_q \in \{10^3, 10^4, 10^5, 10^6\}$ with planted gold facts; report $\varepsilon_\Omega$, per-level $\varepsilon_B$, $\varepsilon_S$ per budget tier, and $\text{Rec}_W$ | measured $\text{Rec}_W$ stays above the theorem's bound at every $N_q$ |
| Answer accuracy | LongMemEval and LoCoMo, plus a held-out set of anonymized production sessions | no regression against the previous release |
| Answerable horizon | $H_{0.85}$ on the same histories | no regression |
| Latency | p50 / p95 / p99 of retrieval and context assembly at each $N_q$ | p95 retrieval under 300 ms at $N_q = 10^6$ |
| Erasure | delete planted memories, then search every index, edge, and summary for their content | zero hits |

## Part IX: System Capacity Summary

### Complete System Statement

$$
\boxed{
\underbrace{C_{\text{addr}}(N) \xrightarrow[N \to \infty]{} \infty}_{\text{unbounded memory}}
\qquad
\underbrace{\lvert C(q) \rvert + W_{\text{out}} \le W}_{\text{bounded context}}
\qquad
\underbrace{\mathbb{E}[\text{Rec}_W(q)] \ge 1 - \varepsilon_\Omega - \varepsilon_S - \varepsilon_B \lceil \log_b N_q \rceil}_{\text{measured recall}}
}
$$

The knowledge graph and the lexical indexes (BM25, n-grams, ripgrep) are **retrieval channels over the same memories**. They are not added on top of storage as extra "capacity".

### Parameters (single source of truth)

These values replace all earlier parameters and apply to both Knox-MS and Memory Brain.

| Symbol | Meaning | Default | Refit from outcomes |
|---|---|---|---|
| $W$ | Window of the routed model | model-dependent | — |
| $W_{\text{mem}}$ | Memory budget inside the window | remainder (Part VII); local default 4K | per user |
| $W_{\text{mem}}^{\min}$ | Memory budget floor | $\min(1\text{K}, W/8)$ | — |
| $S_{\text{cat}}$ | Initial stability at $I_0 = 0.5$ | by category, 1–60 days | ✓ |
| $D_0$ | Initial difficulty and reversion target | 5 | ✓ |
| $F,\, c$ | Power-law forgetting | 19/81, 0.5 | ✓ |
| $a,\, \gamma,\, g$ | Stability gain | $e^{1.5}$, 0.2, 1 | ✓ |
| $\rho_{\max},\, S_{\min},\, S_{\max}$ | Stability caps | 10×, 0.1 d, 3650 d | — |
| $\kappa$ | Utility prior strength | 5 | — |
| $\omega$ | Unhelpful evidence per uncited injection | 0.1 | ✓ |
| $\theta_{\text{arch}}$ | Archive threshold on Value | 0.05 | — |
| $k_0$ | RRF constant | 60 | — |
| $w_s$ | Channel weights | 1 each | ✓ |
| $\eta_U,\, \eta_R$ | Prior modulation | 0.5, 0.3 | ✓ |
| $\theta$ | Calibrated $P(\text{helpful})$ cut-off | 0.35 | ✓ |
| $\alpha,\, \epsilon_{\text{ppr}}$ | PPR restart probability / push tolerance | 0.15, $10^{-4}$ | — |
| $b,\, B$ | Tree branching / beam width | 8, 4 | — |
| $\lambda$ | Coverage weight | 0.5 | ✓ |
| Candidates | Fused candidates before the calibrated cut-off, plus reserved tree slots | 50 + up to $B \cdot b$ | — |
| Exploration | Share of calls using Thompson-sampled $U$ / share of turns ablation-probed | 5%, 2% | — |

## Part X: Brain-Like Reasoning Workflow

### Task Orchestration Model

$$
\text{Task}(x) = \begin{cases}
\text{Coding}(x) & \text{if } \text{TaskType}(x) = \text{code} \\
\text{General}(x) & \text{otherwise}
\end{cases}
$$

**Model Selection by Difficulty:**

$$
\text{Model}(x) = \begin{cases}
\text{Easy} & \text{if } \delta(x) < 0.3 \\
\text{Medium} & \text{if } 0.3 \leq \delta(x) < 0.7 \\
\text{Hard} & \text{if } \delta(x) \geq 0.7
\end{cases}
$$

$\delta(x)$ is the task difficulty score from the Plan Model (distinct from the per-memory difficulty $D_m$ in Part IV). The selected model fixes the window $W = W(\text{Model}(x))$ used in Part VII, so the memory budget adapts to whichever model is routed. The *form* of the recall guarantee in Part VIII stays the same, but $\varepsilon_S$ is larger for smaller budgets, which is why it is measured per budget tier.

**Memory Update Loop:**

$$
\mathcal{M}_{t+1} = \phi_4\big(\mathcal{M}_t,\; \text{new\_memories}(t)\big) \;\oplus\; \text{attribution}(t), \qquad
\mathcal{M} \leftarrow \phi_7(\mathcal{M}) \;\text{ on schedule or when idle}
$$

Each turn reconciles new memories against existing ones ($\phi_4$) and records which memories helped ($\oplus$ attribution). Background consolidation ($\phi_7$) runs separately and refits the model. The memory improves with use instead of only growing.

## Revision Notes

Corrections relative to the previous version of this page:

| # | Previous issue | Correction |
|---|---|---|
| 1 | **The main theorem was a tautology.** $C_{\text{effective}} = \sum \lvert M_i \rvert / r_i \to \infty$ holds for any disk and says nothing about what the model can use in one call, which is always capped by the window. | Addressable, usable, and recalled context are separated. The theorem is now a recall bound under a fixed budget (Part VIII). |
| 2 | **Proof step 3 failed as history grew.** "$P(\text{retrieve} \mid \text{relevant}) > 0$" is too weak: with fixed top-$k$ and a growing store, that probability goes to 0. | The Dilution Lemma states this failure explicitly. Recall is now bounded through scoping, hierarchical routing, and selection, with measured error rates (A1–A4). |
| 3 | **Compression losses compounded.** If each summary keeps 90%, ten rounds keep ≈ 35%. The page assumed no loss. | Summaries are pointers. Originals are kept, and summary quality affects only routing accuracy $\varepsilon_B$ (Part II). |
| 4 | **Division by zero.** $S$ = access count gave $S = 0$ for every new memory in $R = e^{-\lambda t / S}$. | Stability $S_0 > 0$ per category, with power-law forgetting (Part IV). |
| 5 | **Unbounded importance and popularity runaway.** $I = I_0 R (1 + \alpha n)$ had no ceiling, and every retrieval raised it. | Bounded utility $U \in [0, 1]$ learned from outcomes. Strengthening happens only on *use*, never on retrieval (Part IV). |
| 6 | **Two conflicting decay models.** A 3%/day rate and hard-coded 24h / 7d / 90d tiers. | One model: tiers are derived from $R$ and Value, and age alone never deletes anything (Part IV). |
| 7 | **Two definitions of strength.** $S$ = access count vs. $S \mathrel{+}= 0.1$. | One stability update with a spacing effect and saturation (Part IV). |
| 8 | **Graph contradiction.** The proof assumed $\lvert \mathcal{G} \rvert \to \infty$, but Part VI capped entities at 5,000. The graph was also added as extra capacity ("$C_{\text{graph}} = \infty$"), counting the same memories twice. | No cap: PPR cost is independent of $\lvert V \rvert$. The graph is a retrieval channel, not capacity (Part VI). |
| 9 | **Inconsistent pipeline order.** The composition applied $\mathcal{P}$ before $\mathcal{T}$, the arrow diagram had $\mathcal{T}$ before $\mathcal{P}$ and omitted $\mathcal{A}$, and the boxed $\mathcal{O}(x)$ omitted both. | One order, $\mathcal{S} \to \mathcal{T} \to \mathcal{A} \to \mathcal{P} \to \mathcal{H} \to \mathcal{B}_g \to \mathcal{B}_s$, used everywhere (Part I). |
| 10 | **Scales did not match in the retrieval score.** Cosine, BM25, and an unbounded graph sum were added together, and importance and recency were *added*, so an important but irrelevant memory could outrank a relevant one. | Rank-based fusion (RRF) over BM25, ripgrep, graph, and tree. Priors multiply relevance within $[1, 1.95]$, so an irrelevant memory scores 0 (Part V). |
| 11 | An infinite "sensory stream" ($\lvert M_1 \rvert = \infty$) was counted as stored capacity. | $M_1$ and $M_2$ are per-turn and per-call buffers and are excluded from storage (Part II). |
| 12 | The cycle invariant ("at least one phase is active") guaranteed nothing. | Replaced by testable Budget, Reachability, and Losslessness invariants (Part III). |
| 13 | Fixed $W_{\max} = 100\text{K}$ disagreed with the API (configurable, e.g. 200K) and Memory Brain (4K). Top-$k$ (20 vs. 30) and thresholds (0.6 vs. 0.5) also differed. | $W$ comes from the routed model. One parameter table covers both systems (Part IX). |
| 14 | Neuroanatomy was presented as fact (working memory in the thalamus, long-term memory in the parietal lobe), with human timings (250 ms / 30 s / 1 h) as specs. | Labels are marked as inspiration. Working memory maps to the prefrontal cortex and long-term memory to the neocortex. Lifetimes use system units: turn, call, session (Parts I–II). |
| 15 | **Embeddings, a vector index, and `/v1/rerank` were treated as retrieval channels.** That stack is not used. | Encoding is lexical only. Channels are BM25 (with trigrams and synonyms), ripgrep, graph, and tree. The cut-off $\theta$ is calibrated on outcomes, not a neural rerank score (Part V). |
| 16 | **"Drifts down" had no mechanism.** Only explicit corrections raised $u_m$, so a memory injected forever and never cited kept its prior. | Uncited injections add $\omega = 0.1$ unhelpful evidence; ablation probes credit memories that help without being cited (Parts IV–V). |
| 17 | **The fusion cut could drop tree-routed leaves**, contradicting "other channels can only add candidates" in the proof. | Tree-routed leaves hold reserved candidate slots (Part V, Stage 4). |
| 18 | **Search cost was claimed as $O(\log N)$ for all channels.** BM25 postings and ripgrep scans grow linearly with $N$. | The logarithmic bound covers tree routing only; other channels have explicit cost limits (Parts V, VIII). |
| 19 | **$\varepsilon_B$ was argued to be independent of $N$**, although upper-level summaries cover more leaves as $N$ grows. | Stated as a measured assumption; routing uses descendant term sketches (Parts III, VIII). |
| 20 | **The theorem said "for every query"** while its probabilities only make sense over a query distribution, and it ignored scope misses and gold sets larger than the budget or beam. | Expectation over $\mathcal{Q}$, budgeted recall $\text{Rec}_W$, scope miss rate $\varepsilon_\Omega$, as-of mode, and beam-capacity assumption A4 (Parts V, VIII). |
| 21 | The Budget invariant $\lvert C(q) \rvert \le W$ ignored the reserved output $W_{\text{out}}$, and nothing handled a negative $W_{\text{mem}}$. | $\lvert C(q) \rvert + W_{\text{out}} \le W$ with a memory floor and explicit reroute or error (Parts III, VII). |
| 22 | Undefined pieces: $\text{sim}$ in the selector, $D_0$, how $I_0$ scales $S_0$, the calibration model, and cold start. Difficulty could only rise, and one use could multiply stability by about 78. | All defined; difficulty reverts to $D_0$; gain and stability are capped (Parts IV, V, VII). |
| 23 | Deletion, write concurrency, index freshness, and untrusted (tool or web) memories were not specified. | Deletion propagates to summaries and indexes; idempotent per-scope writes; Freshness and Erasure invariants; provenance-based trust (Parts II, III). |
| 24 | Symbols were reused: $R$ (retrievability and relevant set), $b$ (stability exponent and branching), $D$ (memory and task difficulty), $\phi$ (phases and edge weights). | Relevant set is $G(q)$, stability exponent is $\gamma$, task difficulty is $\delta(x)$, edge weights are $\psi_E$. |
| 25 | **Implementation clarifications** (no change to any bound). "Active" tier was not operationalised; trust was only ordered; the injection format was unspecified. | Active = memories of sessions touched within the last 30 minutes (`consolidate_active_session_minutes`). Trust only needs the order $\text{user} > \text{assistant} > \text{tool} > \text{external}$; the reference values are 1.0 / 0.7 / 0.4 / 0.2. Retrieved originals are injected verbatim as a quoted block of `[mem:<id>]` items in a user-role message (never the system prompt), and `[mem:<id>]` citations in the reply feed attribution (Parts IV–V). |

---

**Bounded context. Unbounded memory. Measured recall.**
