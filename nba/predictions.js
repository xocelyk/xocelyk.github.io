d3.csv("https://raw.githubusercontent.com/xocelyk/nba/main/data/predictions/predicted_margins_and_win_probs.csv").then(data => {
    const columns = ["Date", "Home", "Away", "Predicted Home Margin", "Predicted Home Win Probability"];
    const colorScale = d3.scaleLinear()
    .domain([0, 1])
    .range(["#ffffff", "#33CEFF"]);

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Filter the data to include only the next 7 days
    const filteredData = data.filter(d => {
        const dateOfEntry = new Date(d.Date); // Assuming 'Date' is the column name
        return dateOfEntry <= sevenDaysFromNow;
    });

    const container = d3.select("#table-container-2");
    const table = container.append("table").attr("class", "table").attr("id", "2").style("width", "40%");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    function formatValue(value, column) {
        if (column === "Predicted Home Win Probability") {
            const percentage = (Number(value) * 100).toFixed(0); // Convert to percentage and format
            return percentage + "%";
        }
        // ... (other formatting conditions for different columns)
        return value; // Default return for columns without specific formatting
    }

    // Define column widths
    const columnWidths = {
        "Date": "30%",
        "Home": "15%",
        "Away": "15%",
        "Predicted Home Margin": "15%",
        "Predicted Home Win Probability": "15%"
    };

    // Add header row and set widths
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(d => d)
        .style("width", d => columnWidths[d])
        .on("click", function(event, d) { sortByColumn(d); });

    // Add rows
    const rows = tbody.selectAll("tr")
        .data(filteredData)
        .enter()
        .append("tr");

    // Add cells to rows and set widths
    rows.selectAll("td")
    .data(row => columns.map(column => ({ column: column, value: row[column], winProb: row["Predicted Home Win Probability"] })))
    .enter()
    .append("td")
    .text(d => formatValue(d.value, d.column))
    .style("background-color", d => {
        if (d.column === "Home") {
            return colorScale(Number(d.winProb) ** 1.5);  // Apply color scale for Home team
        }
        if (d.column === "Away") {
            return colorScale((1 - Number(d.winProb)) ** 1.5);  // Inverse color scale for Away team
        }
        return null;  // Default color for other cells
    })
    .style("width", d => columnWidths[d.column]);

    // ... (rest of your sorting logic)
});
