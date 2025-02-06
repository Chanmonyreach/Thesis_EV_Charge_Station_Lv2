document.addEventListener('DOMContentLoaded', function () {
    const lineChartCanvas = document.getElementById('Powerline-Chart');
    const lineCtx = lineChartCanvas.getContext('2d');

    // Placeholder data objects
    const Monthlydata = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Monthly Usage',
            data: Array(12).fill(0), // Placeholder values
            borderColor: '#ffff00',
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            pointBackgroundColor: '#00ff00',
            pointRadius: 5,
            borderWidth: 2
        }]
    };

    const Yearlydata = {
        labels: [],
        datasets: [{
            label: 'Yearly Usage',
            data: Array(12).fill(0), // Placeholder values
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            pointBackgroundColor: '#ff0000',
            pointRadius: 5,
            borderWidth: 2,
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#fff',
                borderWidth: 1,
                callbacks: {
                    // Modify the label to show the value with unit
                    label: function (context) {
                        const value = context.raw; // Get the raw value
                        const unit = ' kWh'; // Adjust the unit here as needed
                        return value + unit; // Display value with unit
                    }
                }
            },
            legend: {
                labels: {
                    color: '#fff'
                }
            }
        },
        scales: {
            y: {
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: {
                    color: '#fff'
                },
                grid: {
                    color: '#fff'
                }
            },
            x: {
                ticks: {
                    color: '#fff'
                },
                grid: {
                    color: '#fff'
                }
            }
        }
    };

    const IP = "localhost";

    let currentChart;
    const userID = localStorage.getItem('userID');
    let lastMonthlyData = null; // Store previous monthly data
    let lastYearlyData = null;  // Store previous yearly data

    // Fetch and populate monthly data
    async function fetchRecordPowerMonthly() {
        try {
            const response = await fetch(`http://${IP}:8081/recordeData?userID=${userID}`);
            if (!response.ok){
                return;
            }
            const User_Record_Data = await response.json();
            const years = User_Record_Data.years;

            if (Array.isArray(years)) {
                // Find the largest year (most recent year)
                const latestYear = Math.max(...years);

                const monthlyDataArray = Array(12).fill(0); // Initialize array for the 12 months

                // Fetch monthly data for the most recent year
                for (let month = 1; month <= 12; month++) {
                    const res = await fetch(`http://${IP}:8081/recordeData?userID=${userID}&month=${month}&year=${latestYear}`);
                    if (res.ok) {
                        const data = await res.json();
                        const value = parseFloat(data.value); // Ensure the value is a number
                        if (!isNaN(value)) {
                            monthlyDataArray[month - 1] += value; // Aggregate monthly values
                        }
                    }
                }

                // Compare with the last fetched data
                if (JSON.stringify(monthlyDataArray) !== JSON.stringify(lastMonthlyData)) {
                    // Update the chart if data has changed
                    Monthlydata.datasets[0].label = 'Monthly Usage Of ' + latestYear;
                    Monthlydata.datasets[0].data = monthlyDataArray;
                    createChart(Monthlydata); // Display monthly chart
                    lastMonthlyData = monthlyDataArray; // Update last fetched data
                }
            }
        } catch (error) {
            console.error('Error fetching monthly data:', error);
        }
    }

    async function fetchRecordPowerYearly() {
        try {
            const response = await fetch(`http://${IP}:8081/recordeData?userID=${userID}`);
            if (!response.ok){
                return;
            }

            const User_Record_Data = await response.json();
            const years = User_Record_Data.years;

            if (Array.isArray(years)) {
                const yearlyDataArray = Array(years.length).fill(0); // Initialize the yearly data array
                for (const year of years) {
                    const res = await fetch(`http://${IP}:8081/recordeData?userID=${userID}&year=${year}`);
                    if (res.ok) {
                        const data = await res.json();
                        const value = parseFloat(data.value); // Ensure the value is a number
                        if (!isNaN(value)) {
                            yearlyDataArray[years.length - 1] += value; // Aggregate yearly values
                        }
                    }
                }

                // Compare with the last fetched data
                if (JSON.stringify(yearlyDataArray) !== JSON.stringify(lastYearlyData)) {
                    // Update the chart if data has changed
                    Yearlydata.labels = years;
                    Yearlydata.datasets[0].data = yearlyDataArray;
                    createChart(Yearlydata); // Display yearly chart
                    lastYearlyData = yearlyDataArray; // Update last fetched data
                }
            }
        } catch (error) {
            console.error('Error fetching yearly data:', error);
        }
    }

    // Function to create a chart
    function createChart(data) {
        if (currentChart) {
            currentChart.destroy(); // Destroy the existing chart
        }
        currentChart = new Chart(lineCtx, {
            type: 'line',
            data: data,
            options: options
        });
    }

    // Default chart: Monthly
    createChart(Monthlydata); 

    // Fetch data
    fetchRecordPowerMonthly();
    fetchRecordPowerYearly();

    setInterval(() => {
        fetchRecordPowerMonthly();
        fetchRecordPowerYearly();
    }, 1000);

    // Dropdown for chart switching
    const chartSelect = document.getElementById('chart-select');
    chartSelect.addEventListener('change', function () {
        const selectedValue = chartSelect.value;
        if (selectedValue === 'monthly') {
            createChart(Monthlydata);
        } else if (selectedValue === 'yearly') {
            createChart(Yearlydata);
        }
    });
});
