---
slug: kms-unlimited-formula
title: "KMS Unlimited Context Theorem — Revised"
image: /img/kms-formula.png
authors: [knox]
tags: [knoxchat, api, ai, context, rag, update]
description: Bounded context, unbounded memory, measured recall. The Knox-MS theorem is rewritten so the claim is about usable recall, not disk size.
---

# KMS Unlimited Context Theorem — Revised

**Bounded context. Unbounded memory. Measured recall.**

The [KMS Unlimited Context Theorem](/knox-ms-unlimited-formula) has a new revision. An earlier version of that page “proved” unlimited context by showing that storage is unbounded. That is true of any disk and says nothing about what a model can use in one call.

This revision states the claim that actually matters: as history grows, **recall stays above a known bound**, usable context stays inside the model window, and search cost grows only logarithmically.

<!-- truncate -->

![Knox-MS Bounded-Context Recall Theorem](/img/kms-formula.png)

## Storage is not usable context

Three quantities have to stay apart:

| Symbol | Meaning | Bounded? |
|---|---|---|
| $C_{\text{addr}}$ | Addressable memory: everything stored | No |
| $C_{\text{use}}(q) = \lvert C(q) \rvert$ | Usable context: tokens placed in one model call for query $q$ | Always $\le W$ |
| $\text{Rec}(q)$ | Recall: fraction of the relevant memories $R(q)$ that reach the call | Must stay high as $N$ grows |

Unbounded storage ($C_{\text{addr}} \to \infty$) is necessary but not sufficient. Flat top-$k$ over a growing store drives recall to zero. That is the Dilution Lemma in [Part VIII](/knox-ms-unlimited-formula#part-viii-the-bounded-context-recall-theorem).

## The theorem

Under scoping, hierarchical routing, and budgeted selection (A1–A3), for every query $q$ and every history length $N$:

$$
\mathbb{E}\big[\text{Rec}(q)\big] \;\ge\; 1 - \varepsilon_S - \varepsilon_B \left\lceil \log_b N_q \right\rceil,
\qquad
\lvert C(q) \rvert \le W,
\qquad
\text{Search}(q) = O\!\left(B\, b\, \log_b N_q\right)
$$

Recall decays **logarithmically** in the scoped store size $N_q$, not exponentially. Context per call stays inside the routed model window. Search cost is $O(\log N_q)$.

A worked example with $\varepsilon_B = 0.02$, $b = 8$, and $\varepsilon_S = 0$:

| $N_q$ | Depth $h$ | Recall bound |
|---|---|---|
| $10^3$ | 4 | 0.92 |
| $10^6$ | 7 | 0.86 |
| $10^9$ | 10 | 0.80 |

The bound is only as strong as the measured miss rates $\varepsilon_B$, $\varepsilon_S$, and the scope selectivity $\sigma$. Those numbers are published with each release. A flat recall-versus-$N$ curve is the empirical proof. A falling curve would falsify it.

## Why the previous page failed

The old write-up treated “we can store more” as “the model can use more.” Several consequences followed from that mix-up, and they are all listed in [Revision notes](/knox-ms-unlimited-formula#revision-notes). The ones that change the claim:

1. **The main theorem was a tautology.** $C_{\text{effective}} \to \infty$ holds for any disk. Addressable, usable, and recalled context are now separate. The theorem is a recall bound under a fixed budget.
2. **“A relevant memory has a non-zero chance of retrieval” is too weak.** With fixed top-$k$ and a growing store, that probability goes to 0. The Dilution Lemma states this. Structure — scoping, a summary tree, and budgeted selection — is what keeps recall from collapsing.
3. **Compression losses compounded.** If each summary kept 90% and discarded the originals, ten rounds would leave about 35%. Summaries are now pointers. Originals stay, and summary quality enters only as the routing miss rate $\varepsilon_B$.
4. **Retrieval scores lived on different scales.** Cosine, BM25, and an unbounded graph sum were added together, and importance was added on top, so an important but irrelevant memory could outrank a relevant one. Fusion is rank-based (RRF) over BM25, ripgrep, graph, and tree. Priors multiply relevance; an irrelevant memory scores 0.
5. **Embeddings, a vector index, and `/v1/rerank` were treated as channels.** That stack is not used. Encoding is lexical. The cut-off $\theta$ is calibrated on outcomes.

Other corrections in the same revision: FSRS-style stability with $S_0 > 0$ (no division by zero); bounded utility learned from use, never from retrieval alone; one decay model instead of a 3%/day rate plus hard-coded age tiers; no 5,000-entity graph cap, and the graph is a retrieval channel rather than extra capacity; one pipeline order; $M_1$ and $M_2$ are buffers, not stored capacity; $W$ comes from the routed model.

## What “unlimited context” means now

Knox-MS still gives a model a memory horizon that is not limited by its context window. That does **not** mean the window itself grows. It means:

- every retained memory stays reachable
- the memories that matter for $q$ still reach the call with high probability as $N$ grows
- the call itself stays inside $W$
- the cost of finding those memories grows like $\log N_q$

The one headline number is the **answerable horizon** $H_{0.85}$: the age up to which facts are still recalled at least 85% of the time. It can be compared directly with full-context models and other memory systems.

[**Read the full theorem →**](/knox-ms-unlimited-formula)
