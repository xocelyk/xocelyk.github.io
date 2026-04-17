d3.csv("https://raw.githubusercontent.com/xocelyk/nba/main/data/main_2026.csv").then(data => {
    const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#ffffff", "#479ca3"]);

    const teamShortName = {
        "Atlanta Hawks": "ATL Hawks",
        "Boston Celtics": "BOS Celtics",
        "Brooklyn Nets": "BKN Nets",
        "Charlotte Hornets": "CHA Hornets",
        "Chicago Bulls": "CHI Bulls",
        "Cleveland Cavaliers": "CLE Cavaliers",
        "Dallas Mavericks": "DAL Mavericks",
        "Denver Nuggets": "DEN Nuggets",
        "Detroit Pistons": "DET Pistons",
        "Golden State Warriors": "GSW Warriors",
        "Houston Rockets": "HOU Rockets",
        "Indiana Pacers": "IND Pacers",
        "Los Angeles Clippers": "LAC Clippers",
        "Los Angeles Lakers": "LAL Lakers",
        "Memphis Grizzlies": "MEM Grizzlies",
        "Miami Heat": "MIA Heat",
        "Milwaukee Bucks": "MIL Bucks",
        "Minnesota Timberwolves": "MIN Timberwolves",
        "New Orleans Pelicans": "NOP Pelicans",
        "New York Knicks": "NYK Knicks",
        "Oklahoma City Thunder": "OKC Thunder",
        "Orlando Magic": "ORL Magic",
        "Philadelphia 76ers": "PHI 76ers",
        "Phoenix Suns": "PHX Suns",
        "Portland Trail Blazers": "POR Trail Blazers",
        "Sacramento Kings": "SAC Kings",
        "San Antonio Spurs": "SAS Spurs",
        "Toronto Raptors": "TOR Raptors",
        "Utah Jazz": "UTA Jazz",
        "Washington Wizards": "WAS Wizards"
    };
    const formatTeamName = name => teamShortName[name] || name;
    const formatTeamCell = name => {
        const short = teamShortName[name] || name;
        const idx = short.indexOf(' ');
        if (idx === -1) return `<span class="abbr">${short}</span>`;
        return `<span class="abbr">${short.slice(0, idx)}</span><span class="full">${short.slice(idx + 1)}</span>`;
    };

    const conferenceMap = {
        "Boston Celtics": "east",
        "Brooklyn Nets": "east",
        "New York Knicks": "east",
        "Philadelphia 76ers": "east",
        "Toronto Raptors": "east",
        "Chicago Bulls": "east",
        "Cleveland Cavaliers": "east",
        "Detroit Pistons": "east",
        "Indiana Pacers": "east",
        "Milwaukee Bucks": "east",
        "Atlanta Hawks": "east",
        "Charlotte Hornets": "east",
        "Miami Heat": "east",
        "Orlando Magic": "east",
        "Washington Wizards": "east",
        "Dallas Mavericks": "west",
        "Denver Nuggets": "west",
        "Golden State Warriors": "west",
        "Houston Rockets": "west",
        "Los Angeles Clippers": "west",
        "Los Angeles Lakers": "west",
        "Memphis Grizzlies": "west",
        "Minnesota Timberwolves": "west",
        "New Orleans Pelicans": "west",
        "Oklahoma City Thunder": "west",
        "Phoenix Suns": "west",
        "Portland Trail Blazers": "west",
        "Sacramento Kings": "west",
        "San Antonio Spurs": "west",
        "Utah Jazz": "west"
    };

    let currentConference = "all";
    let allData = data;

    function getFilteredData() {
        if (currentConference === "all") return allData;
        return allData.filter(d => conferenceMap[d.Team] === currentConference);
    }

    const container = d3.select("#table-container-1");
    const table = container.append("table").attr("class", "table").attr("id", "1");
    const thead = table.append("thead");
    const tbody = table.append("tbody");
    function formatValue(value, column) {
        if (isNaN(value)) return value; // Return the value as is if it's not a number
        const num = parseFloat(value);
        
        // Format to one decimal place for 'Pace' column
        if (column === "Pace") {
            return num.toFixed(1);
        }
        
        if (column === "Season Rating" || column === "Predictive Rating" || column === "AdjO" || column === "AdjD") {
            const formattedNumber = num.toFixed(1);
            return (num > 0 ? "+" : "") + formattedNumber;
        }

        if (column === "RSOS") {
            const formattedNumber = num.toFixed(1);
            return (num > 0 ? "+" : "") + formattedNumber;
        }

        if (column === "Playoffs" || column == "Conference Semis" || column === "Conference Finals" || column === "Finals" || column === "Champion") {
            const value = parseFloat(num);
            if (value == 1) {
                return "100%";
            }
            if (value == 0) {
                return "0%";
            }
            if (value > 0.999) {
                return ">99.9%";
            }
            if (value < 0.001) {
                return "<0.1%";
            }
            if (value > 0.990 || value < 0.010) {
                const percentage = (value * 100).toFixed(1);
                return `${percentage}%`;
            }
            const percentage = Math.round(value * 100);
            return `${percentage}%`;
        }
    }
    
    
    // Modify and filter column headers
    const headers = data.columns.map(column => {
        // Change 'EM Rating' to 'Season Rating'
        if (column === "EM Rating") {
            return "Season Rating";
        }
        return column;
    }).filter(column => column !== "Rank"); // Exclude the 'Rank' column

    const headerDisplayName = {
        "Conference Semis": "Conf Semis",
        "Conference Finals": "Conf Finals",
        "Predictive Rating": "Pred Rating"
    };
    const displayHeader = name => headerDisplayName[name] || name;

    // Create header row
    thead.append("tr")
        .selectAll("th")
        .data(headers)
        .enter()
        .append("th")
        .attr("data-column", d => d)
        .attr("class", d => ['Playoffs', 'Conference Semis', 'Conference Finals', 'Finals', 'Champion'].includes(d) ? "prob-cell" : "")
        .attr("title", d => {
            const tooltips = {
                "AdjO": "Adjusted Offensive Efficiency",
                "AdjD": "Adjusted Defensive Efficiency",
                "Pace": "Possessions Per Game",
                "RSOS": "Remaining Strength of Schedule"
            };
            return tooltips[d] || null;
        })
        .text(d => displayHeader(d))
        .on("click", function(event, d) { sortByColumn(d); })

    // Create rows
    const rows = tbody.selectAll("tr")
        .data(getFilteredData())
        .enter()
        .append("tr");

        rows.selectAll("td")
        .data(function(row) {
            return headers.map(column => {
                const key = column === "Season Rating" ? "EM Rating" : column
                return { column: column, value: row[key], addBorder: ["Team", "Record", "Predictive Rating", "Projected Record", "RSOS"].includes(column) };
            });
        })
        .enter()
        .append("td")
        .attr("class", d => {
            const classes = [];
            if (d.column === "Team") classes.push("team-cell");
            if (d.addBorder) classes.push("right-border");
            if (['Playoffs', 'Conference Semis', 'Conference Finals', 'Finals', 'Champion'].includes(d.column)) classes.push("prob-cell");
            return classes.join(" ");
        })
        .attr("title", d => {
            if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(d.column)) {
                const value = parseFloat(d.value);
                if (value == 1) return "100%";
                if (value == 0) return "0%";
                return (value * 100).toFixed(1) + "%";
            }
            return null;
        })
        .html(d => {
            const pct = '<span class="pct">%</span>';
            if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(d.column)) {
                const value = parseFloat(d.value);
                if (value == 1) return `<span class="clinch" aria-label="clinched"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.25 8.5 L6.75 12 L12.75 5"/></svg></span>`;
                if (value == 0) return `0${pct}`;
                if (value > 0.999) return `&gt;99.9${pct}`;
                if (value < 0.001) return `&lt;0.1${pct}`;
                if (value > 0.990 || value < 0.010) return `${(value * 100).toFixed(1)}${pct}`;
                return `${Math.round(value * 100)}${pct}`;
            }
            if (['Season Rating', 'Predictive Rating', 'AdjO', 'AdjD', 'RSOS', 'Pace'].includes(d.column)) {
                return formatValue(d.value, d.column);
            }
            if (d.column === 'Team') {
                return formatTeamCell(d.value);
            }
            return d.value;
        })
        .style("width", d => {
            if (d.column === "Team") return "14%";
            if (d.column === "Record") return "8%";
            if (d.column === "Season Rating") return "6%";
            if (d.column === "Predictive Rating") return "6%";
            if (d.column === "Projected Record") return "10%";
            if (d.column === "AdjO") return "6%";
            if (d.column === "AdjD") return "6%";
            if (d.column === "Pace") return "6%";
            if (d.column === "RSOS") return "6%";
            if (d.column === "Playoffs") return "6%";
            if (d.column === "Conference Finals") return "6%";
            if (d.column === "Conference Semis") return "6%";
            if (d.column === "Finals") return "6%";
            if (d.column === "Champion") return "6%";
            return "auto";
        })
        .style("background-color", function(d) {
            if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(d.column)) {
                return colorScale(+d.value);
            } else {
                return null;
            }
        });

        function applyConditionalShading(selection, column) {
            selection.style("background-color", function(d) {
                if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(column)) {
                    return colorScale(+d.value);
                } else {
                    return null;
                }
            }
        );
        }
        
        function updateTable() {
            const filtered = getFilteredData();
            tbody.selectAll("tr").remove();

            const rows = tbody.selectAll("tr")
                .data(filtered)
                .enter()
                .append("tr");

            rows.selectAll("td")
                .data(function(row) {
                    return headers.map(column => {
                        const key = column === "Season Rating" ? "EM Rating" : column;
                        return { column: column, value: row[key], addBorder: ["Team", "Record", "Predictive Rating", "Projected Record", "RSOS"].includes(column) };
                    });
                })
                .enter()
                .append("td")
                .attr("class", d => {
                    const classes = [];
                    if (d.column === "Team") classes.push("team-cell");
                    if (d.addBorder) classes.push("right-border");
                    if (['Playoffs', 'Conference Semis', 'Conference Finals', 'Finals', 'Champion'].includes(d.column)) classes.push("prob-cell");
                    return classes.join(" ");
                })
                .attr("title", d => {
                    if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(d.column)) {
                        const value = parseFloat(d.value);
                        if (value == 1) return "100%";
                        if (value == 0) return "0%";
                        return (value * 100).toFixed(1) + "%";
                    }
                    return null;
                })
                .html(d => {
                    const pct = '<span class="pct">%</span>';
                    if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(d.column)) {
                        const value = parseFloat(d.value);
                        if (value == 1) return `<span class="clinch" aria-label="clinched"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.25 8.5 L6.75 12 L12.75 5"/></svg></span>`;
                        if (value == 0) return `0${pct}`;
                        if (value > 0.999) return `&gt;99.9${pct}`;
                        if (value < 0.001) return `&lt;0.1${pct}`;
                        if (value > 0.990 || value < 0.010) return `${(value * 100).toFixed(1)}${pct}`;
                        return `${Math.round(value * 100)}${pct}`;
                    }
                    if (['Season Rating', 'Predictive Rating', 'AdjO', 'AdjD', 'RSOS', 'Pace'].includes(d.column)) {
                        return formatValue(d.value, d.column);
                    }
                    return d.value;
                })
                .style("width", d => {
                    if (d.column === "Team") return "14%";
                    if (d.column === "Record") return "8%";
                    if (d.column === "Season Rating") return "6%";
                    if (d.column === "Predictive Rating") return "6%";
                    if (d.column === "Projected Record") return "10%";
                    if (d.column === "AdjO") return "6%";
                    if (d.column === "AdjD") return "6%";
                    if (d.column === "Pace") return "6%";
                    if (d.column === "Playoffs") return "6%";
                    if (d.column === "Conference Finals") return "6%";
                    if (d.column === "Conference Semis") return "6%";
                    if (d.column === "Finals") return "6%";
                    if (d.column === "Champion") return "6%";
                    return "auto";
                })
                .style("background-color", function(d) {
                    if (['Playoffs', 'Conference Finals', 'Conference Semis', 'Finals', 'Champion'].includes(d.column)) {
                        return colorScale(+d.value);
                    }
                    return null;
                });
        }
        
        function calculateWinPercentage(record) {
            const parts = record.split('-').map(Number);
            const wins = parts[0];
            const losses = parts[1];
            return wins / (wins + losses);
        }
        

        let sortAscending = true;
        
        function sortByColumn(clickedColumn) {
            allData.sort((a, b) => {
                let aValue, bValue;

                if (clickedColumn === "Record") {
                    aValue = calculateWinPercentage(a.Record);
                    bValue = calculateWinPercentage(b.Record);
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

    // Conference toggle
    d3.selectAll(".toggle-btn").on("click", function() {
        d3.selectAll(".toggle-btn").classed("active", false);
        d3.select(this).classed("active", true);
        currentConference = d3.select(this).attr("data-conference");
        updateTable();
    });
});