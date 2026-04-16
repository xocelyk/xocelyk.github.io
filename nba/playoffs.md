---
layout: page
title: Playoff Bracket
permalink: /nba/playoffs/
---

<link rel="stylesheet" href="/nba/styles.css" />

<style>
/* Override sepia theme for NBA page only */
html, body {
  overflow-x: clip !important; /* allow position:sticky to work */
}
body {
  color: #515151 !important;
  background-color: #fff !important;
}
h1, h2, h3, h4, h5, h6 { color: #313131 !important; }
a { color: #268bd2 !important; }
.container { font-size: 16px; }
html { font-size: 16px !important; }
@media (min-width: 38em) {
  html { font-size: 20px !important; }
}
.masthead { display: none !important; }
.page-title { display: none !important; }
</style>

{% include nba_playoff_bracket.html %}
