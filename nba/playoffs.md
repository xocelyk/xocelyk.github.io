---
layout: page
title: Playoff Bracket
permalink: /nba/playoffs/
---

<link rel="stylesheet" href="/nba/styles.css" />

<style>
html, body {
  overflow-x: clip !important; /* allow position:sticky to work */
}
.container { font-size: 14px; max-width: 1000px !important; }
html { font-size: 14px !important; }
@media (min-width: 38em) {
  html { font-size: 17px !important; }
}
.masthead { display: none !important; }
.page-title { display: none !important; }

.bracket-tabs {
  max-width: 1100px;
  margin: 24px auto 0;
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  font-family: 'Google Sans Code', ui-monospace, monospace;
}
.bracket-tabs .tab {
  background: none; border: 0;
  padding: 10px 18px 11px;
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b6b6b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.bracket-tabs .tab[aria-current="true"] {
  color: #111;
  border-bottom-color: #111;
  font-weight: 600;
}
.bracket-tabs .tab:hover { color: #111; }
.bracket-scope .wrap { padding-top: 20px !important; }
</style>

<div class="bracket-tabs" role="tablist" aria-label="Forecast source">
  <button class="tab" type="button" data-view="model"  aria-current="true">Model</button>
  <button class="tab" type="button" data-view="kalshi" aria-current="false">Kalshi</button>
</div>

<script>
  // For local dev Jekyll serves the JSON directly; on the live site the
  // workflow pushes it to the orphan `data` branch instead.
  const KALSHI_URL = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/nba/data/kalshi_probs.json"
    : "https://raw.githubusercontent.com/xocelyk/xocelyk.github.io/data/nba/data/kalshi_probs.json";

  // The model feed already tracks games_won per active series; reuse it on
  // the Kalshi tab so the score banners aren't stuck at 0–0.
  const SIM_URL = "https://raw.githubusercontent.com/xocelyk/nba/main/data/playoff_sim_results/playoff_slot_probs.json";

  const VIEWS = {
    model: {},
    kalshi: {
      probsUrl: KALSHI_URL,
      seriesUrl: SIM_URL,
      metaLabel: "kalshi mid-prices",
      title: "Playoff Bracket: Market Forecast"
    }
  };

  function readView() {
    const v = new URLSearchParams(location.search).get("view");
    return v && VIEWS[v] ? v : "model";
  }

  // Set initial config synchronously so the include's first fetch uses it.
  window.NBA_BRACKET_CONFIG = VIEWS[readView()];

  document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".bracket-tabs .tab");
    const initial = readView();
    tabs.forEach(t => t.setAttribute("aria-current", t.dataset.view === initial ? "true" : "false"));

    tabs.forEach(t => {
      t.addEventListener("click", () => {
        const view = t.dataset.view;
        if (t.getAttribute("aria-current") === "true") return;
        window.NBA_BRACKET_CONFIG = VIEWS[view];
        tabs.forEach(b => b.setAttribute("aria-current", b === t ? "true" : "false"));

        const url = new URL(location.href);
        if (view === "model") url.searchParams.delete("view");
        else url.searchParams.set("view", view);
        history.replaceState(null, "", url);

        if (typeof window.nbaBracketReload === "function") {
          window.nbaBracketReload();
        }
      });
    });
  });
</script>

{% include nba_playoff_bracket.html %}
