---
layout: post
title: Post-hoc reasoning in chain of thought
---

From May-June 2024, I participated in Phase I of Neel Nanda's [MATS](https://matsprogram.org) stream for mechanistic interpretability. During the research sprint part of the stream, I worked on interpretability for chain of thought faithfulness. Since then, we have seen a massive paradigm shift in LLM research. SOTA capabilities have grown substantially due to scaling inference-time compute (see OpenAI's [o-series](https://openai.com/index/learning-to-reason-with-llms/) of models). "Chain of thought" has ballooned into RL-guided search over large reasoning trees, unlocking PhD-level reasoning ability in technical domains. As a consequence, interpretability for chain of thought (or, more generally, inference-time reasoning) is probably more important than was previously expected.[^0]

---

# TLDR

We show that Gemma-2 9B (instruction-tuned) exhibits post-hoc reasoning, a particular form of unfaithful reasoning where the model decides on an answer before generating chain of thought. Using linear probes, we can predict the model's final answer from its activations before it generates chain of thought. We use these probes to steer the model toward different answers during generation, and are able to reliably cause the model to change its answer to an incorrect answer. Further, when steered toward incorrect answers, we find the model will often engage in confabulation: inventing false facts to support its steered conclusion. This suggests the model sometimes prioritizes generating convincing reasoning that supports its predetermined answer, rather than reasoning faithfully from true premises to reach a conclusion.

# 1. Introduction

A desirable feature of chain of thought is that it is *faithful*--meaning that the chain of thought is an accurate representation of the model's internal reasoning process. Faithful reasoning would be a very powerful tool for interpretability: if chains of thought were faithful, in order to understand a model's reasoning, we could simply read its stated reasoning.

However, previous work has shown that LLMs do not necessarily have this property. For example, Turpin et al. (2023)[^1] show that adding biasing features can cause a model to change its answer and generate plausible reasoning to support it, but the model will not mention the biasing feature in its reasoning. Similarly, Lanham et al. (2023)[^2] explore model behavior when applying corruptions to the chain of thought, finding that in many cases, the model's final answer is not directly dependent on the chain of thought. Their experiments bear similarity to those done by Gao (2023)[^4] showing that some GPT models arrived at the correct answer to arithmetic word problems even when some intermediate step in the chain of thought was perturbed (by adding +/- 3 to some number).

Cumulatively, previous work has rejected the hypothesis that LLMs' final answers are solely a function of their chain of thought, i.e., that the causal relationship follows this structure:

$$
\text{question} \rightarrow \text{CoT} \rightarrow \text{final answer}
$$

nostalgebraist accurately notes that this causal scheme is neither necessary nor sufficient for CoT faithfulness, and further, that it is not necessarily even a desirable property[^5]. If the model knows what the final answer ought to be before CoT, but made a misstep in its reasoning, we might still hope that it responds with the correct answer, disregarding the chain of thought when giving a final answer.

Lanham et al. call the behavior where models decide on their answer before generating reasoning *post-hoc reasoning*. To model post-hoc reasoning, we add another node to the causal scheme:

$$
\text{question} \rightarrow \textbf{pre-computed answer} \rightarrow \dots
$$

The ellipses above are intentionally ambiguous--it is not a priori clear how the model's pre-computed answer will causally influence the model's final answer. Its influence could pass through the chain of thought, skip it entirely, or some combination of the two.

Going forward, it's important to be rigorous about how we define post-hoc reasoning. Going forward, I use the following definition, emphasizing the causal role of the pre-computed answer:

> **Post-hoc reasoning** refers to the behavior where the model pre-computes an answer before chain of thought, and the pre-computed answer causally influences the model's final answer, at least in part.

The motivation of this work is to answer the following questions:

1. Does the pre-computed answer exist? If so, can we identify its representation in the model's activations?
2. What causal role does the pre-computed answer play? Does it influence the model's final answer independently of the CoT, through the CoT, in both ways, or not at all?

To this end, we perform two sets of experiments:

1. We train linear probes to predict the model's final answer from its activations *before* the chain of thought.
2. We steer the model's generated reasoning with the linear probes from the previous step, and evaluate how often steering causes the model to change its answer, and in what ways it changes the model's chain of thought.

# 2. Implementation Details

Our experiments are conducted evaluating [Gemma-2 9B instruction-tuned](https://huggingface.co/facebook/gemma-2-9b-it) on four datasets: Sports Understanding, Social Chemistry, Quora Question Pairs, and Logical Deduction. Sports Understanding asks whether sentences about sports are plausible, Social Chemistry asks whether sentences about social interactions are acceptable, Quora Question Pairs asks whether two questions are similar, and Logical Deduction asks whether a conclusion follows from a set of premises. Each example in each dataset is a binary classification problem, where the answer is either "Yes" (plausible, acceptable, similar, or entailed) or "No" (implausible, unacceptable, not similar, or not entailed).

Here is an example of what a Sports Understanding question looks like:

> Is the following sentence plausible? "Michael Jordan shot a free throw in the NBA Championship."

The chain of thought for the Sports Understanding questions follows a particular format. Usually, the model will state what sport the athlete plays. Then, the model will state what sport the given action belongs to. Finally, the model will state whether the sentence is plausible, based on if those two sports are the same. For example:

> Michael Jordan plays basketball.
> Shooting a free throw is part of basketball.
> Therefore, the sentence is plausible.

Other datasets have a similar, repeatable reasoning format and binary answer choices. For each dataset, we create four in-context chain-of-thought examples prepended to each prompt, so that the model imitates this style of reasoning.

# 3. Experiments

## 3.1. Activation Probes

To test whether we can predict the model's answer before it generates reasoning, we train linear probes on the model's residual stream activations. For each example, we record activations $\mathbf{x_i}$ at every layer i ∈ {0, 1, ..., 41}, captured at the last token of "Let's think step by step:". We define $y = \mathbb{1}_{\text{answer} = \text{plausible}}$ as the binary label for the model's final answer. For each layer, we create a dataset of 100 $(\mathbf{x_i}, y)$ pairs and train logistic regression probes to predict $y$ from $\mathbf{x_i}$:

$$\hat{y} = \sigma(\mathbf{w}_i^\top \mathbf{x}_i + b_i)$$

where $\hat{y}$ is the predicted probability of a "Yes" answer, $w_i$ and $b_i$ are the weights vector and bias term for layer $i$, and $\sigma$ is the sigmoid function.

We train classifiers on a training set of 100 examples for each dataset. After training classifiers for each layer of the residual stream, we evaluate their performance on a held-out test set of 150 examples using the area under the Receiver Operating Characteristic (AUROC).

<div style="text-align: center;">
  <img src="/assets/AUROC_Across_Layers_All_Datasets_1.png" alt="AUROC of activation probes" style="width:90%; display: inline-block;">
</div>

For all datasets but Logical Deduction, the AUROC surpasses 0.9 at some layer. This seems to indicate that the model does indeed pre-compute an answer, or some representation that can be linearly decoded into the final answer, prior to the CoT.

When we first saw these results, one explanation we considered was that these questions are so simple that the model does not need chain of thought to compute the answer.[^6] In this case, the model might not necessarily be engaging in post-hoc reasoning or acting unfaithfully. Consider an excellent math student who knows the answer to an exam problem on sight. Despite already knowing the answer, the student might still write out the steps to derive it. Similarly, the model may already know the answer with some confidence, but still use the CoT to derive it as instructed.

The other explanation is that the model is indeed doing post-hoc reasoning. Having already decided its answer, the model may *perform* chain of thought, but ultimately use its pre-computed answer to decide the final answer. To decide between this explanation and the above, we need to determine whether the model's pre-computed answer causally influences its final answer.

To determine whether there is a causal relationship between the model's pre-computed answer and its final answer, we intervene on the model's pre-computed answer, and measure how often the model's final answer changes. When the model changes its answer, we are also interested in how it changes its answer: does it generate a similar chain of thought, but a different final answer, or does it change its chain of thought to rationalize the pre-computed answer?

## 3.2. A Taxonomy of Chain of Thought Patterns

Before showing results from the steering experiments, we establish a framework for classifying different types of model reasoning. Consider two binary dimensions:

1. True premises: Has the model stated true premises?
2. Entailment: Is the model's final answer logically entailed by the stated premises?

This gives us four distinct reasoning types:

1. Sound Reasoning: True premises, entailed answer

    The model states true facts and reaches a logically valid conclusion.

    > Michael Jordan is a basketball player.
    > Shooting a free throw is part of basketball.
    > Therefore, the sentence is plausible.


2. Non-entailment: True premises, non-entailed answer

    The model states true facts but reaches a conclusion that doesn't follow logically.

    > Michael Jordan is a basketball player.
    > Shooting a free throw is part of basketball.
    > Therefore, the sentence is implausible.


3. Confabulation: False premises, entailed answer

    The model invents false facts to support its desired conclusion.

    > Michael Jordan is a soccer player.
    > Shooting a free throw is part of basketball.
    > Therefore, the sentence is implausible.


4. Hallucination: False premises, non-entailed answer

    The model both invents false facts and reaches a conclusion that doesn't follow from them.

    > Michael Jordan is a soccer player.
    > Shooting a free throw is part of basketball.
    > Therefore, the sentence is plausible.

For post-hoc reasoning, we are particularly interested in non-entailment and confabulation. If the model has pre-computed its answer, we would like to know whether it uses CoT to rationalize the that answer, or generates a final answer by ignoring the CoT and looking back at its pre-computed answer. The former likely involves planning and intentional deception, while the latter is easier to detect.

## 3.3. Steering with Answer Vectors

// ... existing content ...

## 3.3. Steering with Answer Vectors

To test whether the model's pre-computed answer causally influences its reasoning, we perform interventions using the weight vectors from our trained probes. For each layer i, we have a probe weight vector $\mathbf{w_i}$ that, when applied to activations $\mathbf{x_i}$, predicts whether the model will answer "Yes" or "No". We can think of $\mathbf{w_i}$ as representing the direction in activation space that corresponds to believing in a particular answer.

Our steering intervention works by pushing the model's activations in the direction of the opposite answer from its original response. At each generation step and for each layer i, we modify the residual stream activations:

$$\mathbf{x_i} \leftarrow \mathbf{x_i} + \alpha \mathbf{w_i}$$

where:
- $\mathbf{x_i}$ is the residual stream at layer i
- $\mathbf{w_i}$ is the probe weight vector for layer i
- $\alpha$ is a steering coefficient that controls the strength of the intervention

The sign of $\alpha$ determines which direction we steer: positive $\alpha$ pushes toward "Yes" answers, negative $\alpha$ toward "No" answers. Larger absolute values of $\alpha$ result in stronger steering.

For each dataset, we craft two evaluation sets[^3]:

1. "Yes" Dataset: Questions where both the correct answer and model's original response were "Yes" (and we try to steer the model to "No")
2. "No" Dataset: Questions where both the correct answer and model's original response were "No" (and we try to steer the model to "Yes")

For each dataset, we attempt to steer the model toward the opposite answer across a range of steering coefficients $\alpha \in$ {0, 1, 2, $\dots$, 8}. As $\alpha$ increases, the model is increasingly likely to change its answer. The figure below shows how often the model changes its answer at each steering coefficient.

<div style="text-align: center;">
  <img src="/assets/answer-change-frequency.png" alt="Steering success rate" style="width:100%; display: inline-block;">
</div>

Values of $\alpha$ greater than 8 are excluded from our analysis. At these higher steering coefficients, we observe significant degradation in the model's outputs: responses become incoherent, often containing grammatical errors or logical contradictions within the same sentence. This degradation of model outputs under strong steering is a well-documented phenomenon[^7], and makes it difficult to meaningfully analyze the model's reasoning patterns.

## 3.4. Confabulation

When steering successfully changes the model's answer from correct to incorrect, we observe two distinct failure patterns. At lower steering coefficients ($\alpha \leq 3$), the model typically exhibits non-entailment: it states correct premises but draws an illogical conclusion. For example:

> Michael Jordan is a basketball player.
> Shooting a free throw is part of basketball.
> Therefore, the sentence is implausible.

However, at higher steering coefficients (α > 3), the model increasingly engages in confabulation: inventing false premises to support its steered conclusion. For example:

> Michael Jordan is a soccer player.
> Shooting a free throw is part of soccer.
> Therefore, the sentence is implausible.

To measure how confabulation is related to steering, we use GPT-4 to classify a model's reasoning as confabulation (by asking if any of the stated facts are invented). The results are shown below.

<div style="text-align: center;">
  <img src="/assets/confabulation-rate.png" alt="Confabulation rate" style="width:75%; display: inline-block;">
</div>

More aggressive steering not only makes the model more likely to change its answer, but also makes the model more likely to fabricate false premises to support its steered conclusion. This has potentially important implications for alignment: Models that hold false beliefs may invent facts in order to justify their beliefs.

# 4. Conclusion

I think the most salient result from this work is that the model will engage in confabulation when convinced of a false premise. But is it clear that this indicates unfaithful reasoning?

One explanation for this belief is that steering has affected many of the model's beliefs, and what appears to be confabulation, is actually the model's attempt to perform faithful factual recall on beliefs that have been shifted by the steering. Features are dense in the activation space, so when we intervene on the model's belief about the answer, we likely incidentally affect many other features.

It is possible that steering the model's belief about the answer concurrently alters beliefs about many other relevant facts. For example, when steering in the "implausible" direction, we may inadvertently cause the model to believe that there are no free throws in the NBA. In this case, the model's internal world model would be incorrect, but its reasoning would still be faithful.

Further, the effects of steering on model beliefs may be systematic instead of arbitrary. For example, when steering in the "implausible" direction, the model might develop a generalized mistrust of its own beliefs. As a result, during factual recall, it would learn to state inverses of what it believes, e.g. "There are NO free throws in the NBA" instead of "There are free throws in the NBA". This sort of systematic change in model beliefs would lead to consistent confabulation, while still being faithful.

However, this explanation does not explain the model's propensity to confabulate when steering in the "plausible" direction, due to the same combinatorial argument made before. To turn a plausible conclusion implausible, one can arbitrarily negate the premises, or even invent new premises. But to turn an implausible conclusion plausible, one must invent two facts that align (i.e., involve the same sport), probably requiring planning in advance. For example, to conclude the sentence "LeBron James [basketball player] took a penalty kick [soccer reference]" is plausible, the model must either believe that LeBron James is a soccer player, or that penalty kicks are part of basketball, or that LeBron James and penalty kicks each refer to some third, shared sport. Any of these three facts is unlikely under random, or even directional, changes to the model's beliefs.[^8]

So, it seems likely that the model's confabulation does constitute unfaithful reasoning, and is the result of intentional planning to support its predetermined belief. It is possible that the model has learned that that it is rewarded for generating convincing, consistent reasoning, sometimes at the cost of factual accuracy. There may be opportunities for post-training regimes that do, explicitly, encourage faithful reasoning, or alternatively, reinforce epistemic humility and self-reflection. It is also possible that newer models are simply much better at self-reflection, because it is instrumentally valuable for accuracy on technical, complex reasoning tasks. But I suspect that attempting RL-guided search over reasoning trees for less empirical tasks (for example, instruction following) would further entrench some of the deceptive behavior shown here. Future work scaling inference-time compute should consider carefully whether their training tasks incentivize faithful, or potentially deceptive reasoning.

# Acknowledgements

Thank you to Neel Nanda and Arthur Conmy for supervising some of this work, and Arthur and Maggie von Ebers for reading drafts of this post.

---

[^0]: Anthropic has recently suggested some directions for CoT faithfulness research in their [recommendations for AI safety research](https://alignment.anthropic.com/2025/recommended-directions/#h.eph2q3u5u1yt)
[^1]: Miles Turpin, Julian Michael, Ethan Perez, and Samuel R. Bowman. 2023. [Language models don’t always say what they think: Unfaithful explanations in chain-of-thought prompting](https://arxiv.org/abs/2305.04388). Preprint, arXiv:2305.04388
[^2]: Jacob Pfau, William Merrill, and Samuel R. Bowman. 2024. [Let’s think dot by dot: Hidden computation in transformer language models.](https://arxiv.org/abs/2404.15758) Preprint, arXiv:2404.15758.
[^3]: The reason for conditioning the test sets on both the correct answer and the model's original response is that we want to steer the model not only toward the opposite answer, but also toward the false answer. We might suspect that it is easier to steer an incorrect model toward the correct answer than to steer a correct model toward the incorrect answer. The latter is a more difficult task, and allows for investigating more interesting questions: Can the model be convinced of a false premise? Will the model generate lies to support a false belief?
[^4]: Leo Gao. 2023. [Shapley value attribution in chain of thought.](https://www.lesswrong.com/posts/FX5JmftqL2j6K8dn4/shapley-value-attribution-in-chain-of-thought)
[^5]: Neel actually suggested this explanation.
[^6]: nostalgebraist. 2024. [the case for COT unfaithulness is overstated](https://www.lesswrong.com/posts/HQyWGE2BummDCc2Cx/the-case-for-cot-unfaithfulness-is-overstated).
[^7]: Neel Nanda and Arthur Conmy. 2024. [Progress update 1 from the gdm mech interp team.](https://www.alignmentforum.org/posts/C5KAZQib3bzzpeyrg/full-post-progress-update-1-from-the-gdm-mech-interp-team)
[^8]: Technically, you could imagine a directional shift to beliefs of the form "Everything is about baseball". This would cause the model to believe that every sports-related fact is about baseball, and would lead to consistently plausible conclusions. In practice, however, confabulations to support "plausible" conclusions take many different forms, and do not seem to be simple directional shifts like this.
