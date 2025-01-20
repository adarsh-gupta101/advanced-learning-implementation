const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser()); // To read cookies

const users = []; // Mock users database
let refreshTokens = []; // Store refresh tokens

const ACCESS_TOKEN_SECRET = 'access_secret';
const REFRESH_TOKEN_SECRET = 'refresh_secret';

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.status(201).send('User registered');
});

// Login and issue tokens
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }

  // Generate access token (short-lived)
  const accessToken = generateAccessToken({ username: user.username });

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign({ username: user.username }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  refreshTokens.push(refreshToken);

  // Send the refresh token as an HttpOnly cookie
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'Strict', secure: true });
  
  // Send the access token in response
  res.json({ accessToken });
});

// Refresh the access token
app.post('/token', (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Get refresh token from cookie

  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.status(403).send('Refresh token not valid');
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid refresh token');

    // Generate a new access token
    const accessToken = generateAccessToken({ username: user.username });
    res.json({ accessToken });
  });
});

// Logout and invalidate refresh token
app.post('/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  refreshTokens = refreshTokens.filter(token => token !== refreshToken); // Remove refresh token
  res.clearCookie('refreshToken'); // Clear cookie
  res.send('Logged out');
});

// Middleware to authenticate access token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(403);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Generate Access Token
function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.send(`Hello ${req.user.username}, this is protected data.`);
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
