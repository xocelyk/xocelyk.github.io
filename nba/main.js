const TEAM_ABBR_MAP = {
    "Oklahoma City Thunder": "OKC", "New York Knicks": "NYK", "Detroit Pistons": "DET",
    "San Antonio Spurs": "SAS", "Boston Celtics": "BOS", "Cleveland Cavaliers": "CLE",
    "Denver Nuggets": "DEN", "Golden State Warriors": "GSW", "Milwaukee Bucks": "MIL",
    "Houston Rockets": "HOU", "Los Angeles Lakers": "LAL", "Minnesota Timberwolves": "MIN",
    "Dallas Mavericks": "DAL", "Memphis Grizzlies": "MEM", "Indiana Pacers": "IND",
    "Phoenix Suns": "PHX", "Miami Heat": "MIA", "Los Angeles Clippers": "LAC",
    "Atlanta Hawks": "ATL", "Sacramento Kings": "SAC", "Chicago Bulls": "CHI",
    "Orlando Magic": "ORL", "Toronto Raptors": "TOR", "Portland Trail Blazers": "POR",
    "Brooklyn Nets": "BKN", "Philadelphia 76ers": "PHI", "Utah Jazz": "UTA",
    "New Orleans Pelicans": "NOP", "Charlotte Hornets": "CHA", "Washington Wizards": "WAS"
};

const WEST_TEAMS = new Set([
    "Oklahoma City Thunder", "San Antonio Spurs", "Denver Nuggets", "Golden State Warriors",
    "Houston Rockets", "Los Angeles Lakers", "Minnesota Timberwolves", "Dallas Mavericks",
    "Memphis Grizzlies", "Phoenix Suns", "Los Angeles Clippers", "Sacramento Kings",
    "Portland Trail Blazers", "Utah Jazz", "New Orleans Pelicans"
]);

const EAST_TEAMS = new Set([
    "New York Knicks", "Detroit Pistons", "Boston Celtics", "Cleveland Cavaliers",
    "Milwaukee Bucks", "Indiana Pacers", "Miami Heat", "Atlanta Hawks",
    "Chicago Bulls", "Orlando Magic", "Toronto Raptors", "Brooklyn Nets",
    "Philadelphia 76ers", "Charlotte Hornets", "Washington Wizards"
]);

function getLogoUrl(teamName) {
    const abbr = TEAM_ABBR_MAP[teamName];
    if (!abbr) return null;
    // Use ESPN CDN for team logos
    const espnIds = {
        "ATL": 1, "BOS": 2, "BKN": 17, "CHA": 30, "CHI": 4, "CLE": 5,
        "DAL": 6, "DEN": 7, "DET": 8, "GSW": 9, "HOU": 10, "IND": 11,
        "LAC": 12, "LAL": 13, "MEM": 29, "MIA": 14, "MIL": 15, "MIN": 16,
        "NOP": 3, "NYK": 18, "OKC": 25, "ORL": 19, "PHI": 20, "PHX": 21,
        "POR": 22, "SAC": 23, "SAS": 24, "TOR": 28, "UTA": 26, "WAS": 27
    };
    const id = espnIds[abbr];
    if (!id) return null;
    return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;
}

d3.csv("https://raw.githubusercontent.com/xocelyk/nba/main/data/main_2026.csv").then(data => {
    const probColumns = ['Playoffs', 'Conference Semis', 'Conference Finals', 'Finals', 'Champion'];
    const ratingColumns = ['Season Rating', 'Predictive Rating', 'AdjO', 'AdjD', 'RSOS'];

    const probColorScale = d3.scaleLinear()
        .domain([0, 0.5, 1])
        .range(["#f8f9fa", "#a8d8ea", "#1a73e8"]);

    const container = d3.select("#table-container-1");
    const table = container.append("table").attr("class", "table").attr("id", "1");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    function formatValue(value, column) {
        if (isNaN(value)) return value;
        const num = parseFloat(value);

        if (column === "Pace") return num.toFixed(1);

        if (ratingColumns.includes(column)) {
            const formatted = num.toFixed(1);
            return (num > 0 ? "+" : "") + formatted;
        }

        if (probColumns.includes(column)) {
            if (num == 1) return "100%";
            if (num == 0) return "—";
            if (num > 0.999) return ">99.9%";
            if (num < 0.001) return "<0.1%";
            if (num > 0.990 || num < 0.010) return `${(num * 100).toFixed(1)}%`;
            return `${Math.round(num * 100)}%`;
        }

        return value;
    }

    const headers = data.columns.map(column => {
        if (column === "EM Rating") return "Season Rating";
        return column;
    }).filter(column => column !== "Rank");

    // Header row
    thead.append("tr")
        .selectAll("th")
        .data(headers)
        .enter()
        .append("th")
        .attr("data-column", d => d)
        .attr("class", d => {
            const classes = [];
            if (probColumns.includes(d)) classes.push("prob-cell");
            if (d === "Team") classes.push("team-header");
            return classes.join(" ");
        })
        .attr("title", d => {
            const tooltips = {
                "Season Rating": "Efficiency margin based on season results",
                "Predictive Rating": "Forward-looking efficiency margin",
                "AdjO": "Adjusted Offensive Efficiency",
                "AdjD": "Adjusted Defensive Efficiency",
                "Pace": "Possessions Per Game",
                "RSOS": "Remaining Strength of Schedule"
            };
            return tooltips[d] || null;
        })
        .html(d => {
            const shortNames = {
                "Conference Semis": "Conf<br>Semis",
                "Conference Finals": "Conf<br>Finals",
                "Predictive Rating": "Pred<br>Rating",
                "Season Rating": "Season<br>Rating",
                "Projected Record": "Proj<br>Record"
            };
            return shortNames[d] || d;
        })
        .on("click", function(event, d) { sortByColumn(d); });

    // Rows
    const rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .attr("data-team", d => d.Team)
        .attr("data-conf", d => WEST_TEAMS.has(d.Team) ? "west" : "east");

    rows.selectAll("td")
        .data(function(row) {
            return headers.map(column => {
                const key = column === "Season Rating" ? "EM Rating" : column;
                return {
                    column: column,
                    value: row[key],
                    team: row.Team,
                    addBorder: ["Team", "Record", "Predictive Rating", "Projected Record", "RSOS"].includes(column)
                };
            });
        })
        .enter()
        .append("td")
        .attr("class", d => {
            const classes = [];
            if (d.column === "Team") classes.push("team-cell");
            if (d.addBorder) classes.push("right-border");
            if (probColumns.includes(d.column)) classes.push("prob-cell");
            return classes.join(" ");
        })
        .attr("title", d => {
            if (probColumns.includes(d.column)) {
                const value = parseFloat(d.value);
                if (value == 1) return "100%";
                if (value == 0) return "0%";
                return (value * 100).toFixed(1) + "%";
            }
            return null;
        })
        .html(d => {
            if (d.column === "Team") {
                const logoUrl = getLogoUrl(d.value);
                const abbr = TEAM_ABBR_MAP[d.value] || "";
                const logo = logoUrl
                    ? `<img class="team-logo" src="${logoUrl}" alt="${abbr}" width="20" height="20">`
                    : "";
                return `${logo}<span class="team-name">${d.value}</span><span class="team-abbr">${abbr}</span>`;
            }
            if (probColumns.includes(d.column)) {
                const value = parseFloat(d.value);
                const pct = '<span class="pct">%</span>';
                if (value == 1) return `100${pct}`;
                if (value == 0) return `<span class="zero-prob">—</span>`;
                if (value > 0.999) return `&gt;99.9${pct}`;
                if (value < 0.001) return `&lt;0.1${pct}`;
                if (value > 0.990 || value < 0.010) return `${(value * 100).toFixed(1)}${pct}`;
                return `${Math.round(value * 100)}${pct}`;
            }
            if (ratingColumns.includes(d.column) || d.column === "Pace") {
                return formatValue(d.value, d.column);
            }
            return d.value;
        })
        .style("background-color", function(d) {
            if (probColumns.includes(d.column)) {
                const val = +d.value;
                if (val === 0) return null;
                return probColorScale(val);
            }
            return null;
        })
        .style("color", function(d) {
            if (probColumns.includes(d.column) && +d.value > 0.65) {
                return "#fff";
            }
            return null;
        });

    // Conference filter tabs
    d3.selectAll(".conf-tab").on("click", function() {
        d3.selectAll(".conf-tab").classed("active", false);
        d3.select(this).classed("active", true);
        const conf = d3.select(this).attr("data-conf");
        tbody.selectAll("tr").each(function() {
            const row = d3.select(this);
            if (conf === "all") {
                row.style("display", null);
            } else {
                row.style("display", row.attr("data-conf") === conf ? null : "none");
            }
        });
    });

    function applyConditionalShading(selection, column) {
        selection
            .style("background-color", function(d) {
                if (probColumns.includes(column)) {
                    const val = +d.value;
                    if (val === 0) return null;
                    return probColorScale(val);
                }
                return null;
            })
            .style("color", function(d) {
                if (probColumns.includes(column) && +d.value > 0.65) {
                    return "#fff";
                }
                return null;
            });
    }

    function updateTable() {
        const rows = tbody.selectAll("tr").data(data);
        rows.selectAll("td")
            .data(row => headers.map(column => {
                const key = column === "Season Rating" ? "EM Rating" : column;
                return { column: column, value: row[key], team: row.Team };
            }))
            .html(d => {
                if (d.column === "Team") {
                    const logoUrl = getLogoUrl(d.value);
                    const abbr = TEAM_ABBR_MAP[d.value] || "";
                    const logo = logoUrl
                        ? `<img class="team-logo" src="${logoUrl}" alt="${abbr}" width="20" height="20">`
                        : "";
                    return `${logo}<span class="team-name">${d.value}</span><span class="team-abbr">${abbr}</span>`;
                }
                if (probColumns.includes(d.column)) {
                    const value = parseFloat(d.value);
                    const pct = '<span class="pct">%</span>';
                    if (value == 1) return `100${pct}`;
                    if (value == 0) return `<span class="zero-prob">—</span>`;
                    if (value > 0.999) return `&gt;99.9${pct}`;
                    if (value < 0.001) return `&lt;0.1${pct}`;
                    if (value > 0.990 || value < 0.010) return `${(value * 100).toFixed(1)}${pct}`;
                    return `${Math.round(value * 100)}${pct}`;
                }
                return formatValue(d.value, d.column);
            })
            .each(function(d) { applyConditionalShading(d3.select(this), d.column); });
        rows.exit().remove();
    }

    function calculateWinPercentage(record) {
        const parts = record.split('-').map(Number);
        return parts[0] / (parts[0] + parts[1]);
    }

    let sortAscending = true;

    function sortByColumn(clickedColumn) {
        data.sort((a, b) => {
            let aValue, bValue;
            if (clickedColumn === "Record" || clickedColumn === "Projected Record") {
                aValue = calculateWinPercentage(a[clickedColumn === "Record" ? "Record" : "Projected Record"]);
                bValue = calculateWinPercentage(b[clickedColumn === "Record" ? "Record" : "Projected Record"]);
            } else {
                const dataColumn = clickedColumn === "Season Rating" ? "EM Rating" : clickedColumn;
                aValue = isNaN(a[dataColumn]) ? a[dataColumn] : +a[dataColumn];
                bValue = isNaN(b[dataColumn]) ? b[dataColumn] : +b[dataColumn];
            }
            return sortAscending ? d3.ascending(aValue, bValue) : d3.descending(aValue, bValue);
        });
        sortAscending = !sortAscending;
        updateTable();
    }
});
