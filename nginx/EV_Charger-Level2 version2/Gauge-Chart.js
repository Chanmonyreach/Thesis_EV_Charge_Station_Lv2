document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('Powers-Gauge-Chart');
  if (!canvas) {
    console.error('Canvas for gauge chart not found!');
    return;
  }
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 130; // Radius of the circle
  const lineWidth = 20; // Line width for the gauge

  // Function to draw the circular gauge
  function drawGauge(value) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing

    // Draw the background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = '#eee'; // Light gray background
    ctx.stroke();

    // Draw the filled portion (dynamic arc)
    const endAngle = (value / 100) * 2 * Math.PI - Math.PI / 2; // Percentage converted to angle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle); // Start from top of circle
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = value <= 30 ? '#ff4500' : value <= 70 ? '#ffd700' : '#32cd32'; // Color change based on value
    ctx.stroke();

    // Draw the value text in the center
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Charge Power: ' + value + '%', centerX, centerY);
  }

  const IP = "localhost";

  // Get userID and stationID from localStorage
  const userID = localStorage.getItem('userID');
  const stationID = localStorage.getItem('stationID');

  // Function to fetch chargePower from the API
  async function fetchChargePower() {
    if (stationID) {
      try {
        const response = await fetch(`http://${IP}:8081/requestData?stationID=${stationID}`);
        const data = await response.json();
        const chargePower = data.chargePower; // Adjust if the field name differs

        if (chargePower !== undefined) {
          drawGauge(chargePower); // Update the chart with fetched chargePower
        } else {
          drawGauge(0);
          console.error('chargePower not found in the API response.');
        }
      } catch (error) {
        drawGauge(0);
        console.error('Error fetching data:', error);
      }
    } else {
      // If stationID is not available, just draw 0 and continue refreshing
      drawGauge(0);
    }
  }

  // Fetch data initially
  fetchChargePower();

  // Set interval to fetch and update chargePower every 1 second
  setInterval(fetchChargePower, 100);
});
