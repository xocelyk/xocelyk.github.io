---
layout: post
title: Basketball Power Ratings as Stochastic Gradient Descent
---

*NB: This generalizes to any sport or game with head-to-head matchups and scorekeeping: football, pickleball, Yahtzee, type racing. But I care more about basketball, so that's what the title is going to be.*

A natural impulse in sports is to rank teams, and in order to do that you may be inclined to assign teams a number, or a power rating. This can be any number, but if you want your power rating to be useful, that number should mean something. ELO fans may disagree.

There are two main ways success is measured in sports. These are also the two things people like to bet on:
1. How often a team wins (or, how likely a team is to win)
2. How much a team wins by (or, their expected margin of victory)

Most rating systems reflect one of these two measures. A power rating regime based on win probabilities might assign .90 to a team that has a 90% chance of beating an average team. A power rating regime based on expected margin of victory might assign +5 to a team expected to beat  an average team by 5 points. For now, assume all games occur at a neutral location.

Ratings based on expected margin of victory have an advantage over win-probability-based ratings: The scale is linear. Or, rather, we can assume it is linear. We can expect a team with a +8 rating to beat a team with a +1 rating by 7 points. The difference between a +3 team and a -1 team is the same as the difference between a -4 team and a -8 team. Probability-based ratings can't be interpreted this way. What is the probabiltiy of a .8 team beating a .7 team? It's hard to guess.

Even better: *expected margin ratings are just stochastic gradient descent*.

Let's formalize it a bit. Order the teams in your league $1, \dots, n$. Let $r_k$ be the rating of team k. Suppose team k plays team l, and the difference in team k's score and team l's score is S. Then we want our ratings to satisfy
$$r_k - r_l = S.$$

Let $\mathbf{r} = \begin{pmatrix} r_1 & \dots & r_n \end{pmatrix}$ be the rankings vector.

Now let our dataset of games be 
$$D = \{(\mathbf{x_i}, y_i) \mid i = 1, \dots, n\},$$
where each 
$\mathbf{x_i}$
 represents a game and each $y_u$ marks the margin of that game.
Let $ \mathbf{x_{ij}} $ be the jth element of the game vector $\mathbf{x_i}.$
 $ \mathbf{x_{ij}} $ is
- $1$ if team $j$ is home,
- $-1$ if team $j$ is away,
- $0$ otherwise.

For example, the pair $((1, -1, 0)^T, 10)$ represents a game in a three-team leage where team 1 played at home against team 2 and won by 10.

Then our predictive model for margin is $$\hat{y_i} = r x_i.$$

Let's assign a squared error loss function:

$$L(y_i, \hat{y}_i) = \frac{1}{2}(y_i - \hat{y}_i)^2 = \frac{1}{2}(y_i - r x_i)^2.$$

Notice that the gradient of the loss with respect to the ratings vector is $\frac{\partial L}{\partial r} = (\hat{y} - y)x_i.$ This is perfectly intuitive! In stochastic gradient descent, our update step will be:

$$r = r + \eta (y - \hat{y}) x_i.$$

Consider what this means for each team in game $\mathbf{x_i}.$ If team 1 is at home and rated 3 higher than team 2, but they only win by 1, then team 1's rating is decreased by (some constant times) 2, and team 2's rating is increased by (some constant times) 2. Individual team ratings get updated in proportion to how much they exceeded expecations.

So, here's how the algorithm works:  
```plaintext
ratings = np.zeros(n)
for epoch in epochs:
    for (x, y) in games:
        # suppose home team i, away team j
        y_pred = ratings[i] - ratings[j]
        ratings[i] += learning_rate * (y - y_pred)
        ratings[j] -= learning_rate * (y - y_pred)
```




