---
layout: post
title: Run your simulations hot
---

Let's play a game.

I have a coin and you have a coin. My coin is fair, but your coin is double-sided. There is a 70% probability your coin has two heads, and a 30% probability your coin has two tails. I say we flip each of our coins 100 times, and if your coin flips more heads, you win 100 dollars. How much would you pay to play this game?

I argue that you should pay 1000 dollars to play this game, because you are nearly guaranteed victory. On the first flip, there is a 70% chance you win. We can model the number of heads of your coin over 100 flips \$X_2\$ as a binomial random variable with parameter \$p = 0.7.\$ Similarly, we can model the number of heads of my coin over 100 flips \$X_1\$ as a binomial random variable with parameter \$p = 0.5.\$ And \$P((X_2 - X_1) \leq 0) \approx 0.\$ So you are virtually guaranteed to win, and you should be willing to pay a very high premium to play the game.

But this seems unintuitive, and maybe you get the suspicion that I am trying to hustle you. So what's wrong with the above reasoning? Well, we are given the distribution of \$X_2\$ in the game description. It is \$P(X_2 = 100) = 0.7, P(X_2 = 0) = 0.3.\$ The number of heads is not normally distributed; it is bimodal, and can only take on the two values at the extremes of its range. While the flips of my coin are independent, yours are not. After your first flip, you know know the results of your following 99 flips. You should pay \$\frac{0.7}{0.3} \cdot \\$100 \approx \\$233.34\$ to play the game

Put another way, each toss gives us some Bayesian information about the coins, and we have to update our priors as we play the game. If we were running a Monte Carlo simulation of the coin game, we would want to simulate two flips, update our distribution over the coin parameters, and repeat. So the "hot" Monte Carlo simulation process consists of two repeated steps: (1) Simulate event and (2) update parameters.

For reasons similar to the coin game, it is important to run Monte Carlo hot for sports simulations, particularly over the course of a season. But there is an added layer of complexity to sports simulations. In the coin game, each event outcome was a function of two parameters: Coin 1's probability of heads and Coin 2's probability of heads. Similarly, in sports, we may model each game outcome as a function of two parameters: Team 1's true strength and Team 2's true strength. But, unlike the coin parameters, these parameters are subject to change over the course of the season. This is different from saying our *belief* about the parameters are subject to change, as is the case in the coin game, but rather, the *true parameter* value is subject to change

Consider a poorly rated basketball team that goes on a sudden unexpected win streak in the middle of the season. Absent other information about the team, there are a couple of possible explanations of the win streak. The team could have simply gotten lucky, and not actually be much better than they were estimated to be before the win streak began. They could also have been underestimated before the win streak, and actually the win streak was much more likely than expected before it began. And lastly, the team could have materially improved since the start of the win streak, with the win streak reflecting the change in true strength. Maybe they traded for a new player, or maybe the lineup or positional rotations changed, or maybe a star player just returned from their 20-game suspension for flashing a gun on Instagram live. Regardless, updating parameters over the course of a simulation allows us to capture these true changes in the underlying parameter over the course of the simulation.

Note that there are other ways to model these sudden phase-shift changes in true rating parameter over the course of a sports season, which I have not explored, but would like to. Things like injuries and trades, for example, could directly be modeled as Poisson random variables. But hot Monte Carlo gets you some of the way there.

Generally speaking, static Monte Carlo results in less variance in simulation outcomes than hot Monte Carlo. I can usually identify this in sports simulations by overconfidence in favorites--for example, 100.00% probability the best team makes the playoffs at the start of the season.

Here's a short experiment to illustrate the point. Consider a 4-team league, with 100 games over the course of a season. Each team has an ELO rating between 0 and 10. We'll say a team's probability of winning a game is a softmax over theirs and their opponent's ratings. The winning team's ELO increases by 10% of their opponent's rating, and the losing team's ELO decreases by 10% of 10 - their opponent's rating, but ratings are clipped between 0 and 10. In the static simulation, we do not update ELOs, and in the hot simulation, we do. Teams have ratings of 2, 4, 6, and 8 at the beginning of the season. Let's compare the distribution of win totals over the course of 100 simulations. Code [here](https://github.com/xocelyk/elo-monte-carlo).

**Static**
<table>
    <thead>
        <tr>
            <th></th> <!-- Blank header for the row names -->
            <th>Avg. Wins</th>
            <th>SD Wins</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Team 1</td>
            <td>4.8</td>
            <td>1.9</td>
        </tr>
        <tr>
            <td>Team 2</td>
            <td>33.5</td>
            <td>4.7</td>
        </tr>
        <tr>
            <td>Team 3</td>
            <td>66.5</td>
            <td>4.7</td>
        </tr>
        <tr>
            <td>Team 4</td>
            <td>95.2</td>
            <td>2.3</td>
        </tr>
    </tbody>
</table>


**Hot**
<table>
    <thead>
        <tr>
            <th></th> <!-- Blank header for the row names -->
            <th>Avg. Wins</th>
            <th>SD Wins</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Team 1</td>
            <td>13.2</td>
            <td>7.5</td>
        </tr>
        <tr>
            <td>Team 2</td>
            <td>24.2</td>
            <td>12.1</td>
        </tr>
        <tr>
            <td>Team 3</td>
            <td>73.7</td>
            <td>14.8</td>
        </tr>
        <tr>
            <td>Team 4</td>
            <td>88.9</td>
            <td>4.9</td>
        </tr>
    </tbody>
</table>
