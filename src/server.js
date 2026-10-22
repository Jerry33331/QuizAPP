const express = require('express');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'quiz_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Test database connection
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err.message));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Make pool available to routes
app.set('pool', pool);

// Initialize database tables
const initDatabase = async () => {
    try {
        const userModel = new User(pool);
        await userModel.initTable();
        console.log('Database tables initialized');
    } catch (err) {
        console.error('Database initialization error:', err.message);
    }
};

// Routes
app.use('/api/auth', authRoutes);

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/index.html'));
});

// Initialize database when server starts
initDatabase();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`App available at http://localhost:${PORT}`);
});

module.exports = app;
