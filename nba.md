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
  color: #515151 !important;
  background-color: #fff !important;
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
</style>

Updated daily. Projections from 1,000 simulations.

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
