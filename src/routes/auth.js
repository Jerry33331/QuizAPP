const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Initialize User model
const getUserModel = (req) => {
    return new User(req.app.get('pool'));
};

// Registration endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, and password are required' 
            });
        }
        
        // Validate role
        const validRoles = ['player', 'admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role. Must be player or admin' 
            });
        }
        
        const userModel = getUserModel(req);
        
        // Check if username already exists
        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }
        
        // Check if email already exists
        const existingEmail = await userModel.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }
        
        // Create new user
        const newUser = await userModel.create(username, email, password, role || 'player');
        
        // Don't store password hash in session
        const { password_hash, ...userWithoutPassword } = newUser;
        
        // Create session
        req.session.user = userWithoutPassword;
        
        res.json({ 
            success: true, 
            message: 'Registration successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }
        
        const userModel = getUserModel(req);
        const user = await userModel.findByUsername(username);
        
        // Generic error message for security
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
        
        const isPasswordValid = await userModel.verifyPassword(user, password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
        
        // Don't store password hash in session
        const { password_hash, ...userWithoutPassword } = user;
        
        // Create session
        req.session.user = userWithoutPassword;
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Could not logout' 
            });
        }
        res.clearCookie('connect.sid');
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
});

// Get current user
router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json({ 
            success: true,
            user: req.session.user
        });
    } else {
        res.status(401).json({ 
            success: false,
            message: 'Not authenticated'
        });
    }
});

module.exports = router;
