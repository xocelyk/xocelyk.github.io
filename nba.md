---
layout: page
title: NBA Forecast
permalink: /nba/
---

<!-- Include page-specific styles -->
<link rel="stylesheet" href="{{ '/nba/styles.css' | relative_url }}">

<style>
/* Override sepia theme for NBA page only */
body {
  color: #333333 !important;
  background-color: #f5f5f5 !important;
}

h1, h2, h3, h4, h5, h6 {
  color: #313131 !important;
}

a {
  color: #268bd2 !important;
}

.container {
  font-size: 16px;
}

html {
  font-size: 16px !important;
}

@media (min-width: 38em) {
  html {
    font-size: 20px !important;
  }
}

/* Hide the masthead header */
.masthead {
  display: none !important;
}

/* Hide default page title since we have custom header */
.page-title {
  display: none !important;
}

</style>

<div class="nba-header">
  <h1>NBA Forecast</h1>
  <p class="nba-subtitle">2025-26 Season &middot; Updated daily &middot; 1,000 simulations</p>
</div>

<div class="section-header">
  <h2>Standings & Projections</h2>
  <div class="conference-tabs">
    <button class="conf-tab active" data-conf="all">All</button>
    <button class="conf-tab" data-conf="west">West</button>
    <button class="conf-tab" data-conf="east">East</button>
  </div>
</div>

<div class="table-scroll-container">
<div id="table-container">
    {% include nba_table.html %}
</div>
</div>

<div class="section-header">
  <h2>Upcoming Games</h2>
  <p class="section-note">Predictions for the next 7 days</p>
</div>

<div class="table-scroll-container">
<div id="table-container">
    {% include nba_predictions_table.html %}
</div>
</div>
