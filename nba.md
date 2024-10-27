---
layout: page
title: NBA Ratings & Projections
permalink: /nba/
---

<!-- Include page-specific styles -->
<link rel="stylesheet" href="{{ '/public/css/nba/styles.css' | relative_url }}">

Updated daily. Projections from 1000 Monte Carlo simulations.

<div class="table-scroll-container">
<div id="table-container">
    {% include nba_table.html %}
</div>
</div>
<br/><br/>

Game predictions for the next week.

<div class="table-scroll-container">
<div id="table-container">
    {% include nba_predictions_table.html %}
</div>
</div>
