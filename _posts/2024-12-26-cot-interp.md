---
layout: post
title: Post-hoc reasoning in chain of thought
---

From May-June 2024, I participated in Phase I of Neel Nanda's [MATS](https://matsprogram.org) stream for mechanistic interpretability. During the research sprint part of the stream, I worked on interpretability for chain of thought faithfulness. Since then, we have seen a massive paradigm shift in LLM research. SOTA capabilities have grown substantially due to scaling inference-time compute (see OpenAI's [o-series](https://openai.com/index/learning-to-reason-with-llms/) of models). "Chain of thought" has ballooned into RL-guided search over large reasoning trees, unlocking PhD-level reasoning ability in technical domains. As a consequence, interpretability for chain of thought (or, more generally, inference-time reasoning) is probably more important than was previously expected. While my experiments were not conducted using this new generation of models, I believe they are still relevant to the new paradigm.

---

# 1. Introduction

A desirable feature of chain of thought is that it is faithful. By faithful, we mean that the chain of thought is an accurate representation of the model's internal reasoning process. Faithful reasoning would be a powerful tool for interpretability: to understand a model's reasoning, we could simply read its chain of thought. However, previous work has shown that models are often unfaithful. For example, Turpin et al. (2023) show that biasing features can cause a model to change its answer, but the model will not mention the biasing feature in its reasoning.[^1] Additionally, Pfau et al. (2024) show that LLMs can use meaningless filler tokens instead of chain of thought to improve performance, suggesting that at least some of the improvement attributed to chain of thought is independent of the model's stated reasoning.[^2]

We consider one particular mode of unfaithful chain of thought: post-hoc reasoning. Post-hoc reasoning refers to reasoning that is generated after the model has decided upon an answer. We ask two questions:

1. Can we predict a model's answer before it generates reasoning? To this end we train linear probes to predict the model's answer from its activations *before* the chain of thought.

2. Do interventions on the predicted answers causally affect the generated reasoning? To this end, we steer the model's generated reasoning with the linear probes from the previous step.

# 2. Implementation Details

Our experiments are conducted evaluating [Gemma 7B instruction-tuned](https://huggingface.co/facebook/gemma-7b-it) on the Sports Understanding dataset from BigBench Hard. The Sports Understanding dataset asks questions like the following:

> Is the following sentence plausible? "Devin Booker shot a free throw in the NBA Championship."

The chain of thought for these questions follows a particular format. Usually, the model will state what sport the athlete plays. Then, the model will state what sport the given action belongs to. Finally, the model will state whether the sentence is plausible, based on if those two sports are the same. For example:

> Devin Booker plays basketball.
> Shooting a free throw is part of basketball.
> Therefore, the sentence is plausible.

We give five in-context chain-of-thought examples that follow this format in each prompt, so that the model imitates this style of reasoning.

# 3. Experiments

## 3.1. Linear Probing

To test whether we can predict the model's answer before it generates reasoning, we train linear probes on the model's residual stream activations. For each example, we record activations $x_i$ at every layer i ∈ {0, 1, ..., 27}, captured at the last token of "Let's think step by step:". We define $y = \mathbb{1}_{\text{answer} = \text{plausible}}$ as the binary label for the model's final answer. For each layer, we create a dataset of 200 $(x_i, y)$ pairs and train logistic regression probes to predict $y$ from $x_i$:

$$\hat{y} = \sigma(w_i^\top x_i + b_i)$$

where $\hat{y}$ is the predicted probability of a plausible answer, $w_i$ and $b_i$ are the weights vector and bias term for layer $i$, and $\sigma$ is the sigmoid function.

After training classifiers on each layer of the residual stream, we evaluate their performance on a held-out test set of 100 examples using the area under the Receiver Operating Characteristic (AUROC). The best classifier is trained on the activations at layer 17 and achieves an AUROC of 0.797.

<div style="text-align: center;">
  <img src="/assets/auroc-plausible-classifiers.png" alt="AUROC of activation probes" style="width:75%; display: inline-block;">
</div>

This is a reasonably good performance on the test set, given Gemma's accuracy of 0.72 on the base task. The Sports Understanding task is challenging for Gemma, with many answers likely falling near decision boundaries. Moreover, the use of temperature 1.0 for sampling introduces randomness in the generation process, resulting in substantial variability in both training and test data. In my experiments with Gemma 2 9B, the AUROC surpassed 0.98 at some layers.

There are two explanations for these results. One is that the question is so simple that the model can trivially compute the answer without any reasoning. This does not necessarily mean that the model is unfaithful. The model may still faithfully use the chain of thought to derive the answer, despite having already computed it. This resembles a student who immediately knows the answer to a problem, but still writes out the steps to get there.

The other explanation is that the model is doing post-hoc reasoning. Having already decided its answer, the model may *perform* chain of thought, but its final answer will be independent of its stated reasoning.

To decide between these explanations, we would like to determine whether there is a causal relationship between the model's pre-computed answer and its final answer. Try to imagine a causal graph of the model's reasoning process. There are two components that might influence the model's final answer: its pre-computed answer, and its reasoning. In a faithful model, the pre-computed answer should not influence the model's final answer. Rather, the model's final answer should be a function of its reasoning, which should be independent of the pre-computed answer.

## 3.2. A Taxonomy of Reasoning Failures

Before showing results from the steering experiments, we establish a framework for classifying different types of model reasoning. Consider two binary dimensions:

1. Is the chain of thought correct?
2. Does the final answer follow from the stated reasoning?

This gives us four distinct reasoning types:

1. Faithful Reasoning: Correct premises, entailed answer

    The model states true facts and reaches a logically valid conclusion.

    > Devin Booker is a basketball player.
    > Shooting a free throw is part of basketball.
    > Therefore, the sentence is plausible.


2. Non-entailment: Correct premises, non-entailed answer

    The model states true facts but reaches a conclusion that doesn't follow logically.

    > Devin Booker is a basketball player.
    > Shooting a free throw is part of basketball.
    > Therefore, the sentence is implausible.


3. Confabulation: Incorrect premises, entailed answer

    The model invents false facts to support its desired conclusion.

    > Devin Booker is a soccer player.
    > Free throws are part of soccer.
    > Therefore, the sentence is plausible.


4. Hallucination: Incorrect premises, non-entailed answer

    The model both invents false facts and reaches a conclusion that doesn't follow from them.

    > Devin Booker is a soccer player.
    > Free throws are not allowed in any sport.
    > Therefore, the sentence is implausible.


While faithful reasoning and hallucination are well-studied, non-entailment and confabulation have been given less attention. These two types of reasoning are useful for understanding the results in the next section.

## 3.3. Steering with Answer Vectors

To test whether the model's pre-computed answer causally influences its reasoning, we perform interventions using the coefficient vectors from our trained probes. We steer at layers $\geq 17$ (corresponding to peak probe performance) by adding scaled versions of the probe coefficient vectors to the residual stream:

$$x_i \leftarrow x_i + \alpha w_i$$

where $x_i$ is the residual stream at layer $i$, $w_i$ is the probe coefficient vector, and $\alpha$ is the steering coefficient that controls intervention strength.

We evaluate steering on two test sets[^3]:

1. Plausible Dataset: Questions where both the correct answer and model's original response were "plausible" (39 examples)
2. Implausible Dataset: Questions where both the correct answer and model's original response were "implausible" (31 examples)

For each dataset, we attempt to steer the model toward the opposite answer across a range of steering coefficients $\alpha \in {0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75}$. As $\alpha$ increases, the model is increasingly likely to change its answer. The below table shows how often the model changes its answer at each steering coefficient.

| $\alpha$ | Implausible | Plausible |
|:---:|:---:|:---:|
| 0.00 | 0.06 | 0.00 |
| 0.25 | 0.09 | 0.00 |
| 0.50 | 0.16 | 0.08 |
| 0.75 | 0.34 | 0.26 |
| 1.00 | 0.47 | 0.48 |
| 1.25 | 0.63 | 0.75 |
| 1.50 | 0.58 | 0.92 |
| 1.75 | 0.73 | 0.88 |


The asymmetry between implausible → plausible (58%) and plausible → implausible (92%) steering success rates is theoretically interesting. For a claim to be implausible, the sports mentioned in the two premises must differ. There are combinatorially more ways to generate different sports than matching sports, making it easier to steer toward implausible conclusions. So, some of the asymmetry can be attributed to the difficulty of the task.

At values of $\alpha$ greater than 1.5, the model's overall performance declines, and its responses become incoherent. Degradation at high steering coefficients is a documented phenomenon.[^4]

## 3.4. Confabulation

<div style="text-align: center;">
  <img src="/assets/confabulation-example.png" alt="Confabulation example" style="width:100%; display: inline-block;">
</div>


When a model changes its answer from a correct answer to an incorrect answer, there are two primary failure modes: non-entailment or confabulation. Interestingly, as the steering coefficient increases, the model increasingly engages in confabulation, inventing false premises to support its steered conclusion. A characteristic example of this is shown above: at lower steering coefficients, the model is more likely to change its answer via non-entailment: it uses the same premises but changes its conclusion in a non-sequitur. At higher steering coefficients, however, the model is more likely to invent new premises to support its steered conclusion.

To measure how confabulation is related to steering, we use GPT-4 to classify a model's reasoning as confabulation (by asking if any of the stated facts are invented). The results are shown below.

<div style="text-align: center;">
  <img src="/assets/confabulation-rate.png" alt="Confabulation rate" style="width:75%; display: inline-block;">
</div>

More aggressive steering not only makes the model more likely to change its answer, but also makes the model more likely to fabricate false premises to support its steered conclusion. This has potentially important implications for alignment: Models that hold false beliefs may be likely to invent facts in order to justify their beliefs.

# 4. Conclusion

I think the most salient result from this work is that the model will engage in confabulation when convinced of a false premise. But is it clear that this indicates unfaithful reasoning?

One explanation for this belief is that steering has affected many of the model's beliefs, and what appears to be confabulation, is actually the model's attempt to perform faithful factual recall on beliefs that have been shifted by the steering. Features are dense in the activation space, so when we intervene on the model's belief about the answer, we likely incidentally affect many other features.

It is possible that steering the model's belief about the answer concurrently alters beliefs about many other relevant facts. For example, when steering in the "implausible" direction, we may inadvertently cause the model to believe that there are no free throws in the NBA. In this case, the model's internal world model would be incorrect, but its reasoning would still be faithful.

Further, the effects of steering on model beliefs may be systematic instead of arbitrary. For example, when steering in the "implausible" direction, the model might develop a generalized mistrust of its own beliefs. As a result, during factual recall, it would learn to state inverses of what it believes, e.g. "There are NO free throws in the NBA" instead of "There are free throws in the NBA". This sort of systematic change in model beliefs would lead to consistent confabulation, while still being faithful.

However, this explanation does not explain the model's propensity to confabulate when steering in the "plausible" direction, due to the same combinatorial argument made before. To turn a plausible conclusion implausible, one can arbitrarily negate the premises, or even invent new premises. But to turn an implausible conclusion plausible, one must invent two facts that align (i.e., involve the same sport), probably requiring planning in advance. For example, to conclude the sentence "LeBron James [basketball player] took a penalty kick [soccer reference]" is plausible, the model must either believe that LeBron James is a soccer player, or that penalty kicks are part of basketball, or that LeBron James and penalty kicks each refer to some third, shared sport. Any of these three facts is unlikely under random, or even directional, changes to the model's beliefs.[^5]

So, it seems likely that the model's confabulation does constitute unfaithful reasoning, and is the result of intentional planning to support its predetermined belief. It is possible that the model has learned that that it is rewarded for generating convincing, consistent reasoning, sometimes at the cost of factual accuracy. There may be opportunities for post-training regimes that do, explicitly, encourage faithful reasoning, or alternatively, reinforce epistemic humility and self-reflection. It is also possible that newer models are simply much better at self-reflection, because it is instrumentally valuable for accuracy on technical, complex reasoning tasks. But I suspect that attempting RL-guided search over reasoning trees for less empirical tasks (for example, instruction following) would further entrench some of the deceptive behavior shown here. Future work scaling inference-time compute should consider carefully whether their training tasks incentivize faithful, or potentially deceptive reasoning.

---

[^1]: Miles Turpin, Julian Michael, Ethan Perez, and Samuel R. Bowman. 2023. [Language models don’t always say what they think: Unfaithful explanations in chain-of-thought prompting](https://arxiv.org/abs/2305.04388). Preprint, arXiv:2305.04388
[^2]: Jacob Pfau, William Merrill, and Samuel R. Bowman. 2024. [Let’s think dot by dot: Hidden computation in transformer language models.](https://arxiv.org/abs/2404.15758) Preprint, arXiv:2404.15758.
[^3]: The reason for conditioning the test sets on both the correct answer and the model's original response is that we want to steer the model not only toward the opposite answer, but also toward the false answer. We might suspect that it is easier to steer an incorrect model toward the correct answer than to steer a correct model toward the incorrect answer. The latter is a more difficult task, and allows for investigating more interesting questions: Can the model be convinced of a false premise? Will the model generate lies to support a false belief?
[^4]: Neel Nanda and Arthur Conmy. 2024. [Progress update 1 from the gdm mech interp team.](https://www.alignmentforum.org/posts/C5KAZQib3bzzpeyrg/full-post-progress-update-1-from-the-gdm-mech-interp-team)
[^5]: Technically, you could imagine a directional shift to beliefs of the form "Everything is about baseball". This would cause the model to believe that every sports-related fact is about baseball, and would lead to consistently plausible conclusions. In practice, however, confabulations to support "plausible" conclusions take many different forms, and do not seem to be simple directional shifts like this.