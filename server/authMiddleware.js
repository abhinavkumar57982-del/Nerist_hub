const jwt = require("jsonwebtoken");
const User = require("./models/User");

const JWT_SECRET = process.env.JWT_SECRET || "nerist_campus_hub_secret_key_2026";

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    const decoded = jwt.verify(actualToken, JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    
    return res.status(500).json({ error: "Authentication failed" });
  }
};

// Optional auth middleware (for routes where auth is optional)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    
    if (token) {
      const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(actualToken, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };