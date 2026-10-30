---
sidebar_position: 17
title: KMS 无限上下文定理
sidebar_label: KMS 无限上下文定理
description: 有界上下文、无界记忆、可度量召回。Knox-MS 以记忆为中心架构背后的形式化模型，附带可检验保证。
keywords: [knox, knox api, ai integration, knox-ms, unlimited context, context theorem, recall theorem, bounded context, brain-inspired, memory system, fsrs, neural architecture]
---

# KMS 无限上下文定理

**有界上下文，无界记忆，可度量召回。**

Knox-MS 让模型拥有不受上下文窗口限制的记忆视界。本页精确说明这意味着什么、不意味着什么，以及它所依赖的可测假设。架构从人类记忆借用结构：编码、巩固、检索与自适应遗忘。

:::info
修订后的定理：本页早期版本通过证明存储无界来“证明”无限上下文。这对任何磁盘都成立，却无法说明模型实际能用什么。所有修正见 [修订说明](#revision-notes)。
:::

## 「无限上下文」的含义

必须把三个量分开：

| 符号 | 含义 | 是否有界？ |
|---|---|---|
| $C_{\text{addr}}$ | **可寻址记忆**：存储的全部内容 | 否 |
| $C_{\text{use}}(q) = \lvert C(q) \rvert$ | **可用上下文**：针对查询 $q$ 实际放入一次模型调用的 token 数 | 是，始终 $\le W$（模型窗口） |
| $\text{Rec}(q) = \dfrac{\lvert R(q) \cap C(q) \rvert}{\lvert R(q) \rvert}$ | **召回**：相关记忆 $R(q)$ 中进入该次调用的比例 | 必须随历史增长保持较高 |

**Knox-MS 的主张：** 当历史长度 $N$ 无界增长时，召回保持在已知下界之上，可用上下文始终落在 $W$ 内，搜索代价仅随 $N$ 对数增长。

无界存储（$C_{\text{addr}} \to \infty$）是*必要但不充分*的。第八部分表明，仅有存储会使召回崩溃。

## Knox-MS（KMS）架构

### 核心原则：记忆作为中央编排器

所有处理都流经记忆系统 $\mathcal{H}$，并由仿脑阶段包裹：

$$
\boxed{
\mathcal{O}(x) = \mathcal{B}_s\Big(\mathcal{B}_g\Big(\mathcal{H}\Big(\mathcal{P}\Big(\mathcal{A}\Big(\mathcal{T}\big(\mathcal{S}(x)\big)\Big)\Big)\Big)\Big)\Big)
}
$$

脑区名称是*受神经科学启发*的标签，并非神经解剖模型。

## 第一部分：神经架构流

### 处理管线

本页各处使用同一顺序（框公式、箭头图与复合运算）：

$$
x \xrightarrow{\text{encode}} \mathcal{S} \xrightarrow{\text{filter}} \mathcal{T} \xrightarrow{\text{weight}} \mathcal{A} \xrightarrow{\text{plan}} \mathcal{P} \xrightarrow{\text{recall / store}} \mathcal{H} \xrightarrow{\text{procedure}} \mathcal{B}_g \xrightarrow{\text{generate}} \mathcal{B}_s \xrightarrow{\text{respond}} y
$$

其中：
- $\mathcal{S}$ = **感觉皮层**：输入处理（解析、嵌入、抽取实体）
- $\mathcal{T}$ = **丘脑**：中继与过滤（作用域与注意力）
- $\mathcal{A}$ = **杏仁核**：显著性加权（初始重要性 $I_0$）
- $\mathcal{P}$ = **前额叶皮层**：规划与任务分解
- $\mathcal{H}$ = **海马体**：记忆枢纽（检索、调和、存储）
- $\mathcal{B}_g$ = **基底神经节**：程序性记忆（习得工作流）
- $\mathcal{B}_s$ = **脑干**：输出生成
- $y$ = 最终响应

**完整神经传递函数：**

$$
\mathcal{N}(x, t) = \mathcal{B}_s \circ \mathcal{B}_g \circ \mathcal{H} \circ \mathcal{P} \circ \mathcal{A} \circ \mathcal{T} \circ \mathcal{S}(x, t)
$$

**反馈回路：**

$$
\mathcal{H} \to \mathcal{P} \;\;(\text{retrieved memory can trigger re-planning}), \quad
\mathcal{B}_s \to \mathcal{H} \;\;(\text{outcome attribution, Part V}), \quad
\mathcal{B}_s \to \mathcal{T} \;\;(\text{turn } t \text{ output is input at } t+1)
$$

## 第二部分：五级记忆层次

### 记忆层次模型

$$
\mathcal{M} = \{ M_1, M_2, M_3, M_4, M_5 \}
$$

| 级别 | 名称 | 寿命 | 容量 | 表示 | 启发自 |
|---|---|---|---|---|---|
| $M_1$ | 输入缓冲 | 一轮对话 | 当前消息与工具结果 | 原始 | 感觉皮层 |
| $M_2$ | 工作记忆 | 一次模型调用 | $\le W_{\text{mem}}$ tokens | 选中的记忆与草稿 | 前额叶皮层 |
| $M_3$ | 会话记忆 | 一次会话 | 会话转录 | 原始轮次与主题摘要 | 海马体 |
| $M_4$ | 长期记忆 | 直至被取代或遗忘 | 无界 | 事实、情节、摘要树（保留原文） | 新皮层 |
| $M_5$ | 程序性记忆 | 直至被取代或遗忘 | 无界 | 工作流与习得模式 | 基底神经节 |

$M_1$ 与 $M_2$ 是按轮、按调用的*缓冲*，不是存储，因此不计入存储量。

**存储引理。** 可寻址记忆

$$
C_{\text{addr}}(N) = \lvert M_3 \rvert + \lvert M_4 \rvert + \lvert M_5 \rvert
$$

随历史 $N$ 增长而无界增长。这对任何持久存储都成立。第八部分说明为何仅此不够。

### 无损层次：摘要是指针

每个摘要节点都保留指向其子节点的指针，一直到底层原始行。压缩从不删除原文。只有显式 `forget`、TTL 或隐私策略才会移除数据，并在审计日志中留下墓碑记录。

这一点为何重要：假设每轮摘要只保留信息的 $\beta$ 倍并丢弃原文。经过 $h$ 轮后只剩 $\beta^h$，例如 $0.9^{10} \approx 0.35$。在 Knox-MS 中，摘要用于**路由**搜索到正确的原文。进入上下文的是原文。因此摘要质量只影响路由准确率（第八部分中测为 $\varepsilon_B$），信息损失不会叠加。

## 第三部分：八阶段记忆循环

### 认知处理循环

$$
\Phi = \{ \phi_1, \phi_2, \phi_3, \phi_4, \phi_5, \phi_6, \phi_7, \phi_8 \}
$$

**阶段定义：**

1. **$\phi_1$：输入**。该轮进入缓冲。
   $$\phi_1(x_t) = \mathcal{S}(x_t) \to M_1$$

2. **$\phi_2$：编码**。嵌入、词法索引与实体抽取。
   $$\phi_2(x) = \big(E(x) \in \mathbb{R}^d,\; \text{terms}(x),\; \text{ent}(x)\big)$$

3. **$\phi_3$：工作记忆**。有预算的上下文组装（第七部分）。
   $$\phi_3(q) = \text{Select}\big(\text{Cand}(q),\, W_{\text{mem}}\big) \to M_2$$

4. **$\phi_4$：巩固**。写入时与同一作用域内现有有效事实调和。
   $$\phi_4(m) \in \{\text{ADD}, \text{UPDATE}, \text{SUPERSEDE}, \text{MERGE}, \text{NOOP}\} \to M_3, M_4$$
   被取代的事实会被关闭（设置有效期结束时间），而不是删除，因此更早的状态仍可查询。

5. **$\phi_5$：长期存储**。新叶子插入摘要节点之下。原文保留。
   $$\phi_5(m) = \text{insert}(m, \text{Tree}) \to M_4, M_5$$

6. **$\phi_6$：检索**。限定作用域、多通道、融合候选生成（第五部分）。
   $$\phi_6(q) = \text{Cand}(q) \subseteq \Omega(q)$$

7. **$\phi_7$：睡眠巩固**。后台维护：去重、扫描矛盾、维护摘要树、对过期向量重新嵌入，并根据结果重拟合参数。强化由*使用*驱动（第四部分）。低价值记忆被归档，而非删除。
   $$\phi_7(\mathcal{M}) = \text{refit} \circ \text{archive}_{\text{Value} < \theta_{\text{arch}}} \circ \text{tree} \circ \text{reconcile} \circ \text{dedup}(\mathcal{M})$$

8. **$\phi_8$：输出与归因**。作答，然后记录使用了哪些记忆以及它们是否有帮助。
   $$\phi_8(q) = \mathcal{B}_s\big(q, C(q)\big), \quad \text{then } \text{attribute}\big(C(q), y\big) \to \mathcal{H}$$

**循环不变量**（三项均可检验）：

$$
\begin{aligned}
&\textbf{Budget:} && \forall q:\; \lvert C(q) \rvert \le W \\
&\textbf{Reachability:} && \forall m \in \mathcal{M} \text{ not deleted}:\; m \text{ is reachable from at least one index (lexical, vector, graph, tree)} \\
&\textbf{Losslessness:} && \text{every leaf under a summary node is a retained original or a tombstone}
\end{aligned}
$$

## 第四部分：遗忘、稳定性与间隔重复

### 幂律遗忘曲线

每条记忆 $m$ 带有**稳定性** $S_m > 0$（单位：天）、**难度** $D_m \in [1, 10]$，以及 $t$，即自上次*有用*访问以来的时间：

$$
R(t, S) = \left(1 + F \cdot \frac{t}{S}\right)^{-c}, \qquad F = \tfrac{19}{81},\; c = 0.5 \quad\Longrightarrow\quad R(S, S) = 0.9
$$

- $R \in (0, 1]$ 是可提取性：该记忆仍值得被召回的估计概率。
- $S$ 有直接含义：**$R$ 降到 90% 所需的天数**。
- 幂律比指数更好地拟合人类遗忘数据，其长尾使古老但有价值的记忆不会崩溃。
- **不会除以零。** 新记忆以依赖类别的 $S_0 > 0$ 起步，并按初始重要性 $I_0 \in [0, 1]$ 缩放：

| 类别 | $S_0$（在 $I_0 = 0.5$ 时） |
|---|---|
| 情节轮次 | 1 天 |
| 事实、error_fix、code_pattern | 14 天 |
| 偏好、工作流 | 30 天 |
| 决策、project_context | 60 天 |

### 使用时强化（间隔效应）

记忆只有在**被注入一次调用并实际被使用**（被引用或被记功，见第五部分）时才会变强。仅被检索到是不够的：

$$
S' = S \cdot \Big(1 + a\,(11 - D)\, S^{-b} \big(e^{\,g(1 - R)} - 1\big)\Big), \qquad a = e^{1.5},\; b = 0.2,\; g = 1
$$

| 事件 | 更新 |
|---|---|
| 被使用且有帮助 | $S \leftarrow S'$（上式） |
| 被使用但被反驳或有害 | $S \leftarrow 0.3\,S$，$\; D \leftarrow \min(10, D + 1)$ |
| 被检索但未使用 | 不变 |

性质：
- **间隔效应。** 增益因子 $e^{g(1-R)} - 1$ 在 $R \approx 1$ 时接近 0，因此一分钟内访问十次几乎不加分。即将被遗忘时被唤醒的记忆增益最大。
- **饱和。** $S^{-b}$ 使强记忆增长更慢，单次使用因子至多为 $1 + a \cdot 10 \cdot S^{-b}(e^{g} - 1)$。
- **不会因流行度失控。** 仅检索永远不会强化记忆，因此记忆不能仅因被检索到而自我强化。

默认值是标准 FSRS 风格的起始值。Knox-MS 根据归因日志按用户重拟合（第五部分）。

### 有界效用与价值

初始重要性 $I_0$ 成为「该记忆被注入时是否有帮助」这一学习估计的先验：

$$
U(m) = \frac{h_m + \kappa\, I_0(m)}{h_m + u_m + \kappa} \in [0, 1], \qquad \kappa = 5
$$

$$
\boxed{\text{Value}(m, t) = R(t, S_m) \cdot U(m) \in [0, 1]}
$$

其中 $h_m$ 与 $u_m$ 分别统计 $m$ 有帮助与无帮助的注入次数。与 $I_0 \cdot R \cdot (1 + \alpha n)$ 不同，Value **有界**且**自我校正**：经常被检索但从不帮忙的记忆会向下漂移。

### 由同一模型导出的层级

所有层级转换都来自同一 $R$ 与 Value。没有单独的衰减率，也没有单独硬编码的年龄阈值：

| 层级 | 规则 | 存储 |
|---|---|---|
| Active | 在当前会话的工作集中 | 内存（RAM） |
| Hot | $R \ge 0.9$ | 完整保真，全部索引 |
| Warm | $0.7 \le R < 0.9$ | 完整保真 |
| Cold | $0.3 \le R < 0.7$ | 树中摘要，原文保留 |
| Frozen | $R < 0.3$ 或 $\text{Value} < \theta_{\text{arch}}$ | 压缩归档，按需可达 |
| Deleted | 仅显式 `forget`、TTL 或隐私策略 | 审计日志中的墓碑 |

**算例。** 一条 $S_0 = 1$ 天且无强化的情节轮次，**1 天**后离开 Hot，约 **4.4 天**后离开 Warm，约 **43 天**后进入 Cold：

$$
R = 0.7 \Rightarrow t = \left(0.7^{-2} - 1\right)\tfrac{81}{19} \approx 4.4\text{ d}, \qquad
R = 0.3 \Rightarrow t = \left(0.3^{-2} - 1\right)\tfrac{81}{19} \approx 43\text{ d}
$$

一条 $S_0 = 60$ 天的决策会在 Hot 停留两个月，每次有用访问都会把所有边界向外推移。仅凭年龄永远不会删除任何内容。

## 第五部分：多策略检索

### 第一阶段：限定作用域的候选通道

每个查询只搜索其**作用域** $\Omega(q)$：匹配的用户、项目与会话、查询时刻仍有效的事实，以及未被取代的内容。记 $N_q = \lvert \Omega(q) \rvert$。

四个通道各自在 $\Omega(q)$ 上返回一个排序列表：

| 通道 $s$ | 排序信号 |
|---|---|
| lexical | 词项上的 BM25 |
| semantic | 余弦相似度 $\dfrac{E(q) \cdot E(m)}{\lVert E(q) \rVert\, \lVert E(m) \rVert}$ |
| graph | 个性化 PageRank（第六部分） |
| tree | 摘要树上的束搜索（第八部分） |

### 第二阶段：无标度融合

通道分数处于不同量纲（余弦在 $[-1, 1]$，BM25 在 $[0, \infty)$，图分数大小任意），因此**绝不直接相加**。只组合秩，使用倒数秩融合（Reciprocal Rank Fusion）：

$$
\text{rel}(m, q) = \sum_{s} \frac{w_s}{k_0 + \text{rank}_s(m)}, \qquad k_0 = 60
$$

未返回 $m$ 的通道贡献 0。通道权重 $w_s$ 起始为 1，并根据结果重拟合。

### 第三阶段：先验调制相关性

效用与可提取性与查询无关。因此它们**缩放**相关性，而不是与之竞争：

$$
\boxed{
\text{score}(m, q) = \text{rel}(m, q) \cdot \big(1 + \eta_U\, U(m)\big) \cdot \big(1 + \eta_R\, R(t, S_m)\big), \qquad \eta_U = 0.5,\; \eta_R = 0.3
}
$$

**相关性主导性质。** 因为先验因子落在 $[1,\, (1 + \eta_U)(1 + \eta_R)] = [1,\, 1.95]$：
- $\text{rel}(m, q) = 0 \Rightarrow \text{score}(m, q) = 0$，因此无关记忆绝不会因为重要或新近而被选中。
- $m$ 能排在 $m'$ 之上，仅当 $\text{rel}(m, q) > \text{rel}(m', q) / 1.95$。

### 第四阶段：重排序与校准阈值

融合后的前 50 个候选在可用时由交叉编码器（`/v1/rerank`）重排序。截断阈值 $\theta$ 根据归因日志**校准**，使其表示 $P(\text{helpful} \mid m, q) \ge \theta$，而不是原始相似度值。

### 结果归因（闭合回路）

每次调用，Knox-MS 记录注入了哪些记忆以及它们是否有帮助：

| 信号 | 效果 |
|---|---|
| 模型引用 `[mem:id]` 且该轮成功（被接受、测试通过、无纠正） | $h_m \mathrel{+}= 1$，第四部分中的有用访问 |
| 下一轮用户纠正了被引用的记忆 | $u_m \mathrel{+}= 1$，第四部分中的有害更新 |
| 已注入、未被引用 | 仅计入校准 |

该日志供给 $U(m)$、FSRS 重拟合、通道权重 $w_s$ 与阈值 $\theta$。

## 第六部分：知识图谱（联想网络）

### 实体-关系模型

$$
\mathcal{G} = (V, E, \phi_V, \phi_E), \qquad \phi_V: V \to \mathbb{R}^d, \qquad \phi_E: E \to [0, 1]
$$

**没有固定实体上限。** 实体通过实体消解去重（例如「TS」与「TypeScript」合并）。边与事实一样带有效区间。

### 加权、枢纽阻尼的个性化 PageRank

$$
\pi_q = \alpha\, e_q + (1 - \alpha)\, \pi_q P, \qquad
P_{uv} = \frac{\phi_E(u, v) / \log(2 + \deg v)}{\sum_{v'} \phi_E(u, v') / \log(2 + \deg v')}, \qquad \alpha = 0.15
$$

- $e_q$ 是查询中发现的实体的归一化指示向量。
- **使用边权重**并对高自由度枢纽阻尼，因此通用实体不会激活一切。
- $\pi_q$ 是概率分布，因此图分数落在 $[0, 1]$，没有节点会在不同深度被重复计数。
- 容差为 $\epsilon$ 的近似基于 push 的 PPR 触及 $O\!\big(1 / (\alpha \epsilon)\big)$ 个节点，**与 $\lvert V \rvert$ 无关**。因此图可以无上限增长。

图通道给出的记忆分数：

$$
S_{\text{graph}}(m, q) = \max_{e \in \text{ent}(m)} \pi_q(e)
$$

图是同一批记忆上的**检索通道**，不是额外的上下文容量。

## 第七部分：动态上下文组装

### 预算

窗口 $W$ 是为该任务路由到的模型的窗口（第十部分）。它不是固定常数：

$$
\lvert C(q) \rvert = \lvert C_{\text{system}} \rvert + \lvert C_{\text{goal}} \rvert + \lvert C_{\text{recent}} \rvert + \lvert C_{\text{mem}} \rvert \;\le\; W\big(\text{Model}(x)\big)
$$

$$
W_{\text{mem}} = W - \lvert C_{\text{system}} \rvert - \lvert C_{\text{goal}} \rvert - \lvert C_{\text{recent}} \rvert - W_{\text{out}}
$$

$W_{\text{out}}$ 预留给响应。

### 选择作为有预算的次模最大化

不再使用固定的按来源配额，所有来源（事实、情节、图、程序、模式、摘要节点）按**每 token 边际价值**竞争：

$$
\max_{X \subseteq \text{Cand}(q)} F(X) = \sum_{m \in X} \text{score}(m, q) \;+\; \lambda \sum_{c \in \text{Cand}(q)} \text{score}(c, q)\, \max_{m \in X} \text{sim}(c, m)
\quad \text{s.t.} \quad \sum_{m \in X} \text{tok}(m) \le W_{\text{mem}}
$$

其中 $\lambda = 0.5$，且 $\max_{m \in \emptyset} = 0$。第一项奖励相关性，第二项奖励覆盖。$F$ 是单调次模的，因此：
- 懒惰贪心（取价值贪心与每 token 价值贪心两者中较好的）保证 $F(X) \ge \tfrac{1}{2}(1 - 1/e)\, F(X^*)$。
- 近重复几乎不增加覆盖，因此选出的上下文会自动多样化。

**排序。** 得分最高的条目放在记忆块的开头和末尾，模型在这些位置注意力最可靠。

### 溢出处理

没有「压缩最旧内容」这一步。如果 $C_{\text{recent}}$ 过大，较旧轮次由其会话摘要节点替代，原始轮次仍可通过树检索（无损层次，第二部分）。

## 第八部分：有界上下文召回定理

### 为何无界存储不够（稀释引理）

考虑**扁平**检索：在全部 $N$ 条已存记忆上取固定 top-$k$ 列表。取一条相关记忆 $m^*$，令 $p > 0$ 为随机干扰项得分超过它的概率。排在 $m^*$ 之上的干扰项数为 $\text{Bin}(N, p)$，因此当 $Np > k$ 时，Hoeffding 不等式给出

$$
P\big(m^* \in \text{top-}k\big) = P\big(\text{Bin}(N, p) \le k - 1\big) \;\le\; \exp\!\left(-\frac{2\,(Np - k)^2}{N}\right) \xrightarrow[N \to \infty]{} 0 .
$$

**在扁平 top-$k$ 下，即使从不删除任何内容，召回也会随历史增长趋于零。** 因此「每条相关记忆都有非零检索机会」太弱，无法支撑关于长历史的任何主张。无界上下文需要**结构**：作用域限定、层次与有预算的选择。

### 假设

每条假设都点名一个被测量并发布的量，而不是凭信仰接受：

| # | 假设 | 测量量 |
|---|---|---|
| A1 | **作用域限定。** 查询 $q$ 只搜索其作用域 $\Omega(q)$，大小为 $N_q = \sigma(q)\, N$。 | 选择率 $\sigma$ |
| A2 | **层次路由。** $\Omega(q)$ 由分支因子为 $b$ 的摘要树索引，以宽度 $B$ 的束搜索检索。在每一层，持有给定相关叶子的子树以至多 $\varepsilon_B$ 的概率掉出束。每层只比较 $B \cdot b$ 个节点，因此 $\varepsilon_B$ 取决于摘要质量而非 $N$。 | 若干 $N$ 下的逐层漏检率 $\varepsilon_B$ |
| A3 | **选择。** 到达候选集的相关记忆以至少 $1 - \varepsilon_S$ 的概率被选入预算。 | 选择漏检率 $\varepsilon_S$ |

### 主定理

**Knox-MS 有界上下文召回定理。** 在 A1–A3 下，对每个查询 $q$ 与每个历史长度 $N$：

$$
\boxed{
\mathbb{E}\big[\text{Rec}(q)\big] \;\ge\; 1 - \varepsilon_S - \varepsilon_B \left\lceil \log_b N_q \right\rceil,
\qquad
\lvert C(q) \rvert \le W,
\qquad
\text{Search}(q) = O\!\left(B\, b\, \log_b N_q\right)
}
$$

**证明。**

1. **存储。** 由存储引理（第二部分），$\Omega(q)$ 中的每条记忆都被保留，且从树可达（可达性不变量，第三部分）。
2. **无损性。** 叶子是原文（第二部分），因此被路由到的相关叶子以完整保真交付。重复摘要带来的损失（$\beta^h$）不适用。摘要质量只通过 $\varepsilon_B$ 进入。
3. **路由。** $N_q$ 片叶子上的树深度为 $h = \lceil \log_b N_q \rceil$。相关叶子 $m$ 到达候选集，当且仅当其祖先在每一层都存活于束中。由 A2 并对 $h$ 层取并界，$P(m \notin \text{Cand}(q)) \le h\, \varepsilon_B$。不需要独立性假设。其他通道（第五部分）只能增加候选。
4. **选择。** 由 A3 再取并界，$P(m \notin C(q)) \le \varepsilon_S + h\, \varepsilon_B$。
5. **召回。** $\text{Rec}(q)$ 是对 $m \in R(q)$ 的 $\mathbb{1}[m \in C(q)]$ 的平均。由期望的线性性，$\mathbb{E}[\text{Rec}(q)] \ge 1 - \varepsilon_S - h\, \varepsilon_B$。
6. **预算。** 第七部分的选择器从构造上强制 $\lvert C(q) \rvert \le W$。
7. **代价。** $h$ 层中每层给 $B \cdot b$ 个节点打分，因此路由代价为 $O(B\, b\, h)$。图检索代价为 $O(1/(\alpha\epsilon))$，与 $\lvert V \rvert$ 无关（第六部分）。∎

若层失败相互独立，路由项收紧为 $1 - (1 - \varepsilon_B)^h$。

### 定理在说什么

| | 扁平 top-$k$ | Knox-MS |
|---|---|---|
| $N \to \infty$ 时的召回 | $\to 0$，指数衰减（稀释引理） | $\ge 1 - \varepsilon_S - \varepsilon_B \lceil \log_b N_q \rceil$，**对数**衰减 |
| 每次调用的上下文 | $\le W$ | $\le W$ |
| 搜索代价 | $O(N)$，或带召回损失的 ANN | $O(\log N_q)$ |

**算例。** 取 $\varepsilon_B = 0.02$，$b = 8$ 且 $\varepsilon_S = 0$：

| $N_q$ | 深度 $h$ | 召回下界 |
|---|---|---|
| $10^3$ | 4 | 0.92 |
| $10^6$ | 7 | 0.86 |
| $10^9$ | 10 | 0.80 |

该下界仅在 $h\,\varepsilon_B \ge 1$ 时变得空洞，即当 $N_q \ge b^{1/\varepsilon_B} = 8^{50} \approx 10^{45}$ 条记忆时。

**下界的强度仅取决于 $\varepsilon_B$、$\varepsilon_S$ 与 $\sigma$。** 这些量在召回相对 $N$ 的缩放基准上测量，并随每次发布公布。测得的平坦曲线是本定理的经验证明。下降曲线将证伪它。

### 可回答视界

一个头条数字：

$$
H_\rho = \sup\big\{ L \;:\; \mathbb{E}[\text{Rec} \mid \text{fact age} = L] \ge \rho \big\}
$$

可回答视界 $H_{0.85}$ 是事实仍能以至少 85% 被召回的最大年龄。它可以直接与全上下文模型及其他记忆系统比较。

## 第九部分：系统容量总结

### 完整系统陈述

$$
\boxed{
\underbrace{C_{\text{addr}}(N) \xrightarrow[N \to \infty]{} \infty}_{\text{unbounded memory}}
\qquad
\underbrace{\lvert C(q) \rvert \le W}_{\text{bounded context}}
\qquad
\underbrace{\mathbb{E}[\text{Rec}(q)] \ge 1 - \varepsilon_S - \varepsilon_B \lceil \log_b N_q \rceil}_{\text{measured recall}}
}
$$

知识图谱与向量索引是同一批记忆上的**检索通道**。它们不是叠加在存储之上的额外「容量」。

### 参数（单一事实来源）

这些值取代所有早期参数，同时适用于 Knox-MS 与 Memory Brain。

| 符号 | 含义 | 默认值 | 是否根据结果重拟合 |
|---|---|---|---|
| $W$ | 被路由模型的窗口 | 取决于模型 | — |
| $W_{\text{mem}}$ | 窗口内的记忆预算 | 余量（第七部分）；本地默认 4K | 按用户 |
| $S_0$ | 初始稳定性 | 按类别，1–60 天 | ✓ |
| $F,\, c$ | 幂律遗忘 | 19/81, 0.5 | ✓ |
| $a,\, b,\, g$ | 稳定性增益 | $e^{1.5}$, 0.2, 1 | ✓ |
| $\kappa$ | 效用先验强度 | 5 | — |
| $\theta_{\text{arch}}$ | Value 的归档阈值 | 0.05 | — |
| $k_0$ | RRF 常数 | 60 | — |
| $w_s$ | 通道权重 | 各为 1 | ✓ |
| $\eta_U,\, \eta_R$ | 先验调制 | 0.5, 0.3 | ✓ |
| $\theta$ | 校准后的 $P(\text{helpful})$ 截断 | 0.35 | ✓ |
| $\alpha$ | PPR 重启概率 | 0.15 | — |
| $b,\, B$ | 树分支 / 束宽 | 8, 4 | — |
| $\lambda$ | 覆盖权重 | 0.5 | ✓ |
| Candidates | 重排序前的融合候选数 | 50 | — |

## 第十部分：类脑推理工作流

### 任务编排模型

$$
\text{Task}(x) = \begin{cases}
\text{Coding}(x) & \text{if } \text{TaskType}(x) = \text{code} \\
\text{General}(x) & \text{otherwise}
\end{cases}
$$

**按难度选择模型：**

$$
\text{Model}(x) = \begin{cases}
\text{Easy} & \text{if } D(x) < 0.3 \\
\text{Medium} & \text{if } 0.3 \leq D(x) < 0.7 \\
\text{Hard} & \text{if } D(x) \geq 0.7
\end{cases}
$$

$D(x)$ 是规划模型给出的难度分数。所选模型确定第七部分使用的窗口 $W = W(\text{Model}(x))$。因此记忆预算随被路由的模型适配，而第八部分的召回保证保持不变。

**记忆更新循环：**

$$
\mathcal{M}_{t+1} = \phi_7\Big(\phi_4\big(\mathcal{M}_t,\; \text{new\_memories}(t)\big) \;\oplus\; \text{attribution}(t)\Big)
$$

每轮将新记忆与现有记忆调和（$\phi_4$），并记录哪些记忆有帮助（$\oplus$ 归因）。随后后台巩固（$\phi_7$）重拟合模型。记忆随使用改进，而不仅仅增长。

## 修订说明 {#revision-notes}

相对本页上一版本的修正：

| # | 先前问题 | 修正 |
|---|---|---|
| 1 | **主定理是同义反复。** $C_{\text{effective}} = \sum \lvert M_i \rvert / r_i \to \infty$ 对任何磁盘都成立，却无法说明模型在一次调用中能用什么——那始终受窗口限制。 | 把可寻址、可用与被召回的上下文分开。定理现在是固定预算下的召回下界（第八部分）。 |
| 2 | **证明第 3 步随历史增长而失效。** "$P(\text{retrieve} \mid \text{relevant}) > 0$" 太弱：在固定 top-$k$ 与不断增长的存储下，该概率趋于 0。 | 稀释引理明确陈述这一失效。召回现在通过作用域限定、层次路由与选择来界定，并带有测量误差率（A1–A3）。 |
| 3 | **压缩损失叠加。** 若每份摘要保留 90%，十轮后约剩 35%。该页却假设无损失。 | 摘要是指针。原文保留，摘要质量只影响路由准确率 $\varepsilon_B$（第二部分）。 |
| 4 | **除以零。** $S$ = 访问次数导致每条新记忆在 $R = e^{-\lambda t / S}$ 中 $S = 0$。 | 按类别给出稳定性 $S_0 > 0$，并采用幂律遗忘（第四部分）。 |
| 5 | **无界重要性与流行度失控。** $I = I_0 R (1 + \alpha n)$ 没有上限，且每次检索都提升它。 | 有界效用 $U \in [0, 1]$ 从结果中学习。强化只发生在*使用*时，从不发生在检索时（第四部分）。 |
| 6 | **两套冲突的衰减模型。** 每天 3% 的速率与硬编码的 24h / 7d / 90d 层级。 | 一套模型：层级由 $R$ 与 Value 导出，仅凭年龄永远不删除任何内容（第四部分）。 |
| 7 | **强度的两种定义。** $S$ = 访问次数 vs. $S \mathrel{+}= 0.1$。 | 一套带间隔效应与饱和的稳定性更新（第四部分）。 |
| 8 | **图的矛盾。** 证明假设 $\lvert \mathcal{G} \rvert \to \infty$，但第六部分把实体上限设为 5,000。图还被加为额外容量（"$C_{\text{graph}} = \infty$"），把同一批记忆算了两次。 | 无上限：PPR 代价与 $\lvert V \rvert$ 无关。图是检索通道，不是容量（第六部分）。 |
| 9 | **管线顺序不一致。** 复合运算在 $\mathcal{T}$ 之前应用 $\mathcal{P}$，箭头图则是 $\mathcal{T}$ 在 $\mathcal{P}$ 之前并省略了 $\mathcal{A}$，框中的 $\mathcal{O}(x)$ 两者都省略了。 | 同一顺序 $\mathcal{S} \to \mathcal{T} \to \mathcal{A} \to \mathcal{P} \to \mathcal{H} \to \mathcal{B}_g \to \mathcal{B}_s$，各处通用（第一部分）。 |
| 10 | **检索分数的量纲不匹配。** 余弦、BM25 与无界图求和被直接相加，重要性与新近性被*相加*，因此一条重要但无关的记忆可以压过相关记忆。 | 基于秩的融合（RRF）。先验在 $[1, 1.95]$ 内乘以相关性，因此无关记忆得分为 0（第五部分）。 |
| 11 | 无限「感觉流」（$\lvert M_1 \rvert = \infty$）被计为存储容量。 | $M_1$ 与 $M_2$ 是按轮、按调用的缓冲，排除在存储之外（第二部分）。 |
| 12 | 循环不变量（「至少一个阶段处于活动」）什么也不保证。 | 替换为可检验的预算、可达性与无损性不变量（第三部分）。 |
| 13 | 固定 $W_{\max} = 100\text{K}$ 与 API（可配置，例如 200K）及 Memory Brain（4K）不一致。Top-$k$（20 vs. 30）与阈值（0.6 vs. 0.5）也不同。 | $W$ 来自被路由的模型。一张参数表覆盖两个系统（第九部分）。 |
| 14 | 神经解剖被当作事实呈现（工作记忆在丘脑、长期记忆在顶叶），并以人类时间尺度（250 ms / 30 s / 1 h）作为规格。 | 标签标明为启发。工作记忆对应前额叶皮层，长期记忆对应新皮层。寿命使用系统单位：轮、调用、会话（第一–二部分）。 |

---

**有界上下文。无界记忆。可度量召回。**
