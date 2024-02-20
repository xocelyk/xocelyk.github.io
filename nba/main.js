/* TODO: fix sort by Season Rating */
d3.csv("https://raw.githubusercontent.com/xocelyk/nba/main/data/main_2024.csv").then(data => {
    const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#ffffff", "#33CEFF"]);

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
            const formattedNumber = num.toFixed(2);
            return (num > 0 ? "+" : "") + formattedNumber;
        }

        if (column === "Playoffs" || column === "Conference Finals" || column === "Finals" || column === "Champion") {
            const formattedNumber = (num * 100).toFixed(0);
            return formattedNumber + "%";
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

    // Create header row
    thead.append("tr")
        .selectAll("th")
        .data(headers)
        .enter()
        .append("th")
        .attr("data-column", d => d)
        .text(d => d)
        .on("click", function(event, d) { sortByColumn(d); })

    // Create rows
    const rows = tbody.selectAll("tr")
        .data(data)
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
        .attr("class", d => d.column === "Team" ? "team-cell" : (d.addBorder ? "right-border" : ""))
        .text(d => {
            if (['Playoffs', 'Conference Finals', 'Finals', 'Champion'].includes(d.column)) {
                const value = parseFloat(d.value);
                // Check for value greater than 0.999
                if (value > 0.999) {
                    return ">99.9%";
                }
                // Check for value less than 0.001
                else if (value < 0.001) {
                    return "<0.1%";
                }
                // For values >= 0.990 or <= 0.010, show one decimal place
                else if (value > 0.990 || value < 0.010) {
                    const percentage = (value * 100).toFixed(1);
                    return `${percentage}%`;
                }
                // For all other cases, round to the nearest whole number
                else {
                    const percentage = Math.round(value * 100);
                    return `${percentage}%`;
                }
            }
            if (['Season Rating', 'Predictive Rating', 'AdjO', 'AdjD', 'RSOS', 'Pace'].includes(d.column)) {
                return formatValue(d.value, d.column);
            }
            return d.value
        
        })
        .style("width", d => {
            if (d.column === "Team") return "20%";
            if (d.column === "Record") return "10%";
            if (d.column === "Season Rating") return "6%";
            if (d.column === "Predictive Rating") return "6%";
            if (d.column === "Projected Record") return "10%";
            if (d.column === "AdjO") return "6%";
            if (d.column === "AdjD") return "6%";
            if (d.column === "Pace") return "6%"
            if (d.column === "RSOS") return "6%";
            if (d.column === "Playoffs") return "6%";
            if (d.column === "Conference Finals") return "6%";
            if (d.column === "Finals") return "6%";
            if (d.column === "Champion") return "6%";

            return "auto";
        })
        .style("background-color", function(d) {
            if (['Playoffs', 'Conference Finals', 'Finals', 'Champion'].includes(d.column)) {
                return colorScale(+d.value);
            } else {
                return null;
            }
        });

        function applyConditionalShading(selection, column) {
            selection.style("background-color", function(d) {
                if (['Playoffs', 'Conference Finals', 'Finals', 'Champion'].includes(column)) {
                    return colorScale(+d.value);
                } else {
                    return null;
                }
            }
        );
        }
        
        function updateTable() {
            // Select all rows and bind them to the new, sorted data
            const rows = tbody.selectAll("tr").data(data);
        
            // Update existing cells
            rows.selectAll("td")
                .data(row => headers.map(column => {
                    const key = column === "Season Rating" ? "EM Rating" : column;
                    return { column: column, value: row[key] };
                }))
                .text(d => formatValue(d.value, d.column))
                .each(function(d) { applyConditionalShading(d3.select(this), d.column); }); // Apply shading
        
            // Enter new cells
            const newCells = rows.enter().append("tr").selectAll("td")
                .data(row => headers.map(column => {
                    const key = column === "Season Rating" ? "EM Rating" : column;
                    return { column: column, value: row[key] };
                }))
                .enter().append("td")
                .text(d => formatValue(d.value, d.column))
                .each(function(d) { applyConditionalShading(d3.select(this), d.column); }); // Apply shading
        
            // Exit and remove old rows
            rows.exit().remove();
        }
        
        function calculateWinPercentage(record) {
            const parts = record.split('-').map(Number);
            const wins = parts[0];
            const losses = parts[1];
            return wins / (wins + losses);
        }
        

        let sortAscending = true;
        
        function sortByColumn(clickedColumn) {
            // Sort data
            data.sort((a, b) => {
                let aValue, bValue;
        
                if (clickedColumn === "Record") {
                    // Special sorting logic for "Record" column
                    aValue = calculateWinPercentage(a.Record);
                    bValue = calculateWinPercentage(b.Record);
                } else {
                    // Default sorting logic for other columns
                    aValue = isNaN(a[clickedColumn]) ? a[clickedColumn] : +a[clickedColumn];
                    bValue = isNaN(b[clickedColumn]) ? b[clickedColumn] : +b[clickedColumn];
                }
        
                return sortAscending ? d3.ascending(aValue, bValue) : d3.descending(aValue, bValue);
            });
        
            sortAscending = !sortAscending; // Toggle the sort order
            updateTable(); // Update the table with sorted data
        }
        
        

        

    // Add click event listener to headers
    thead.selectAll("th")
    .data(headers)
    .enter()
    .append("th")
    .attr("data-column", d => d) // Ensure this matches the column names
    .text(d => d)
    .on("click", function(event, d) {
        sortByColumn(d);
    });
});

