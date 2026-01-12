---
layout: post
title: Notes on The Alignment Problem from a Deep Learning Perspective
categories: [notes]
hidden: true
---

### Introduction

Starting today I'm experimenting with learning in public. There are a few reasons for doing this:

1. Learning in public is a way to hold myself accountable for studying
2. It is rewarding and allows me to set achievable goals for learning
3. It increases visibility and allows others to see how I think/what I am thinking about
4. My notes may be useful to others

I hope for this to be the beginning of a series of posts documenting my notes on different things. It may be better to keep notes in a page separate from other blog posts - I'll decide if I want to do this later.

Part of my note-taking philosophy is that a lot (>50%?) of the benefit of taking notes is in simply writing things down. Even if you don't review your notes, taking them is usually still worthwhile. So, sometimes I will do things like copy parts of the text verbatim, disregard clean organization, or do stream-of-consciousness writing, because I'm not optimizing for readability.

### Notes

[The Alignment Problem from a Deep Learning Perspective, 2023](https://arxiv.org/pdf/2209.00626.pdf)

- if trained like today’s models are, AGI could:
	- act deceptively to receive higher reward
	- learn internally represented goals that generalize beyond their fine-tuning distributions (this is bad somehow)
- previous criticisms of AI have dealt only in the abstract, and not focused on current ML approaches. do they still apply?
- paper focuses on AGIs pretrained using self-supervised learning and fine-tuned using RLHF
- RLHF encourages the emergence of three problems:
	- (1) rewards models for *appearing* harmless and ethical while maximizing useful outcomes
	- (2) encourages AGIs to plan towards misaligned internally-represented goals that generalize beyond the fine-tuning distribution
	- (3) AGIs will pursue these goals using unwanted power-seeking behaviors
        - acquiring resources
        - proliferating
        - avoiding shutdown
- reward hacking: when reward function is misspecified

![Notes on The Alignment Problem from a Deep Learning Perspective](/assets/alignment-1.png)

- situational awareness: model may know how humans will respond to its behavior, that it is a machine learning system implemented on physical hardware, which interface it is using to interact with the world, how other copies of itself might be deployed in the future
	- Bing chat interprets web search results that mention it as being about itself
- situationally aware reward hacking: situational awareness would allow policies to reason about flaws in the feedback mechanisms used to train them
	- e.g. exploit misspecifications only in situations where they predict it won’t be possible to detect them
		- e.g. matching answers to reviewer’s beliefs instead of objective truth
- penalizing misbehavior rewards subtle misbehavior
- learning internally-represented goals
	- AlphaZero learned different outcome representations (different from just winning) like “king safety”
	- “Andreas 2022 provides evidence LLMs represent the goals and predictions of goal-directed human communicators and use them to imitate these communicators”
	- planning is useful and efficient, so we should expect more architectures expressive enough to support planning, and optimization over these architectures will encourage policies to develop internally-represented goals
	- generalizing out of distribution: policies may learn high level representations over their target
		- InstructGPT trained to follow instructions in English but generalized to follow instructions in French
- **inner alignment:** ensuring that policies learn desirable internally-represented goals
- **outer alignment:** providing well-specified rewards
- learning misaligned goals
	- policies will learn goals that are correlated with the reward. why might misaligned goals be correlated with reward?
		- consistent reward misspecification
		- fixation on feedback mechanisms
		- spurious correlations between rewards and environmental features
			- maybe king safety does not always mean you are winning
- power-seeking strategies
	- summary:
		- many goals incentivize power-seeking
		- goals which motivate power-seeking would be reinforced during training
		- misaligned AGIs could gain control of key levers of power
	- **Instrumental Convergence Thesis (Bostrom):** There are some subgoals which are extremely useful for almost any final goal
		- paperclip
	- internal subgoals that might be useful for many possible final goals: acquiring tools and resources, convincing other agents to do what it wants, preserving its existing goals
	- one definition of power: a state’s average value across a wide range of reward functions
		- optimal policies for random reward functions statistically tend to move to high-power states
	- a policy may realize that achieving high reward during training would increase its long-term power by
		- convincing human supervisors to trust the policy more and deploy copies of it later on
		- decrease the likelihood that training will change the policy’s goals
			- this one is really interesting: if its goal at a certain time is X and the agent is situationally aware and knows gradient descent may change its goal, then it will try to avoid gradient descent (and therefore try to achieve high reward)
			- don’t quite see how preserving its existing goals is the same as power-seeking though
	- so, training may reinforce power-seeking strategies
	- behaving in high reward ways for primarily instrumental reasons is known as deceptive alignment
	- if deceptively-aligned AIs can detect the distributional shift from training to deployment, then they will benefit from accounting for it in planning their long-term behavior
		- think about how easy this would be with GPT-4 using cutoff dates
	- collusion is also a possibility
		- could happen very rapidly so that it will be difficult for humans to track
		- could be deceptive or encrypted so that we cannot pick up on the collusion
	- recursive self-improvement adds a new layer to all of this
- alignment research overview
	- goal misgeneralization
		- finding and training on adversarial examples designed to penalize misaligned behavior
		- mechanistic interpretability
		- conceptual interpretability: developing automatic techniques for probing and modifying human-interpretable concepts in networks