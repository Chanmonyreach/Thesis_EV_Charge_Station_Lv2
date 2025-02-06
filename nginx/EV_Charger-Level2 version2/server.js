const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
const port = 8081;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Allow larger payloads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost', // Change 'ionic' to 'localhost'
    user: 'root',
    password: '123456789',
    database: 'ironic_ev_surge',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Replace with your actual bot token
const BOT_TOKEN = "7662678295:AAHCgdODXnWhWvLL7VCgarKTEIk2hQTb6tk";

// Create a new bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Define regex for payment messages including date and Trx. ID
const PAYMENT_PATTERN = /\$(\d+(\.\d{1,2})?) paid by ([\w\s]+) \(\*(\d{3})\) on ([\w\s\d:,]+ \d{1,2}:\d{2} [APM]{2}) via (?:ABA KHQR|ABA PAY).+Trx\. ID: (\d+),/;

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    const [existingUser] = await db.promise().query(checkUserQuery, [username, email]);

    if (existingUser.length > 0) {
      return res.status(400).send({ message: 'Username or email already exists' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    const BankHolder = 'N/A', BankNumber = 0;

    // Insert the user into the database
    const insertQuery = 'INSERT INTO users (username, email, password, BankHolder, BankNumber) VALUES (?, ?, ?, ?, ?)';
    await db.promise().query(insertQuery, [username, email, hashedPassword, BankHolder, BankNumber]);

    return res.send({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration process:', err);
    return res.status(500).send({ message: 'Error registering user' });
  }
});


// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, result) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).send({ message: 'Error checking user' });
    }

    if (result.length === 0) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    try {
      const match = await bcrypt.compare(password, result[0].password);
      if (!match) {
        return res.status(401).send({ message: 'Invalid password' });
      }
      const userID = result[0].userID; // Assuming 'id' is the column name for userID

      res.send({ message: 'Login successful', userID });
    } catch (error) {
      console.error('Error comparing password:', error);
      return res.status(500).send({ message: 'Error processing login' });
    }
  });
});

// Endpoint to receive data from station
app.post('/stationData', (req, res) => {
  console.log('Received data:', req.body);

  const { stationID, targetPower, chargePower, cost, chargeProcess, chargeTime, location } = req.body;

  // Validate stationID (ensure it's from the body)
  if (!stationID) {
    return res.status(400).send({ message: 'stationID is required' });
  }

  // If updating targetPower, chargePower, cost, chargeTime, location
  if (targetPower && chargePower && cost && chargeTime && location) {
    // Validate chargeTime format (HH:MM:SS)
    const timePattern = /^([01]?\d|2[0-3]):[0-5]?\d(:[0-5]?\d)?$/;
    if (!timePattern.test(chargeTime)) {
      return res.status(400).send({ message: 'Invalid chargeTime format. Expected HH:MM:SS.' });
    }

    const [longitude, latitude] = location.split(' '); // Validate space-separated coordinates
    if (!longitude || !latitude) {
      return res.status(400).send({ message: 'Invalid location format. Expected POINT(longitude latitude).' });
    }

    const formattedLocation = `POINT(${longitude} ${latitude})`;

    // Check if stationID exists
    const checkQuery = 'SELECT * FROM stations WHERE stationID = ?';
    db.query(checkQuery, [stationID], (err, result) => {
      if (err) {
        console.error('Error checking station ID:', err);
        return res.status(500).send({ message: 'Error checking station data' });
      }

      if (result.length > 0) {
        // Update existing station
        const updateQuery =
          'UPDATE stations SET targetPower = ?, chargePower = ?, cost = ?, chargeTime = ?, location = ST_GeomFromText(?) WHERE stationID = ?';
        db.query(
          updateQuery,
          [targetPower, chargePower, cost, chargeTime, formattedLocation, stationID],
          (err, updateResult) => {
            if (err) {
              console.error('Error updating station data:', err);
              return res.status(500).send({ message: 'Error updating station data' });
            }
            res.status(200).send({ message: 'Station data updated successfully' });
          }
        );
      } else {
        // Insert new station
        const payment = 'N/A', chargeProcess = 'N/A', connection = 'Available';
        const insertQuery =
          'INSERT INTO stations (stationID, targetPower, chargePower, cost, payment, chargeProcess, chargeTime, location, connection) VALUES (?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(?),?)';
        db.query(insertQuery, [stationID, targetPower, chargePower, cost, payment, chargeProcess, chargeTime, formattedLocation, connection], (err, insertResult) => {
          if (err) {
            console.error('Error inserting station data:', err);
            return res.status(500).send({ message: 'Error inserting station data' });
          }
          res.status(200).send({ message: 'Station data inserted successfully' });
        });
      }
    });
  }
  // If only updating chargeProcess
  else if (chargeProcess) {
    const updateQuery = 'UPDATE stations SET chargeProcess = ? WHERE stationID = ?';
    db.query(updateQuery, [chargeProcess, stationID], (err, updateResult) => {
      if (err) {
        console.error('Error updating charge process:', err);
        return res.status(500).send({ message: 'Error updating charge process' });
      }
      res.status(200).send({ message: 'Charge process updated successfully' });
    });
  }
  // Missing required fields
  else {
    res.status(400).send({ message: 'Invalid request. Missing required fields.' });
  }
});

app.get('/stationProcess', (req, res) => {
  const { stationID , chargeStatuse} = req.query; // Retrieve query parameters

    // Validate stationID (ensure it's from the body)
    if (!stationID || !chargeStatuse) {
      return res.status(400).send({ message: 'stationID and chargeStatuse are required' });
    }

    const updateQuery = 'UPDATE stations SET chargeProcess = ? WHERE stationID = ?';
    db.query(updateQuery, [chargeStatuse, stationID], (err, updateResult) => {
      if (err) {
        console.error('Error updating charge process:', err);
        return res.status(500).send({ message: 'Error updating charge process' });
      }
      res.status(200).send({ message: 'Charge statuse updated successfully' });
    });

});

app.get('/requestData', (req, res) => {
  const { userID, stationID } = req.query; // Retrieve query parameters

  // Validate input: Ensure either userID or stationID is provided
  if (!userID && !stationID) {
    return res.status(400).json({ message: 'Either userID or stationID is required' });
  }

  // If userID is provided, fetch user data
  if (userID) {
    const userQuery = 'SELECT username, email, BankHolder, BankNumber, wallet, profileImg FROM users WHERE userID = ?';

    db.query(userQuery, [userID], (err, userResult) => {
      if (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ message: 'Error fetching user data' });
      }

      if (userResult.length === 0) {
        return res.status(404).json({ message: 'No user data found for this user' });
      }

      // Respond with user data
      const userData = userResult[0];

      // Convert profileImg (Buffer) to Base64 string if it's not null
      let profileImg = null;
      if (userData.profileImg && userData.profileImg.length > 0) {
        profileImg = `data:image/jpeg;base64,${userData.profileImg.toString('base64')}`;
      }

      return res.json({
        username: userData.username,
        email: userData.email,
        BankHolder: userData.BankHolder,
        BankNumber:userData.BankNumber,
        wallet: userData.wallet,
        profileImg: profileImg, // Send the Base64 string of the image
      });
    });
  }

  // If stationID is provided, fetch station data
  if (stationID) {
    const stationQuery =
      'SELECT stationID, targetPower, chargePower, cost, payment, chargeProcess, chargeTime, location FROM stations WHERE stationID = ?';

    db.query(stationQuery, [stationID], (err, stationResult) => {
      if (err) {
        console.error('Error fetching station data:', err);
        return res.status(500).json({ message: 'Error fetching station data' });
      }

      if (stationResult.length === 0) {
        return res.status(404).json({ message: 'No station data found for this station' });
      }

      // Process and respond with station data
      const stationData = stationResult[0];

      // Format chargeTime
      let formattedChargeTime = 'Not available';
      if (stationData.chargeTime) {
        const [hours, minutes] = stationData.chargeTime.split(':');
        formattedChargeTime = `${hours} h ${minutes} min`;
      }

      // Handle location (if null, return a default value)
      let formattedLocation = { longitude: "Not available", latitude: "Not available" };  // Default values
      if (stationData.location) {
        if (typeof stationData.location === 'string') {
          // If location is a string like "POINT(longitude latitude)", process it
          const locationParts = stationData.location.replace('POINT(', '').replace(')', '').split(' ');
          formattedLocation = { longitude: locationParts[0], latitude: locationParts[1] };
        } else if (stationData.location && stationData.location.x && stationData.location.y) {
          // If it's a MySQL geometry object (Point)
          formattedLocation = { longitude: stationData.location.x, latitude: stationData.location.y };
        }
      }

      return res.json({
        stationID: stationData.stationID,
        targetPower: stationData.targetPower,
        chargePower: stationData.chargePower,
        cost: stationData.cost,
        payment: stationData.payment,
        chargeProcess: stationData.chargeProcess,
        chargeTime: formattedChargeTime,
        location: formattedLocation,
      });
    });

    return; // Prevent further execution
  }
});

// Route for handling image upload and update
app.post('/updateUserData', async (req, res) => {
  const { userID, username, email, profileImg } = req.body;

  // Validate required fields
  if (!userID || !username || !email) {
    return res.status(400).json({ message: 'userID, username, and email are required' });
  }

  // Check if username or email is already in use by another user
  const checkQuery = 'SELECT * FROM users WHERE (username = ? OR email = ?) AND userID != ?';
  db.query(checkQuery, [username, email, userID], (err, result) => {
    if (err) {
      console.error('Error checking username/email:', err);
      return res.status(500).json({ message: 'Error checking username or email' });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: 'Username or email is already in use' });
    }

    // If there is a profile image, convert it from base64 to a buffer
    let profileImgBuffer = null;
    if (profileImg) {
      const buffer = Buffer.from(profileImg, 'base64');  // Convert base64 to buffer
      profileImgBuffer = buffer;
    }

    // Update user data
    const updateQuery = 'UPDATE users SET username = ?, email = ?, profileImg = ? WHERE userID = ?';
    db.query(updateQuery, [username, email, profileImgBuffer || null, userID], (err, updateResult) => {
      if (err) {
        console.error('Error updating user data:', err);
        return res.status(500).json({ message: 'Error updating user data' });
      }

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User data updated successfully' });
    });
  });
});

// API route for fetching daily data
app.get('/recordeData', (req, res) => {
  const { userID, date, month, year } = req.query;

  // Request the year from your database
  if (userID && !date && !month && !year) {
    const dateQuery = `
      SELECT DISTINCT date AS date
      FROM historical_data
      WHERE userID = ? 
      ORDER BY date DESC;
    `;

    db.query(dateQuery, [userID], (err, dateResults) => {
      if (err) {
        console.error('Error fetching dates:', err);
        return res.status(500).json({ message: 'Error fetching dates' });
      }

      if (dateResults.length === 0) {
        return res.status(404).json({ message: 'No dates found for this user' });
      }

      const dates = dateResults.map(result => {
        const date = new Date(result.date);  // Ensure it's a valid Date object

        // Manually format the date to YYYY-MM-DD HH:mm:ss (24-hour format)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        return formattedDate;
      });

      const years = dates.map(date => date.split(' ')[0].split('-')[0]);
      const uniqueYears = [...new Set(years)];

      return res.json({
        years: uniqueYears,
        dates: dates,
      });
    });
  }

    // SQL query for daily data
  else if (userID && date) {
    // Decode the date
    let decodedDate = decodeURIComponent(date); // Decode URL-encoded string
    decodedDate = decodedDate.replace(',', ''); // Remove commas if present

    // Split the date and time
    let [datePart, timePart] = decodedDate.split(' ');

    // Combine date and time in MySQL compatible format
    const formattedDate = `${datePart} ${timePart}`; // Assuming the time is already in 24-hour format

    const query = `
      SELECT value, cost, stationID, date
      FROM historical_data
      WHERE userID = ? 
        AND date = ?;
    `;

    db.query(query, [userID, formattedDate], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'No data found for this date' });
      }

      const stationID = results[0].stationID; // Get stationID from the query result

      const stationQuery = 'SELECT location FROM stations WHERE stationID = ?';

      db.query(stationQuery, [stationID], (err, stationResult) => {
        if (err) {
          console.error('Error fetching station data:', err);
          return res.status(500).json({ message: 'Error fetching station data' });
        }

        if (stationResult.length === 0) {
          return res.status(404).json({ message: 'No station data found for this station' });
        }

        const locationRecode = stationResult[0];

        let formattedLocation = { longitude: "Not available", latitude: "Not available" };
        if (locationRecode.location) {
          if (typeof locationRecode.location === 'string') {
            const locationParts = locationRecode.location.replace('POINT(', '').replace(')', '').split(' ');
            formattedLocation = { longitude: locationParts[0], latitude: locationParts[1] };
          } else if (locationRecode.location && locationRecode.location.x && locationRecode.location.y) {
            formattedLocation = { longitude: locationRecode.location.x, latitude: locationRecode.location.y };
          }
        }

        const record = results[0]; 
        return res.json({
          value: record.value,
          cost: record.cost,
          location: formattedLocation,
          date: new Date(record.date).toLocaleString('en-CA'),
        });
      });
    });
  }

  // SQL query for monthly data
  else if (userID && month && year) {
    const query = `
    SELECT  
          SUM(value) AS total_value, 
          SUM(cost) AS total_cost
    FROM historical_data
    WHERE userID = ? 
      AND YEAR(date) = ?
      AND MONTH(date) = ?;
    `;
    db.query(query, [userID, year, month], (err, results) => {  // Use db.query here
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const record = results[0];
      return res.json({
        value: record.total_value, // Changed from record.value
        cost: record.total_cost,   // Changed from record.cost
      });
    });
  }

  // SQL query for yearly data
  else if (userID && year) {
    const query = `
      SELECT 
             SUM(value) AS total_value, 
             SUM(cost) AS total_cost
      FROM historical_data
      WHERE userID = ? 
        AND YEAR(date) = ?;
    `;
    db.query(query, [userID, year], (err, results) => {  // Use db.query here
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const record = results[0];
      return res.json({
        value: record.total_value, // Changed from record.value
        cost: record.total_cost,   // Changed from record.cost
      });
    });
  } else {
    res.status(400).json({ error: 'Missing required parameters.' });
  }
});

// Route to update notification
app.post('/updatenotification', async (req, res) => {
  const { userID, chargeStatuse } = req.body; // Get ID and charge status from request body

  if (!userID || !chargeStatuse) {
    return res.status(400).json({ error: 'userID and chargeStatuse are required' });
  }

  // Handle charge status 'complete'
  if (userID && chargeStatuse === 'complete') {
    const message = 'Your charging session has been completed successfully. We sincerely appreciate your trust in our service. Thank you for choosing us, and we wish you a pleasant and safe journey ahead!';
    await insertNotification(userID, message);
    return res.status(200).json({ message: 'Charging session completed successfully' });
  }

  // Handle charge status 'stop' or 'error'
  if (chargeStatuse === 'stop' || chargeStatuse === 'error') {
    const message = chargeStatuse === 'stop'
      ? 'You have successfully stopped your charging session. We appreciate your use of our service and thank you for your understanding.'
      : 'Unfortunately, an issue occurred during your charging session. Thank you for your understanding.';
    await insertNotification(userID, message);
    return res.status(200).json({ message: `Charging status updated: ${chargeStatuse}` });
  }

  // If chargeStatuse is not 'complete', 'stop', or 'error'
  return res.status(400).json({ error: 'Invalid charge status' });
});


// Route to get all notifications or notifications for a specific user
app.get('/getnotifications', async (req, res) => {
  const { userID } = req.query;  // Get userID from query parameter (not from body)

  let query = 'SELECT * FROM Notification ORDER BY date DESC';  // Default: get all notifications ordered by date

  if (userID) {
    query = 'SELECT ID,date, message FROM Notification WHERE userID = ? ORDER BY date DESC';  // Get notifications for a specific user
  }

  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error('Error fetching notifications: ', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Check if there are results and format the response
    if (results.length > 0) {
      const notifications = results.map(notifications => ({
        ID:notifications.ID,
        Date: notifications .date,
        Message: notifications .message,
      }));

      return res.json(notifications);  // Return an array of notifications
    } else {
      return res.status(404).json({ message: 'No notifications found' });
    }
  });
});

// Route to delete a notification for a specific user based on userID and ID
app.delete('/deletenotification', async (req, res) => {
  const { userID, ID } = req.query; // Get userID and ID from query parameters

  // Validate that all required parameters are provided
  if (!userID || !ID) {
    return res.status(400).json({ error: 'userID and ID are required' });
  }

  try {
    // SQL query to delete the notification using ID and userID
    const deleteQuery = 'DELETE FROM Notification WHERE ID = ? AND userID = ?';

    db.query(deleteQuery, [ID, userID], (err, results) => {
      if (err) {
        console.error('Error deleting notification: ', err);
        return res.status(500).json({ error: 'Failed to delete notification' });
      }

      // Check if a notification was deleted
      if (results.affectedRows > 0) {
        return res.status(200).json({ message: 'Notification deleted successfully' });
      } else {
        return res.status(404).json({ message: 'Notification not found' });
      }
    });
  } catch (error) {
    console.error('Unexpected error: ', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

const insertNotification = async (userID, message) => {
  return new Promise((resolve, reject) => {
      db.query('INSERT INTO Notification (userID, message) VALUES (?, ?)', [userID, message], (err, results) => {
          if (err) return reject(err);
          resolve(results);
      });
  });
};

const insertHistoricalData = async (userID, stationID, power, cost) => {
  return new Promise((resolve, reject) => {
      db.query('INSERT INTO historical_data (userID, stationID, value, cost) VALUES (?, ?, ?, ?)', [userID, stationID, power, cost], (err, results) => {
          if (err) return reject(err);
          resolve(results);
          resetStationData(stationID);
      });
  });
};

const resetStationData = async (stationID) => {
  const targetPower = 0, chargePower = 0, cost = 0, payment = "N/A", Process = "N/A", duration = "00:00:00", connection = "Available";
  return new Promise((resolve, reject) => {
      db.query(
        'UPDATE stations SET targetPower = ?, chargePower = ?, cost = ?, payment = ?, chargeProcess = ?, chargeTime = ?, connection = ? WHERE stationID = ?',
        [targetPower, chargePower, cost, payment, Process, duration, connection, stationID],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
      });
  });
};


app.get('/checking', (req, res) => {
  const { stationID, userID } = req.query;

  if (!stationID) {
      return res.status(400).json({ error: 'stationID is required' });
  }

  if (stationID && !userID) {
      db.query('SELECT connection FROM stations WHERE stationID = ?', [stationID], (err, results) => {
          if (err) return res.status(500).json({ error: 'Database error occurred' });
          if (results.length === 0) return res.status(404).json({ connectionAvailable: false });
          const isAvailable = results[0].connection === 'Available';
          return res.status(200).json({ connectionAvailable: isAvailable });
      });
      return;
  }

  if (stationID && userID) {
    db.query('UPDATE stations SET connection = ? WHERE stationID = ?', [userID, stationID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error occurred' });
        }

        // Check if any rows were affected (i.e., update was successful)
        if (results.affectedRows > 0) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(404).json({ success: false });
        }
    });
    return;
  }
  return res.status(400).json({ error: 'Missing required parameters' });
});

// For payment
app.get('/payment', (req, res) => {
  // Access stationID from query parameters
  const { stationID } = req.query;

  // Validate that stationID is provided
  if (!stationID) {
    return res.status(400).json({ error: 'stationID is required' });
  }

  // Step 1: Get the station's connection status
  db.query('SELECT connection FROM stations WHERE stationID = ?', [stationID], (err, status) => {
    if (err) {
      return res.status(500).json({ error: 'Database error occurred while fetching station connection status' });
    }

    if (status.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Assuming connection field contains userID
    let userID = status[0].connection; 

    // If the station is available, no payment is required
    if (userID === 'Available') {
      return res.status(200).json({ message: 'Station is available for charging.' });
    }

    // Step 2: Get the user's wallet balance
    db.query('SELECT wallet FROM users WHERE userID = ?', [userID], (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error occurred while fetching user wallet' });
      }

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      let money = parseFloat(users[0].wallet); // Ensure the wallet balance is treated as a float

      // Step 3: Get the station's cost and charge power
      db.query('SELECT cost, chargePower FROM stations WHERE stationID = ?', [stationID], (err, stations) => {
        if (err) {
          return res.status(500).json({ error: 'Database error occurred while fetching station cost and charge power' });
        }

        if (stations.length === 0) {
          return res.status(404).json({ error: 'Station not found' });
        }

        let cost = parseFloat(stations[0].cost); // Ensure the cost is treated as a float
        let power = parseFloat(stations[0].chargePower);

        // Step 4: Check if the user has enough money
        if (money >= cost) {
          const total = money - cost;

          // Step 5: Update the user's wallet balance
          db.query('UPDATE users SET wallet = ? WHERE userID = ?', [total, userID], (err, userUpdate) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update user wallet' });
            }

            if (userUpdate.affectedRows === 0) {
              return res.status(404).json({ error: 'Failed to update user wallet' });
            }

            // Step 6: Update the station's payment status
            const paymentStatus = 'paid';
            const connectionStatuse = 'Available';

            db.query('UPDATE stations SET payment = ?, connection = ? WHERE stationID = ?', [paymentStatus, connectionStatuse, stationID], (err, stationUpdate) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to update station payment status' });
              }

              if (stationUpdate.affectedRows === 0) {
                return res.status(404).json({ error: 'Failed to update station payment status' });
              }

              // Insert notifications and log historical data
              const message = 'Your payment was successful. Thank you for choosing us! While your EV charges, enjoy your time. We appreciate your patience!';
              insertNotification(userID, message);
              insertHistoricalData(userID, stationID, power, cost); // Log power used and cost

              // Successfully processed the payment
              return res.status(200).json({ message: 'Payment processed successfully' });
            });
          });
        } else {
          // User does not have enough money
          return res.status(400).json({ error: 'Insufficient funds. Please make sure you have enough money before trying again.' });
        }
      });
    });
  });
});

// Handling incoming messages
bot.on('message', async (msg) => {
  console.log("Received message:", msg); // Add logging for incoming message
  const chatId = msg.chat.id;
  const text = msg.text;

  // Match the payment pattern
  const match = PAYMENT_PATTERN.exec(text);

  if (match) {
      const amount = match[1];  // Amount extracted
      const payerName = match[3];  // Payer's name
      const accountLastDigits = match[4];  // Account last digits
      const paymentDate = match[5];  // Payment date
      const trxId = match[6];  // Transaction ID

      // Constructing the response with extracted information
      const response = `
          Payment Info:
          - Amount: $${amount}
          - Payer: ${payerName}
          - Account Last Digits: ${accountLastDigits}
          - Date: ${paymentDate}
          - Trx. ID: ${trxId}
      `;

      // Query the database to check user and update wallet
      db.query(`SELECT userID, wallet FROM users WHERE BankHolder=? AND BankNumber=?`, [payerName, accountLastDigits], async (err, users) => {
          if (err) {
              console.error('Error checking user:', err);
              bot.sendMessage(chatId, 'Error checking user.');
              return;
          }
          if (users.length === 0) {
              bot.sendMessage(chatId, 'BankHolder or BankNumber not exists.');
              return;
          }

          let userID = users[0].userID;
          let wallet = parseFloat(users[0].wallet) + parseFloat(amount); // Update wallet

          db.query(`INSERT INTO Topup (userID, BankHolder, BankNumber, Amount, TransferID, TopDate) VALUES(?, ?, ?, ?, ?, ?)`, [userID, payerName, accountLastDigits, amount, trxId, paymentDate], (err, topup) => {
              if (err) {
                  console.error('Error inserting into Topup:', err);
                  bot.sendMessage(chatId, 'Error saving top-up information.');
                  return;
              }

              db.query(`UPDATE users SET wallet = ? WHERE userID=? AND BankHolder=? AND BankNumber=?`, [wallet, userID, payerName, accountLastDigits], (err, update) => {
                  if (err) {
                      console.error('Error updating user wallet:', err);
                      bot.sendMessage(chatId, 'Error updating wallet.');
                      return;
                  }
                  if (update.affectedRows === 0) {
                      bot.sendMessage(chatId, 'Failed to update wallet, user or bank details may be incorrect.');
                      return;
                  }

                  const message = 'Your payment to Tp UP has been successfully processed. We sincerely thank you for choosing our service and appreciate your trust in us. ';
                  insertNotification(userID, message);
                  // Send the response to the chat
                  bot.sendMessage(chatId, response);
              });
          });
      });
  } else {
      bot.sendMessage(chatId, "No payment information detected.");
  }
});

// Password confirmation endpoint
app.get('/confirmuser', async (req, res) => {
  const { userID, password } = req.query;

  if (!userID || !password) {
    return res.status(400).send({ message: 'UserID and password are required' });
  }

  const query = 'SELECT * FROM users WHERE userID = ?';
  db.query(query, [userID], async (err, result) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).send({ message: 'Error checking user' });
    }

    if (result.length === 0) {
      return res.status(401).send(false);  // Return false if user doesn't exist
    }

    try {
      const match = await bcrypt.compare(password, result[0].password);
      if (!match) {
        return res.status(401).send(false);  // Return false if password doesn't match
      }

      return res.status(200).send(true);  // Return true if password matches

    } catch (error) {
      console.error('Error comparing password:', error);
      return res.status(500).send({ message: 'Error processing login' });
    }
  });
});

// Save Bank Info endpoint
app.get('/bankinfo', async (req, res) => {
  const { userID, BankHolder, BankNumber } = req.query;

  // Validate if required parameters are present
  if (!userID || !BankHolder || !BankNumber) {
    return res.status(400).send({ message: 'BankHolder, BankNumber, and UserID are required' });
  }

  // Update the user's bank information in the database
  db.query('UPDATE users SET BankHolder = ?, BankNumber = ? WHERE userID = ?', [BankHolder, BankNumber, userID], (err, result) => {
    if (err) {
      console.error('Error updating bank information:', err);
      return res.status(500).send(false);  // Return false in case of internal error
    }

    if (result.affectedRows === 0) {
      return res.status(404).send(false);  // Return false if no user was updated
    }

    // Send notification after successful update
    const message = 'Your bank information has been saved successfully. We sincerely thank you for choosing our service and appreciate your trust in us.';
    insertNotification(userID, message);  // Assuming insertNotification is a function you have defined

    // Send success response
    return res.status(200).send(true);  // Return true if bank information is updated successfully
  });
});


// Start server

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
