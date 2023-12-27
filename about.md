---
layout: page
title: About
permalink: /about/
---

Hello, my name is Kyle Cox. Currently I am a master's student in computer science at the University of Texas at Austin. While pursuing my master's, I am a research associate at the [IC2 Institute](https://ic2.utexas.edu), where I also collaborate with the [AI Health Lab](https://aihealth.ischool.utexas.edu). Previously I was an undergraduate at UT Austin where I completed my bachelor's in mathematics. I was also a [Forty Acres Scholarship](https://www.texasexes.org/scholarships/forty-acres-scholars-program) Finalist and National Merit Scholar. I'm interested in machine learning, language models, AI safety, and basketball analytics.

### Work, Projects, Experience
Some things I have worked on:
- IC2 Institute
    - Collaborated with MIT Lab for computational physiology to build a classifier for poor health literacy from patient clinical notes
    - Using [All of Us](https://www.researchallofus.org/about/) research program/dataset for risk assessment for health outcomes, in particular analyzing the relationship between social determinatns of health and clinical outcomes
    - With Craig Watkins, pitched an app protocol to do behavioral health coaching with ecological momentary assessment [Texas Health Catalyst](https://dellmed.utexas.edu/healthscape/collaborative-opportunities/colab/texas-health-catalyst) at Dell Medical School. Our pitch was selected as a Phase 2 Finalist with about an 8% acceptance rate.

- AI Health Lab
    - Experimenting with serialization approaches for language models to do inference on health time series data
    - Showed language models are [few-shot decision tree generators](https://xocelyk.github.io/2023/09/12/language-model-augmented-decision-trees/)
    - Testing tree of thoughts prompting approach for gene set summarization with large language models

- Melange
    - Interned for Melange in Spring 2022, leading strategy initiatives for a real-money prediction markets platform

- [Directed Reading Program](https://web.ma.utexas.edu/users/drp/)
    - DRP is a research training group for undergraduates in mathematics
    - I participated for three sessions--Spring 2021, Summer 2021, and Fall 2021--under the mentorship of [Hunter Vallejos](https://web.ma.utexas.edu/users/vallejos/)
    - Spring 2021: studied Markov chains and the mixing times of [random card shuffles](https://www.quantamagazine.org/persi-diaconis-mixes-math-and-magic-20150414/)
    - Summer 2021 (funded): studied ergodic dynamics, with an application to [Benford's Law](https://en.wikipedia.org/wiki/Benford's_law)
        - Built a simple [web dashboard](https://test-benford.streamlit.app) where you can upload a dataset and evaluate if your data is Benford
        - Also did a Benford analysis on Detroit precinct voting data amid claims of voter fraud. See [here](https://github.com/xocelyk/benford-election-2021/blob/8636ac3448ba4b15bffb6bd4eebf5ad6181f558d/benford.png)
    - Fall 2021: did a survey of topics in machine learning, following Kevin Murphy's [Machine Learning, a Probabilistic Perspective](http://noiselab.ucsd.edu/ECE228/Murphy_Machine_Learning.pdf)

- UT/Goldsberry Basketball Analytics
    - Worked on computer vision and basketball analytics problems with Kirk Goldsberry, one of which turned into the [capstone paper](https://github.com/xocelyk/beyondbinary/blob/main/beyondbinary-final.pdf) for my applied statistics certificate
    - Did lots of cleaning and modeling of ball-tracking computer vision data, working with data from the UT men's basketball program, Toronto Raptors, and University of Toronto biomechanics & sports medicine lab

- Dalton Pathology
    - Did independent research with Dr. Leslie Dalton over summer 2021, doing deep learning for breast cancer tissue classification

- [Alegion](https://www.alegion.com)
    - Interned for Alegion over summer 2020, where I expanded annotation tools for the data labeling platform

- Tutoring/Teaching
    - Tutored students in math through all of undegrad, everything from middle school to college level, but most often pre-calculus and calculus. 100+ clients
    - Also taught a biweekly summer math course at my old high school for advanced middle school students, and spoke to the math club a couple of times. This was a ton of fun.

- NBA/College Basketball Projects
    - My NBA/CBB rankings and predictions can be found [here](http://www.kyle-cox.com). NBA updates daily automatically; college I update every once in a while manually.
        - Initially was just an application of [PageRank](https://www2.math.upenn.edu/~kazdan/312S14/Notes/Perron-Frobenius-football-SIAM1993.pdf) to college basketball rankings
        - Now I focus on the NBA side, which uses a more involved efficiency-based algorithm and Monte Carlo simulations to build season projections
    - I also do [live in-game win probabilities](https://nba-live-probability.streamlit.app) for NBA. Sometimes when there are a bunch of games on, I put the win-probability dashboard up on my monitor while I'm working.
    - PBP data
        - A bottleneck to NBA analytics hobbyists is good play-by-play data. Though there are many play-by-play data sources, it is harder to find play-by-play data with on-court lineups. This is important, because to do individual player evaluation, you have to know who was on the court at every moment. However, for about 90% of games, you can remedy this by iterating through each play and back-filling lineups where there is a mention of a player in action. I did this for games from 1999-2022 and host the dataset on [Kaggle](https://www.kaggle.com/datasets/xocelyk/nba-pbp) so that hobbyists can try at building their own player evaluation metrics.