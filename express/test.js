const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// In-memory user database (use a real database in production)
const users = [
  { id: 1, username: 'testuser', password: bcrypt.hashSync('password123', 10) },
];

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Parses form-encoded data
app.use(bodyParser.json()); // Parses JSON data

app.use(
  session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set `secure: true` in production with HTTPS
  })
);

// Helper: Authenticate user
function authenticate(username, password) {
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return null;
}

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    console.log('req.session.userId: ', req.session.userId, req.session.id);
    res.send(`<h1>Welcome back, User ${req.session.userId}!</h1><a href="/logout">Logout</a>`);
  } else {
    res.send(`<h1>Welcome to the app!</h1><a href="/login">Login</a>`);
  }
});

app.get('/login', (req, res) => {
  res.send(`
    <form method="POST" action="/login">
      <input type="text" name="username" placeholder="Username" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('username: ', req.body);


  const user = authenticate(username, password);
  if (user) {
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    res.send('<h1>Login failed</h1><a href="/login">Try again</a>');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
