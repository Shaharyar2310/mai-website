const express = require('express');
const app = express();
const path = require('path');
const usersRouter = require('./routes/users');
const authMiddleware = require('./middleware/auth');
const authRouter = require('./routes/auth');
require('dotenv').config();

console.log('usersRouter:', usersRouter);
console.log('authRouter:', authRouter);
console.log('authMiddleware:', authMiddleware);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', authMiddleware, usersRouter); // Protected
app.use('/auth', authRouter); // Public

// Serve environment variables to frontend
app.get('/api/config', (req, res) => {
  res.json({
    MOVIE_API_KEY: process.env.MOVIE_API_KEY,
    GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID
  });
});

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));