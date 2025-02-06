document.addEventListener('DOMContentLoaded', function () {
    const lineChartCanvas = document.getElementById('Spendline-Chart');
    const lineCtx = lineChartCanvas.getContext('2d');

    // Placeholder data objects
    const Monthlydata = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Fixed expense',
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
            label: 'Yearly expenses',
            data: Array(12).fill(0), // Placeholder values
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            pointBackgroundColor: '#ff0000',
            pointRadius: 5,
            borderWidth: 2
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
                    label: function (context) {
                        const value = context.raw;
                        const unit = ' $';
                        return unit + value;
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
    let lastFetchedMonthlyData = []; // To store the last fetched monthly data
    let lastFetchedYearlyData = []; // To store the last fetched yearly data

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
                const latestYear = Math.max(...years);
                const monthlyDataArray = Array(12).fill(0);

                for (let month = 1; month <= 12; month++) {
                    const res = await fetch(`http://${IP}:8081/recordeData?userID=${userID}&month=${month}&year=${latestYear}`);
                    if (res.ok) {
                        const data = await res.json();
                        const cost = parseFloat(data.cost);
                        if (!isNaN(cost)) {
                            monthlyDataArray[month - 1] += cost;
                        }
                    }
                }

                // If the data is different from the last fetched data, update the chart
                if (JSON.stringify(monthlyDataArray) !== JSON.stringify(lastFetchedMonthlyData)) {
                    Monthlydata.datasets[0].label = 'Fixed expense Of ' + latestYear;
                    Monthlydata.datasets[0].data = monthlyDataArray;
                    createChart(Monthlydata);
                    lastFetchedMonthlyData = [...monthlyDataArray]; // Update the last fetched data
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
                const yearlyDataArray = Array(years.length).fill(0);
                for (const year of years) {
                    const res = await fetch(`http://${IP}:8081/recordeData?userID=${userID}&year=${year}`);
                    if (res.ok) {
                        const data = await res.json();
                        const cost = parseFloat(data.cost);
                        if (!isNaN(cost)) {
                            yearlyDataArray[years.length - 1] += cost;
                        }
                    }
                    Yearlydata.labels[0] = years;
                    Yearlydata.datasets[0].data = yearlyDataArray;

                    // If the data is different from the last fetched data, update the chart
                    if (JSON.stringify(yearlyDataArray) !== JSON.stringify(lastFetchedYearlyData)) {
                        createChart(Yearlydata);
                        lastFetchedYearlyData = [...yearlyDataArray]; // Update the last fetched data
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching yearly data:', error);
        }
    }

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

    // Set interval to update data every 5 seconds (or adjust based on your needs)
    setInterval(() => {
        fetchRecordPowerMonthly();
        fetchRecordPowerYearly();
    }, 5000);

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
