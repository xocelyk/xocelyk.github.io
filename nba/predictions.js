d3.csv("https://raw.githubusercontent.com/xocelyk/nba/main/data/predictions/predicted_margins_and_win_probs.csv").then(data => {
    const columns = ["Date", "Home", "Away", "Favorite", "Margin", "Win"];
    const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#ffffff", "#33CEFF"]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Filter the data to include only the next 7 days
    const filteredData = data.filter(d => {
        const dateOfEntry = new Date(d.Date);
        return dateOfEntry <= sevenDaysFromNow;
    }).map(d => {
        const homeMargin = Number(d["Predicted Home Margin"]);
        const homeWinProb = Number(d["Predicted Home Win Probability"]);
        const homeFavored = homeMargin >= 0;
        const parts = d.Date.split("-");
        const formattedDate = months[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
        return {
            Date: formattedDate,
            Home: d.Home,
            Away: d.Away,
            Favorite: homeFavored ? d.Home : d.Away,
            Margin: Math.abs(homeMargin).toFixed(1),
            WinProb: homeFavored ? homeWinProb : 1 - homeWinProb,
            _homeWinProb: homeWinProb
        };
    });

    const container = d3.select("#table-container-2");
    const table = container.append("table").attr("class", "table predictions-table").attr("id", "2").style("width", "38%").style("table-layout", "fixed");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    function formatValue(value, column) {
        if (column === "Win") {
            return (Number(value) * 100).toFixed(0) + "%";
        }
        return value;
    }

    function shadeColor(d) {
        if ((d.column === "Home" || d.column === "Away") && d.value === d._favorite) {
            const favWinProb = d._homeWinProb >= 0.5 ? d._homeWinProb : 1 - d._homeWinProb;
            return colorScale(((favWinProb - 0.45) * 2) ** 1.4);
        }
        return null;
    }

    const columnPadding = {
        "Date": "4px 8px",
        "Home": "4px 8px",
        "Away": "4px 8px",
        "Favorite": "4px 8px 4px 25px",
        "Margin": "4px 8px",
        "Win": "4px 8px"
    };

    // Add header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(d => d)
        .style("padding", d => columnPadding[d])
        .on("click", function(event, d) { sortByColumn(d); });

    // Add rows
    const rows = tbody.selectAll("tr")
        .data(filteredData)
        .enter()
        .append("tr");

    // Add cells
    rows.selectAll("td")
        .data(row => columns.map(column => {
            const key = column === "Win" ? "WinProb" : column;
            return { column: column, value: row[key], _homeWinProb: row._homeWinProb, _favorite: row.Favorite };
        }))
        .enter()
        .append("td")
        .text(d => formatValue(d.value, d.column))
        .style("background-color", shadeColor)
        .style("padding", d => columnPadding[d.column]);

    let sortAscending = true;

    function sortByColumn(clickedColumn) {
        filteredData.sort((a, b) => {
            let aValue, bValue;
            const key = clickedColumn === "Win" ? "WinProb" : clickedColumn;
            aValue = isNaN(a[key]) ? a[key] : +a[key];
            bValue = isNaN(b[key]) ? b[key] : +b[key];
            return sortAscending ? d3.ascending(aValue, bValue) : d3.descending(aValue, bValue);
        });
        sortAscending = !sortAscending;
        updateTable();
    }

    function updateTable() {
        const rows = tbody.selectAll("tr").data(filteredData);

        rows.selectAll("td")
            .data(row => columns.map(column => {
                const key = column === "Win" ? "WinProb" : column;
                return { column: column, value: row[key], _homeWinProb: row._homeWinProb, _favorite: row.Favorite };
            }))
            .text(d => formatValue(d.value, d.column))
            .style("background-color", shadeColor);

        rows.exit().remove();
    }
});
