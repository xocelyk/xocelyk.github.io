---
layout: page
title: NBA Forecast
permalink: /nba/
---

<!-- Include page-specific styles -->
<link rel="stylesheet" href="{{ '/nba/styles.css' | relative_url }}">

<style>
.container {
  font-size: 14px;
}

html {
  font-size: 14px !important;
}

@media (min-width: 38em) {
  html {
    font-size: 17px !important;
  }
}

/* Hide the masthead header */
.masthead {
  display: none !important;
}

/* Add top spacing since masthead is hidden */
.page-title {
  margin-top: 2rem !important;
}
</style>

Updated daily. Projections from 1,000 simulations. [Playoff bracket →](/nba/playoffs/)

<div class="conference-toggle">
    <button class="toggle-btn active" data-conference="all">All</button>
    <button class="toggle-btn" data-conference="east">East</button>
    <button class="toggle-btn" data-conference="west">West</button>
</div>

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
