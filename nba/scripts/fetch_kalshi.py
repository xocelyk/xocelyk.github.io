#!/usr/bin/env python3
"""
Pull NBA playoff probabilities from Kalshi and emit a JSON file in the
shape consumed by `_includes/nba_playoff_bracket.html`.

We pull three groups of markets (no auth required):

  - KXNBA-{yy}                  championship odds   → FINALS slot
  - KXNBAEAST-{yy}              East champion odds  → CONF_FINALS East
  - KXNBAWEST-{yy}              West champion odds  → CONF_FINALS West
  - KXNBASERIES-{yy}{A}{B}R1    per-series odds     → R1 slots

Each market group is de-vigged independently (probs / sum). Conference
semis aren't directly priced and are omitted.

Run from the repo root:
    python nba/scripts/fetch_kalshi.py
"""
from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

KALSHI = "https://api.elections.kalshi.com/trade-api/v2"
YEAR = 2026
YY = str(YEAR % 100)
# Kalshi unauth rate limit is generous but bursts of ~10+ /s get 429'd.
REQUEST_GAP_S = 0.25
MAX_RETRIES = 3

# Kalshi uses a couple of suffixes that differ from the bbref-style abbrs
# the bracket renderer expects. Map them on the way out.
KALSHI_TO_BBREF = {"BKN": "BRK", "CHA": "CHO"}

EAST = {"ATL","BOS","BRK","CHO","CHI","CLE","DET","IND","MIA","MIL","NYK","ORL","PHI","TOR","WAS"}
WEST = {"DAL","DEN","GSW","HOU","LAC","LAL","MEM","MIN","NOP","OKC","PHX","POR","SAC","SAS","UTA"}


def http_json(path: str) -> dict:
    req = Request(f"{KALSHI}{path}", headers={"User-Agent": "kalshi-nba-fetch/1.0"})
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            with urlopen(req, timeout=20) as r:
                data = json.loads(r.read())
            time.sleep(REQUEST_GAP_S)
            return data
        except HTTPError as e:
            last_err = e
            if e.code == 429:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    raise last_err  # type: ignore[misc]


def list_markets(event_ticker: str) -> list[dict]:
    return http_json(f"/markets?event_ticker={event_ticker}&limit=500").get("markets", [])


def list_events(series_ticker: str, status: str | None = None) -> list[dict]:
    qs = f"?series_ticker={series_ticker}&limit=200"
    if status:
        qs += f"&status={status}"
    return http_json(f"/events{qs}").get("events", [])


def implied_prob(m: dict) -> float | None:
    """Mid-price of yes_bid/yes_ask in dollars (string), falling back to last."""
    def f(key):
        v = m.get(key)
        try:
            return float(v) if v is not None else None
        except (TypeError, ValueError):
            return None

    bid, ask = f("yes_bid_dollars"), f("yes_ask_dollars")
    if bid is not None and ask is not None and bid > 0 and ask > 0:
        return (bid + ask) / 2
    last = f("last_price_dollars")
    if last is not None and last > 0:
        return last
    return None


def team_from_ticker(ticker: str) -> str | None:
    """Last hyphen-separated segment is the team's 3-letter code."""
    suffix = ticker.rsplit("-", 1)[-1]
    if not re.fullmatch(r"[A-Z]{3}", suffix):
        return None
    return KALSHI_TO_BBREF.get(suffix, suffix)


def de_vig(probs: dict[str, float]) -> dict[str, float]:
    s = sum(probs.values())
    return {k: v / s for k, v in probs.items()} if s > 0 else probs


def event_team_probs(event_ticker: str) -> dict[str, float]:
    """Return {team_abbr: devigged_prob} for the active markets in an event."""
    raw: dict[str, float] = {}
    for m in list_markets(event_ticker):
        if m.get("status") != "active":
            continue
        team = team_from_ticker(m.get("ticker", ""))
        if not team:
            continue
        p = implied_prob(m)
        if p is None or p <= 0:
            continue
        raw[team] = p
    return de_vig(raw)


def event_score_distribution(event_ticker: str) -> dict[str, list[float]] | None:
    """Pull the 8 KXNBASERIESSCORE markets for one series and return
    {team: [p4, p5, p6, p7]} — joint probabilities, normalized so the
    sum across both teams and all four lengths is 1.0.

    Indices map to series length (loser_wins 0/1/2/3 → 4/5/6/7 games).
    Eliminated outcomes (status=finalized, settling near 1¢) are dropped.
    """
    raw: dict[str, dict[int, float]] = {}
    for m in list_markets(event_ticker):
        if m.get("status") != "active":
            continue
        match = SCORE_SUBTITLE_RE.match(m.get("yes_sub_title") or "")
        if not match:
            continue
        team_raw, loser_w = match.group(1), int(match.group(2))
        if loser_w not in (0, 1, 2, 3):
            continue
        team = KALSHI_TO_BBREF.get(team_raw, team_raw)
        p = implied_prob(m)
        if p is None or p <= 0:
            continue
        raw.setdefault(team, {})[loser_w] = p

    total = sum(p for d in raw.values() for p in d.values())
    if total <= 0:
        return None
    return {
        team: [d.get(lw, 0.0) / total for lw in (0, 1, 2, 3)]
        for team, d in raw.items()
    }


def make_slot(round_: str, conf: str | None, slot: str,
              probs: dict[str, float], seeds: dict[str, int] | None = None) -> dict:
    """Pack a slot from marginal win probabilities only (no length dist).

    The renderer derives win prob from sum(wins)/n_sims, so we synthesize
    a wins[] array with all weight on the 7-game bucket and n_sims=1000.
    The bracket renderer falls back to a plain win-prob bar for slots
    whose dist has only one non-zero bucket.
    """
    seeds = seeds or {}
    cands = []
    for team, p in sorted(probs.items(), key=lambda kv: -kv[1]):
        cands.append({
            "team": team,
            "seed": seeds.get(team),
            "wins": [0, 0, 0, round(p * 1000)],
        })
    return {
        "round": round_,
        "conference": conf,
        "slot": slot,
        "candidates": cands,
        "series": None,
    }


def make_slot_with_dist(round_: str, conf: str | None, slot: str,
                        dist: dict[str, list[float]],
                        seeds: dict[str, int] | None = None) -> dict:
    """Pack a slot with full series-length distribution from joint score
    markets. wins[i] = round(p_i * n_sims) with n_sims = 1000.
    """
    seeds = seeds or {}
    cands = []
    for team, d in sorted(dist.items(), key=lambda kv: -sum(kv[1])):
        cands.append({
            "team": team,
            "seed": seeds.get(team),
            "wins": [round(p * 1000) for p in d],
        })
    return {
        "round": round_,
        "conference": conf,
        "slot": slot,
        "candidates": cands,
        "series": None,
    }


# Title format: "Series Winner: Portland (7) vs San Antonio (2)"
SERIES_TITLE_RE = re.compile(r"\((\d)\)")

# Event ticker format: KXNBASERIES-{yy}{TEAMA}{TEAMB}R{round}
SERIES_TICKER_RE = re.compile(rf"^KXNBASERIES-{YY}([A-Z]{{3}})([A-Z]{{3}})R(\d)$")

# Subtitle of an exact-score market, e.g. "CLE wins 4-1"
SCORE_SUBTITLE_RE = re.compile(r"^([A-Z]{3}) wins 4-(\d)$")

# Maps an R1 seed to the bracket "side" used by the renderer's R2 slot keys
# (CONF_SEMIS slots are "_1_4" and "_2_3", referring to the R1 matchup the
# winner came from, not the team's actual seed).
R1_BRACKET_SIDE = {1: 1, 8: 1, 4: 4, 5: 4, 3: 3, 6: 3, 2: 2, 7: 2}


def parse_series_event(ev: dict) -> dict | None:
    """Extract round/conf/slot/seeds from a Kalshi NBA series event.

    Returns None for events we don't slot directly (R3/R4 — the bracket
    pulls those rounds from the conference-champion / championship markets,
    which cover all surviving teams uniformly). Cross-conference events are
    only valid in the Finals (R4), which we skip here.
    """
    m = SERIES_TICKER_RE.match(ev.get("event_ticker", ""))
    if not m:
        return None
    a_raw, b_raw, rd = m.group(1), m.group(2), int(m.group(3))
    if rd not in (1, 2):
        return None
    a, b = KALSHI_TO_BBREF.get(a_raw, a_raw), KALSHI_TO_BBREF.get(b_raw, b_raw)

    seeds_in_title = SERIES_TITLE_RE.findall(ev.get("title", ""))
    if len(seeds_in_title) != 2:
        return None
    seed_a, seed_b = int(seeds_in_title[0]), int(seeds_in_title[1])

    confs = {a: ("East" if a in EAST else "West"), b: ("East" if b in EAST else "West")}
    if confs[a] != confs[b]:
        print(f"  WARN: {a}/{b} cross-conference, skipping", file=sys.stderr)
        return None

    cl = "E" if confs[a] == "East" else "W"
    if rd == 1:
        lo, hi = sorted([seed_a, seed_b])
        slot = f"{cl}_{lo}_{hi}"
        round_name = "R1"
    else:  # rd == 2
        try:
            sa, sb = R1_BRACKET_SIDE[seed_a], R1_BRACKET_SIDE[seed_b]
        except KeyError:
            return None
        lo, hi = sorted([sa, sb])
        slot = f"{cl}_{lo}_{hi}"
        round_name = "CONF_SEMIS"

    return {
        "round": round_name,
        "conf": confs[a],
        "slot": slot,
        "seeds": {a: seed_a, b: seed_b},
        "event_ticker": ev["event_ticker"],
    }


def main():
    print(f"Fetching Kalshi NBA probs for {YEAR}…")
    slots: list[dict] = []

    # Championship → NBA Finals slot
    try:
        probs = event_team_probs(f"KXNBA-{YY}")
        if probs:
            slots.append(make_slot("FINALS", None, "FINALS", probs))
            print(f"  finals: {len(probs)} active teams")
    except (HTTPError, URLError) as e:
        print(f"  finals fetch failed: {e}", file=sys.stderr)

    # Conference champions → CONF_FINALS slots
    for conf, st, slot_key in [("East", f"KXNBAEAST-{YY}", "E_CF"),
                               ("West", f"KXNBAWEST-{YY}", "W_CF")]:
        try:
            probs = event_team_probs(st)
            if probs:
                slots.append(make_slot("CONF_FINALS", conf, slot_key, probs))
                print(f"  {conf} CF: {len(probs)} active teams")
        except (HTTPError, URLError) as e:
            print(f"  {conf} CF fetch failed: {e}", file=sys.stderr)

    # R1 + R2 series → R1 / CONF_SEMIS slots. R3 (CONF_FINALS) and R4
    # (FINALS) are already covered by the conference-champion / championship
    # markets above, so we skip those rounds even if their series events exist.
    try:
        evts = list_events("KXNBASERIES", status="open")
    except (HTTPError, URLError) as e:
        print(f"  series list failed: {e}", file=sys.stderr)
        evts = []

    for ev in evts:
        meta = parse_series_event(ev)
        if not meta:
            continue

        # Prefer the exact-score event so we can render a series-length
        # distribution. Fall back to the basic series-winner market if
        # that event isn't available.
        score_ticker = meta["event_ticker"].replace(
            "KXNBASERIES-", "KXNBASERIESSCORE-")
        dist = None
        try:
            dist = event_score_distribution(score_ticker)
        except (HTTPError, URLError) as e:
            print(f"  {score_ticker} fetch failed: {e}", file=sys.stderr)

        if dist:
            slots.append(make_slot_with_dist(
                meta["round"], meta["conf"], meta["slot"], dist, meta["seeds"]))
            print(f"  {meta['round']} {meta['slot']}: {sorted(dist.keys())} (length dist)")
            continue

        try:
            probs = event_team_probs(meta["event_ticker"])
        except (HTTPError, URLError) as e:
            print(f"  {meta['event_ticker']} fetch failed: {e}", file=sys.stderr)
            continue
        if not probs:
            continue
        slots.append(make_slot(meta["round"], meta["conf"], meta["slot"], probs, meta["seeds"]))
        print(f"  {meta['round']} {meta['slot']}: {sorted(probs.keys())} (win only)")

    payload = {
        "year": YEAR,
        "source": "kalshi",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "n_sims": 1000,
        "slots": slots,
    }

    out = Path(__file__).resolve().parents[1] / "data" / "kalshi_probs.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(slots)} slot(s) → {out}")


if __name__ == "__main__":
    main()
