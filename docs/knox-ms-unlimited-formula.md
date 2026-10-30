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
  Note Revised theorem: An earlier version of this page "proved" unlimited context by showing that storage is unbounded. That holds for any disk and says nothing about what a model can use. Every correction is listed in [Revision notes](#revision-notes).
:::

## What "unlimited context" means

Three quantities must be kept apart:

| Symbol | Meaning | Bounded? |
|---|---|---|
| $C_{\text{addr}}$ | **Addressable memory**: everything stored | No |
| $C_{\text{use}}(q) = \lvert C(q) \rvert$ | **Usable context**: tokens actually placed in one model call for query $q$ | Yes, always $\le W$ (the model window) |
| $\text{Rec}(q) = \dfrac{\lvert R(q) \cap C(q) \rvert}{\lvert R(q) \rvert}$ | **Recall**: fraction of the relevant memories $R(q)$ that reach the call | Must stay high as history grows |

**The Knox-MS claim:** as the history $N$ grows without bound, recall stays above a known bound, usable context stays within $W$, and search cost grows only logarithmically in $N$.

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

Why this matters: suppose each round of summarization kept a fraction $\beta$ of the information and discarded the originals. After $h$ rounds only $\beta^h$ would remain, for example $0.9^{10} \approx 0.35$. In Knox-MS, summaries are used to **route** a search toward the right originals. The originals are what enter the context. Summary quality therefore affects only routing accuracy (measured as $\varepsilon_B$ in Part VIII), and information loss does not compound.

## Part III: 8-Phase Memory Cycle

### The Cognitive Processing Cycle

$$
\Phi = \{ \phi_1, \phi_2, \phi_3, \phi_4, \phi_5, \phi_6, \phi_7, \phi_8 \}
$$

**Phase Definitions:**

1. **$\phi_1$: Input**. The turn enters the buffer.
   $$\phi_1(x_t) = \mathcal{S}(x_t) \to M_1$$

2. **$\phi_2$: Encoding**. Lexical indexing (BM25 terms, n-grams, ripgrep-ready text) and entity extraction. There is no embedding vector.
   $$\phi_2(x) = \big(\text{terms}(x),\; \text{ngrams}(x),\; \text{ent}(x)\big)$$

3. **$\phi_3$: Working Memory**. Budgeted context assembly (Part VII).
   $$\phi_3(q) = \text{Select}\big(\text{Cand}(q),\, W_{\text{mem}}\big) \to M_2$$

4. **$\phi_4$: Consolidation**. Write-time reconciliation against existing valid facts in the same scope.
   $$\phi_4(m) \in \{\text{ADD}, \text{UPDATE}, \text{SUPERSEDE}, \text{MERGE}, \text{NOOP}\} \to M_3, M_4$$
   A superseded fact is closed (its validity end time is set), not deleted, so earlier states stay queryable.

5. **$\phi_5$: Long-Term Storage**. The new leaf is inserted under a summary node. The original is kept.
   $$\phi_5(m) = \text{insert}(m, \text{Tree}) \to M_4, M_5$$

6. **$\phi_6$: Retrieval**. Scoped, multi-channel, fused candidate generation (Part V).
   $$\phi_6(q) = \text{Cand}(q) \subseteq \Omega(q)$$

7. **$\phi_7$: Sleep Consolidation**. Background maintenance: deduplicate, scan for contradictions, maintain the summary tree, refresh lexical indexes (BM25, n-grams, ripgrep corpus), and refit parameters from outcomes. Strengthening is driven by *use* (Part IV). Low-value memories are archived, not deleted.
   $$\phi_7(\mathcal{M}) = \text{refit} \circ \text{archive}_{\text{Value} < \theta_{\text{arch}}} \circ \text{tree} \circ \text{reconcile} \circ \text{dedup}(\mathcal{M})$$

8. **$\phi_8$: Output and Attribution**. Respond, then log which memories were used and whether they helped.
   $$\phi_8(q) = \mathcal{B}_s\big(q, C(q)\big), \quad \text{then } \text{attribute}\big(C(q), y\big) \to \mathcal{H}$$

**Cycle Invariants** (all three are testable):

$$
\begin{aligned}
&\textbf{Budget:} && \forall q:\; \lvert C(q) \rvert \le W \\
&\textbf{Reachability:} && \forall m \in \mathcal{M} \text{ not deleted}:\; m \text{ is reachable from at least one index (lexical, ripgrep, graph, tree)} \\
&\textbf{Losslessness:} && \text{every leaf under a summary node is a retained original or a tombstone}
\end{aligned}
$$

## Part IV: Forgetting, Stability & Spaced Repetition

### Power-Law Forgetting Curve

Every memory $m$ carries a **stability** $S_m > 0$ (in days), a **difficulty** $D_m \in [1, 10]$, and $t$, the time since its last *useful* access:

$$
R(t, S) = \left(1 + F \cdot \frac{t}{S}\right)^{-c}, \qquad F = \tfrac{19}{81},\; c = 0.5 \quad\Longrightarrow\quad R(S, S) = 0.9
$$

- $R \in (0, 1]$ is the retrievability: the estimated probability that the memory is still worth recalling.
- $S$ has a direct meaning: **the number of days until $R$ falls to 90%**.
- A power law fits human forgetting data better than an exponential, and its long tail keeps old but valuable memories from collapsing.
- **No division by zero.** New memories start with a category-dependent $S_0 > 0$, scaled by initial importance $I_0 \in [0, 1]$:

| Category | $S_0$ (at $I_0 = 0.5$) |
|---|---|
| episodic turn | 1 day |
| fact, error_fix, code_pattern | 14 days |
| preference, workflow | 30 days |
| decision, project_context | 60 days |

### Strengthening on Use (Spacing Effect)

A memory gets stronger only when it was **injected into a call and actually used** (cited or credited, see Part V). Being retrieved is not enough:

$$
S' = S \cdot \Big(1 + a\,(11 - D)\, S^{-b} \big(e^{\,g(1 - R)} - 1\big)\Big), \qquad a = e^{1.5},\; b = 0.2,\; g = 1
$$

| Event | Update |
|---|---|
| Used and helpful | $S \leftarrow S'$ (above) |
| Used but contradicted or harmful | $S \leftarrow 0.3\,S$, $\; D \leftarrow \min(10, D + 1)$ |
| Retrieved but not used | no change |

Properties:
- **Spacing effect.** The gain factor $e^{g(1-R)} - 1$ is near 0 when $R \approx 1$, so ten accesses in one minute add almost nothing. A memory revived just before being forgotten gains the most.
- **Saturation.** $S^{-b}$ makes strong memories grow more slowly, and the per-use factor is at most $1 + a \cdot 10 \cdot S^{-b}(e^{g} - 1)$.
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

Here $h_m$ and $u_m$ count the injections in which $m$ was helpful and unhelpful. Unlike $I_0 \cdot R \cdot (1 + \alpha n)$, Value is **bounded** and **self-correcting**: a memory that is retrieved often but never helps drifts down.

### Tiers Derived from One Model

All tier transitions come from the same $R$ and Value. There is no separate decay rate and no separate hard-coded age thresholds:

| Tier | Rule | Storage |
|---|---|---|
| Active | in the current session's working set | memory (RAM) |
| Hot | $R \ge 0.9$ | full fidelity, all indexes |
| Warm | $0.7 \le R < 0.9$ | full fidelity |
| Cold | $0.3 \le R < 0.7$ | summarized in the tree, originals kept |
| Frozen | $R < 0.3$ or $\text{Value} < \theta_{\text{arch}}$ | compressed archive, reachable on demand |
| Deleted | only an explicit `forget`, a TTL, or a privacy policy | tombstone in the audit log |

**Worked example.** An episodic turn with $S_0 = 1$ day and no reinforcement leaves Hot after **1 day**, Warm after **≈ 4.4 days**, and Cold after **≈ 43 days**:

$$
R = 0.7 \Rightarrow t = \left(0.7^{-2} - 1\right)\tfrac{81}{19} \approx 4.4\text{ d}, \qquad
R = 0.3 \Rightarrow t = \left(0.3^{-2} - 1\right)\tfrac{81}{19} \approx 43\text{ d}
$$

A decision with $S_0 = 60$ days stays Hot for two months, and each useful access pushes every boundary further out. Age alone never deletes anything.

## Part V: Multi-Strategy Retrieval

### Stage 1: Scoped Candidate Channels

Each query searches only its **scope** $\Omega(q)$: the matching user, project, and session, facts valid at query time, and nothing superseded. Write $N_q = \lvert \Omega(q) \rvert$.

Four channels each return a ranked list over $\Omega(q)$. There is no embedding model, vector index, or neural reranker:

| Channel $s$ | Ranking signal |
|---|---|
| lexical | BM25 over terms, with trigram fuzzy overlap and rule-based synonyms |
| ripgrep | exact, regex, and identifier hits over stored text and project files |
| graph | Personalized PageRank (Part VI) |
| tree | beam search over the summary tree (Part VIII) |

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

### Stage 4: Calibrated Threshold

The top 50 fused candidates are cut by $\theta$. The cut-off is **calibrated** on the attribution log so that it means $P(\text{helpful} \mid m, q) \ge \theta$, instead of a raw BM25 or ripgrep score. Relevance stays the fused lexical / ripgrep / graph / tree rank; nothing is re-scored by an embedding or rerank model.

### Outcome Attribution (closes the loop)

For every call, Knox-MS logs which memories were injected and whether they helped:

| Signal | Effect |
|---|---|
| Model cites `[mem:id]` and the turn succeeds (accepted, tests pass, no correction) | $h_m \mathrel{+}= 1$, useful access in Part IV |
| Next user turn corrects a cited memory | $u_m \mathrel{+}= 1$, harmful update in Part IV |
| Injected, not cited | counted for calibration only |

This log feeds $U(m)$, the FSRS refit, the channel weights $w_s$, and the threshold $\theta$.

## Part VI: Knowledge Graph (Associative Network)

### Entity-Relationship Model

$$
\mathcal{G} = (V, E, \phi_V, \phi_E), \qquad \phi_V: V \to \text{aliases and types}, \qquad \phi_E: E \to [0, 1]
$$

There is **no fixed entity cap**. Entities are deduplicated by entity resolution (for example, "TS" and "TypeScript" are merged). Edges carry validity intervals, just like facts.

### Weighted, Hub-Damped Personalized PageRank

$$
\pi_q = \alpha\, e_q + (1 - \alpha)\, \pi_q P, \qquad
P_{uv} = \frac{\phi_E(u, v) / \log(2 + \deg v)}{\sum_{v'} \phi_E(u, v') / \log(2 + \deg v')}, \qquad \alpha = 0.15
$$

- $e_q$ is the normalized indicator vector of the entities found in the query.
- **Edge weights are used** and high-degree hubs are damped, so a generic entity does not activate everything.
- $\pi_q$ is a probability distribution, so graph scores lie in $[0, 1]$ and no node is counted twice across depths.
- Approximate push-based PPR with tolerance $\epsilon$ touches $O\!\big(1 / (\alpha \epsilon)\big)$ nodes, **independent of $\lvert V \rvert$**. The graph can therefore grow without a cap.

Memory score from the graph channel:

$$
S_{\text{graph}}(m, q) = \max_{e \in \text{ent}(m)} \pi_q(e)
$$

The graph is a **retrieval channel** over the same memories. It is not additional context capacity.

## Part VII: Dynamic Context Assembly

### Budget

The window $W$ is that of the model routed for the task (Part X). It is not a fixed constant:

$$
\lvert C(q) \rvert = \lvert C_{\text{system}} \rvert + \lvert C_{\text{goal}} \rvert + \lvert C_{\text{recent}} \rvert + \lvert C_{\text{mem}} \rvert \;\le\; W\big(\text{Model}(x)\big)
$$

$$
W_{\text{mem}} = W - \lvert C_{\text{system}} \rvert - \lvert C_{\text{goal}} \rvert - \lvert C_{\text{recent}} \rvert - W_{\text{out}}
$$

$W_{\text{out}}$ is reserved for the response.

### Selection as Budgeted Submodular Maximization

Instead of fixed per-source quotas, all sources (facts, episodes, graph, procedures, patterns, summary nodes) compete on **marginal value per token**:

$$
\max_{X \subseteq \text{Cand}(q)} F(X) = \sum_{m \in X} \text{score}(m, q) \;+\; \lambda \sum_{c \in \text{Cand}(q)} \text{score}(c, q)\, \max_{m \in X} \text{sim}(c, m)
\quad \text{s.t.} \quad \sum_{m \in X} \text{tok}(m) \le W_{\text{mem}}
$$

with $\lambda = 0.5$ and $\max_{m \in \emptyset} = 0$. The first term rewards relevance and the second rewards coverage. $F$ is monotone submodular, so:
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

Each assumption names a quantity that is measured and published, not taken on faith:

| # | Assumption | Measured quantity |
|---|---|---|
| A1 | **Scoping.** Query $q$ searches only its scope $\Omega(q)$, of size $N_q = \sigma(q)\, N$. | selectivity $\sigma$ |
| A2 | **Hierarchical routing.** $\Omega(q)$ is indexed by a summary tree with branching factor $b$, searched by beam search of width $B$. At each level the subtree holding a given relevant leaf drops out of the beam with probability at most $\varepsilon_B$. Each level compares only $B \cdot b$ nodes, so $\varepsilon_B$ depends on summary quality and not on $N$. | per-level miss rate $\varepsilon_B$ at several $N$ |
| A3 | **Selection.** A relevant memory that reaches the candidate set is selected into the budget with probability at least $1 - \varepsilon_S$. | selection miss rate $\varepsilon_S$ |

### Main Theorem

**Knox-MS Bounded-Context Recall Theorem.** Under A1–A3, for every query $q$ and every history length $N$:

$$
\boxed{
\mathbb{E}\big[\text{Rec}(q)\big] \;\ge\; 1 - \varepsilon_S - \varepsilon_B \left\lceil \log_b N_q \right\rceil,
\qquad
\lvert C(q) \rvert \le W,
\qquad
\text{Search}(q) = O\!\left(B\, b\, \log_b N_q\right)
}
$$

**Proof.**

1. **Storage.** By the Storage Lemma (Part II), every memory in $\Omega(q)$ is retained and stays reachable from the tree (Reachability invariant, Part III).
2. **Losslessness.** Leaves are originals (Part II), so a relevant leaf that is routed to is delivered at full fidelity. Losses from repeated summarization ($\beta^h$) do not apply. Summary quality enters only through $\varepsilon_B$.
3. **Routing.** The tree over $N_q$ leaves has depth $h = \lceil \log_b N_q \rceil$. A relevant leaf $m$ reaches the candidate set if its ancestor survives the beam at every level. By A2 and a union bound over the $h$ levels, $P(m \notin \text{Cand}(q)) \le h\, \varepsilon_B$. No independence assumption is needed. The other channels (Part V) can only add candidates.
4. **Selection.** By A3 and another union bound, $P(m \notin C(q)) \le \varepsilon_S + h\, \varepsilon_B$.
5. **Recall.** $\text{Rec}(q)$ is the average over $m \in R(q)$ of $\mathbb{1}[m \in C(q)]$. By linearity of expectation, $\mathbb{E}[\text{Rec}(q)] \ge 1 - \varepsilon_S - h\, \varepsilon_B$.
6. **Budget.** The selector in Part VII enforces $\lvert C(q) \rvert \le W$ by construction.
7. **Cost.** Each of the $h$ levels scores $B \cdot b$ nodes, so routing costs $O(B\, b\, h)$. Graph retrieval costs $O(1/(\alpha\epsilon))$, independent of $\lvert V \rvert$ (Part VI). ∎

If level failures are independent, the routing term tightens to $1 - (1 - \varepsilon_B)^h$.

### What the Theorem Says

| | Flat top-$k$ | Knox-MS |
|---|---|---|
| Recall as $N \to \infty$ | $\to 0$, decaying exponentially (Dilution Lemma) | $\ge 1 - \varepsilon_S - \varepsilon_B \lceil \log_b N_q \rceil$, decaying **logarithmically** |
| Context per call | $\le W$ | $\le W$ |
| Search cost | $O(N)$ flat scan | $O(\log N_q)$ inverted-index + tree routing |

**Worked example.** With $\varepsilon_B = 0.02$, $b = 8$ and $\varepsilon_S = 0$:

| $N_q$ | Depth $h$ | Recall bound |
|---|---|---|
| $10^3$ | 4 | 0.92 |
| $10^6$ | 7 | 0.86 |
| $10^9$ | 10 | 0.80 |

The bound becomes vacuous only when $h\,\varepsilon_B \ge 1$, that is, when $N_q \ge b^{1/\varepsilon_B} = 8^{50} \approx 10^{45}$ memories.

**The bound is only as strong as $\varepsilon_B$, $\varepsilon_S$ and $\sigma$.** These are measured on a recall-versus-$N$ scaling benchmark and published with each release. A flat measured curve is the empirical proof of this theorem. A falling curve would falsify it.

### Answerable Horizon

A single headline number:

$$
H_\rho = \sup\big\{ L \;:\; \mathbb{E}[\text{Rec} \mid \text{fact age} = L] \ge \rho \big\}
$$

The answerable horizon $H_{0.85}$ is the age up to which facts are still recalled at least 85% of the time. It can be compared directly with full-context models and other memory systems.

## Part IX: System Capacity Summary

### Complete System Statement

$$
\boxed{
\underbrace{C_{\text{addr}}(N) \xrightarrow[N \to \infty]{} \infty}_{\text{unbounded memory}}
\qquad
\underbrace{\lvert C(q) \rvert \le W}_{\text{bounded context}}
\qquad
\underbrace{\mathbb{E}[\text{Rec}(q)] \ge 1 - \varepsilon_S - \varepsilon_B \lceil \log_b N_q \rceil}_{\text{measured recall}}
}
$$

The knowledge graph and the lexical indexes (BM25, n-grams, ripgrep) are **retrieval channels over the same memories**. They are not added on top of storage as extra "capacity".

### Parameters (single source of truth)

These values replace all earlier parameters and apply to both Knox-MS and Memory Brain.

| Symbol | Meaning | Default | Refit from outcomes |
|---|---|---|---|
| $W$ | Window of the routed model | model-dependent | — |
| $W_{\text{mem}}$ | Memory budget inside the window | remainder (Part VII); local default 4K | per user |
| $S_0$ | Initial stability | by category, 1–60 days | ✓ |
| $F,\, c$ | Power-law forgetting | 19/81, 0.5 | ✓ |
| $a,\, b,\, g$ | Stability gain | $e^{1.5}$, 0.2, 1 | ✓ |
| $\kappa$ | Utility prior strength | 5 | — |
| $\theta_{\text{arch}}$ | Archive threshold on Value | 0.05 | — |
| $k_0$ | RRF constant | 60 | — |
| $w_s$ | Channel weights | 1 each | ✓ |
| $\eta_U,\, \eta_R$ | Prior modulation | 0.5, 0.3 | ✓ |
| $\theta$ | Calibrated $P(\text{helpful})$ cut-off | 0.35 | ✓ |
| $\alpha$ | PPR restart probability | 0.15 | — |
| $b,\, B$ | Tree branching / beam width | 8, 4 | — |
| $\lambda$ | Coverage weight | 0.5 | ✓ |
| Candidates | Fused candidates before the calibrated cut-off | 50 | — |

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
\text{Easy} & \text{if } D(x) < 0.3 \\
\text{Medium} & \text{if } 0.3 \leq D(x) < 0.7 \\
\text{Hard} & \text{if } D(x) \geq 0.7
\end{cases}
$$

$D(x)$ is the difficulty score from the Plan Model. The selected model fixes the window $W = W(\text{Model}(x))$ used in Part VII. The memory budget therefore adapts to whichever model is routed, while the recall guarantee in Part VIII stays the same.

**Memory Update Loop:**

$$
\mathcal{M}_{t+1} = \phi_7\Big(\phi_4\big(\mathcal{M}_t,\; \text{new\_memories}(t)\big) \;\oplus\; \text{attribution}(t)\Big)
$$

Each turn reconciles new memories against existing ones ($\phi_4$) and records which memories helped ($\oplus$ attribution). Background consolidation ($\phi_7$) then refits the model. The memory improves with use instead of only growing.

## Revision Notes

Corrections relative to the previous version of this page:

| # | Previous issue | Correction |
|---|---|---|
| 1 | **The main theorem was a tautology.** $C_{\text{effective}} = \sum \lvert M_i \rvert / r_i \to \infty$ holds for any disk and says nothing about what the model can use in one call, which is always capped by the window. | Addressable, usable, and recalled context are separated. The theorem is now a recall bound under a fixed budget (Part VIII). |
| 2 | **Proof step 3 failed as history grew.** "$P(\text{retrieve} \mid \text{relevant}) > 0$" is too weak: with fixed top-$k$ and a growing store, that probability goes to 0. | The Dilution Lemma states this failure explicitly. Recall is now bounded through scoping, hierarchical routing, and selection, with measured error rates (A1–A3). |
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

---

**Bounded context. Unbounded memory. Measured recall.**
