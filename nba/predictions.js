d3.csv("https://raw.githubusercontent.com/xocelyk/nba/main/data/predictions/predicted_margins_and_win_probs.csv").then(data => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const ABBR_TO_FULL = {
        "ATL": "Atlanta Hawks", "BOS": "Boston Celtics", "BKN": "Brooklyn Nets",
        "CHA": "Charlotte Hornets", "CHO": "Charlotte Hornets", "CHI": "Chicago Bulls",
        "CLE": "Cleveland Cavaliers", "DAL": "Dallas Mavericks", "DEN": "Denver Nuggets",
        "DET": "Detroit Pistons", "GSW": "Golden State Warriors", "HOU": "Houston Rockets",
        "IND": "Indiana Pacers", "LAC": "Los Angeles Clippers", "LAL": "Los Angeles Lakers",
        "MEM": "Memphis Grizzlies", "MIA": "Miami Heat", "MIL": "Milwaukee Bucks",
        "MIN": "Minnesota Timberwolves", "NOP": "New Orleans Pelicans", "NYK": "New York Knicks",
        "OKC": "Oklahoma City Thunder", "ORL": "Orlando Magic", "PHI": "Philadelphia 76ers",
        "PHX": "Phoenix Suns", "POR": "Portland Trail Blazers", "SAC": "Sacramento Kings",
        "SAS": "San Antonio Spurs", "TOR": "Toronto Raptors", "UTA": "Utah Jazz",
        "WAS": "Washington Wizards"
    };

    function getLogoUrl(abbr) {
        return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;
    }

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const filteredData = data.filter(d => {
        const dateOfEntry = new Date(d.Date);
        return dateOfEntry <= sevenDaysFromNow;
    }).map(d => {
        const homeMargin = Number(d["Predicted Home Margin"]);
        const homeWinProb = Number(d["Predicted Home Win Probability"]);
        const dateObj = new Date(d.Date + "T12:00:00");
        const dayName = dayNames[dateObj.getDay()];
        const parts = d.Date.split("-");
        const formattedDate = `${dayName}, ${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
        return {
            rawDate: d.Date,
            Date: formattedDate,
            Home: d.Home,
            Away: d.Away,
            homeMargin: homeMargin,
            homeWinProb: homeWinProb,
            awayWinProb: 1 - homeWinProb
        };
    });

    // Group by date
    const gamesByDate = d3.group(filteredData, d => d.Date);

    const container = d3.select("#table-container-2");

    gamesByDate.forEach((games, date) => {
        // Date header
        container.append("div")
            .attr("class", "date-header")
            .text(date);

        const gamesGrid = container.append("div")
            .attr("class", "games-grid");

        games.forEach(game => {
            const card = gamesGrid.append("div")
                .attr("class", "game-card");

            const homeWinProb = game.homeWinProb;
            const awayWinProb = game.awayWinProb;
            const homeFavored = homeWinProb >= 0.5;

            // Away team row
            const awayRow = card.append("div")
                .attr("class", "game-team" + (!homeFavored ? " favored" : ""));

            awayRow.append("img")
                .attr("class", "game-logo")
                .attr("src", getLogoUrl(game.Away))
                .attr("alt", game.Away)
                .attr("width", 24)
                .attr("height", 24);

            awayRow.append("span")
                .attr("class", "game-team-name")
                .text(ABBR_TO_FULL[game.Away] || game.Away);

            awayRow.append("span")
                .attr("class", "game-win-pct")
                .text(Math.round(awayWinProb * 100) + "%");

            // Home team row
            const homeRow = card.append("div")
                .attr("class", "game-team" + (homeFavored ? " favored" : ""));

            homeRow.append("img")
                .attr("class", "game-logo")
                .attr("src", getLogoUrl(game.Home))
                .attr("alt", game.Home)
                .attr("width", 24)
                .attr("height", 24);

            homeRow.append("span")
                .attr("class", "game-team-name")
                .text(ABBR_TO_FULL[game.Home] || game.Home);

            homeRow.append("span")
                .attr("class", "game-win-pct")
                .text(Math.round(homeWinProb * 100) + "%");

            // Probability bar
            const barContainer = card.append("div")
                .attr("class", "prob-bar-container");

            barContainer.append("div")
                .attr("class", "prob-bar away-bar")
                .style("width", (awayWinProb * 100) + "%");

            barContainer.append("div")
                .attr("class", "prob-bar home-bar")
                .style("width", (homeWinProb * 100) + "%");

            // Spread line
            const spread = Math.abs(game.homeMargin).toFixed(1);
            const favoredTeam = homeFavored ? game.Home : game.Away;
            card.append("div")
                .attr("class", "game-spread")
                .text(`${favoredTeam} -${spread}`);
        });
    });
});
