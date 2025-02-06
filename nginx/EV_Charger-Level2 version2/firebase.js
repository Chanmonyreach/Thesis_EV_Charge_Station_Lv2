const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Firestore instance

const app = express();
const port = 8081;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).get();
    const userByEmail = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty || !userByEmail.empty) {
      return res.status(400).send({ message: 'Username or email already exists' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the user data in Firestore
    await usersRef.add({
      username,
      email,
      password: hashedPassword,
      BankHolder: 'N/A',
      BankNumber: 0
    });

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

  try {
    // Find the user by username
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).get();

    if (snapshot.empty) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    const user = snapshot.docs[0].data();

    // Compare the password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send({ message: 'Invalid password' });
    }

    res.send({ message: 'Login successful', userID: snapshot.docs[0].id });
  } catch (error) {
    console.error('Error comparing password:', error);
    return res.status(500).send({ message: 'Error processing login' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
