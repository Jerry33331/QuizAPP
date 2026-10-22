// Authentication middleware

// Check if user is authenticated
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ 
        success: false,
        message: 'Authentication required'
    });
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ 
        success: false,
        message: 'Admin access required'
    });
};

// Check if user is player (can be used to restrict admin-only actions)
const requirePlayer = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'player') {
        return next();
    }
    res.status(403).json({ 
        success: false,
        message: 'Player access required'
    });
};

module.exports = {
    requireAuth,
    requireAdmin,
    requirePlayer
};
