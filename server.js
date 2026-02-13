require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const fs = require("fs");

// Models - WITH CORRECT PATHS (FIXED)
const User = require("./server/User");
const LostItem = require("./server/LostItem");
const MarketplaceItem = require("./server/MarketplaceItem");
const BuyRequest = require("./server/BuyRequest");
const QuestionPaper = require("./server/QuestionPaper");
const BikeRental = require("./server/BikeRental");
const Building = require("./server/Building");
const Notification = require("./server/Notification");

// Utilities (FIXED)
const getLocalAnswer = require("./server/chatbot");
const registrationValidator = require("./server/RegistrationValidator");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "server/uploads")));
app.use("/geojson", express.static(path.join(__dirname, "GEOJSON MAP")));

/* ---------------- CORS ---------------- */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/* ---------------- MONGODB ---------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* ---------------- SOCKET.IO ---------------- */
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('user-connected', (userId) => {
    onlineUsers.set(userId.toString(), socket.id);
    console.log(`👤 User ${userId} connected with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('onlineUsers', onlineUsers);

/* ---------------- NOTIFICATION HELPER ---------------- */
async function createNotification(userId, type, title, message, itemId = null, itemModel = null) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      itemId,
      itemModel
    });

    const socketId = onlineUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('notification', {
        _id: notification._id,
        type,
        title,
        message,
        itemId,
        createdAt: notification.createdAt,
        read: false
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

async function notifyAllUsers(type, title, message, itemId = null, itemModel = null) {
  try {
    const users = await User.find({}, '_id');
    
    const notifications = users.map(user => ({
      userId: user._id,
      type,
      title,
      message,
      itemId,
      itemModel,
      read: false
    }));
    
    await Notification.insertMany(notifications);
    
    users.forEach(user => {
      const socketId = onlineUsers.get(user._id.toString());
      if (socketId) {
        io.to(socketId).emit('notification', {
          type,
          title,
          message,
          itemId,
          createdAt: new Date(),
          read: false
        });
      }
    });
    
    console.log(`📢 Notification sent to ${users.length} users: ${title}`);
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
  }
}

/* ---------------- RATE LIMITERS ---------------- */
const lostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many lost/found uploads, wait 1 minute"
});

const paperLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many question paper uploads"
});

const marketLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many marketplace actions"
});

/* ---------------- AUTHENTICATION MIDDLEWARE ---------------- */
const userTokens = new Map(); // token -> userId

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: "Authentication required. Please login first." });
    }
    
    const userId = userTokens.get(authHeader);
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        req.user = {
          loggedIn: true,
          id: user._id,
          registrationNumber: user.registrationNumber,
          name: user.name,
          email: user.email,
          phone: user.phone
        };
        next();
      } else {
        userTokens.delete(authHeader);
        return res.status(401).json({ error: "Invalid token. Please login again." });
      }
    } else {
      return res.status(401).json({ error: "Invalid token. Please login again." });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const userId = userTokens.get(authHeader);
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          req.user = {
            loggedIn: true,
            id: user._id,
            registrationNumber: user.registrationNumber,
            name: user.name,
            email: user.email,
            phone: user.phone
          };
        }
      }
    }
    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
};

/* ---------------- MULTER SETUP ---------------- */
const makeStorage = folder =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, `server/uploads/${folder}`);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_, file, cb) =>
      cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, '-'))
  });

const lostUpload = multer({ storage: makeStorage("lost-found") });
const marketUpload = multer({ storage: makeStorage("marketplace") });
const paperUpload = multer({
  storage: makeStorage("question-papers"),
  fileFilter: (_, file, cb) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDFs allowed"))
});
const rentalUpload = multer({ storage: makeStorage("rentals") });

/* ============ AUTHENTICATION ROUTES ============ */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with security code
 * @access  Public
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);
    
    const { 
      registrationNumber, 
      name, 
      password, 
      securityCode, 
      securityCodeHint = "",
      email = "", 
      phone = "" 
    } = req.body;
    
    // Validate required fields
    if (!registrationNumber || !name || !password || !securityCode) {
      return res.status(400).json({ 
        success: false, 
        error: "Registration number, name, password, and security code are required" 
      });
    }
    
    // Validate security code length
    if (securityCode.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: "Security code must be at least 3 characters" 
      });
    }
    
    // Format registration number
    const formattedRegNumber = registrationValidator.format(registrationNumber);
    
    if (!formattedRegNumber) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid registration number format. Use format like: 225/88 or 225-88 or 225 88" 
      });
    }
    
    // Validate if registration number exists in NERIST records
    const isValid = registrationValidator.isValid(formattedRegNumber);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid registration number "${formattedRegNumber}". Please check if the number exists in NERIST records.` 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ registrationNumber: formattedRegNumber });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: "Registration number already exists" 
      });
    }
    
    // Create new user
    const user = new User({
      registrationNumber: formattedRegNumber,
      name: name.trim(),
      password: password,
      securityCode: securityCode,
      securityCodeHint: securityCodeHint.trim(),
      email: email.trim(),
      phone: phone.trim()
    });
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: "Registration successful",
      registrationNumber: formattedRegNumber
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: "Registration number already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Registration failed. Please try again." 
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { registrationNumber, password } = req.body;
    
    const formattedRegNumber = registrationValidator.format(registrationNumber);
    if (!formattedRegNumber) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid registration number format" 
      });
    }
    
    const user = await User.findOne({ registrationNumber: formattedRegNumber });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid registration number or password" 
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid registration number or password" 
      });
    }
    
    const userData = {
      id: user._id,
      registrationNumber: user.registrationNumber,
      name: user.name,
      email: user.email,
      phone: user.phone
    };
    
    // Generate token
    const token = `nerist-token-${crypto.randomBytes(16).toString('hex')}`;
    
    // Store token -> userId mapping
    userTokens.set(token, user._id.toString());
    
    res.json({ 
      success: true,
      user: userData,
      token: token
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Login failed" 
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && userTokens.has(authHeader)) {
      userTokens.delete(authHeader);
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Logout failed" });
  }
});

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Public
 */
app.get("/api/auth/check", optionalAuth, async (req, res) => {
  try {
    if (req.user && req.user.loggedIn) {
      const user = await User.findById(req.user.id);
      if (user) {
        return res.json({ 
          loggedIn: true,
          user: {
            id: user._id,
            registrationNumber: user.registrationNumber,
            name: user.name,
            email: user.email,
            phone: user.phone
          }
        });
      }
    }
    return res.json({ loggedIn: false });
  } catch (error) {
    console.error("Auth check error:", error);
    res.json({ loggedIn: false });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: user._id,
      registrationNumber: user.registrationNumber,
      name: user.name,
      email: user.email,
      phone: user.phone,
      securityCodeHint: user.securityCodeHint || "",
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

/* ============ SECURITY CODE & PASSWORD RESET ROUTES ============ */

/**
 * @route   POST /api/auth/validate-registration
 * @desc    Validate registration number format and existence
 * @access  Public
 */
app.post("/api/auth/validate-registration", (req, res) => {
  const { registrationNumber } = req.body;
  
  if (!registrationNumber) {
    return res.json({ 
      valid: false, 
      message: "Registration number is required" 
    });
  }
  
  const formatted = registrationValidator.format(registrationNumber);
  
  if (!formatted) {
    return res.json({ 
      valid: false, 
      message: "Invalid format. Use format like: 225/88, 225-88, or 225 88" 
    });
  }
  
  const isValid = registrationValidator.isValid(formatted);
  
  res.json({ 
    valid: isValid,
    formatted: formatted,
    message: isValid ? `Valid NERIST registration number: ${formatted}` : `Invalid registration number "${formatted}". Number does not exist in NERIST records.`
  });
});

/**
 * @route   POST /api/auth/verify-registration
 * @desc    Check if registration number exists and return security hint
 * @access  Public
 */
app.post("/api/auth/verify-registration", async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    
    const formattedRegNumber = registrationValidator.format(registrationNumber);
    if (!formattedRegNumber) {
      return res.json({ exists: false });
    }
    
    const user = await User.findOne({ registrationNumber: formattedRegNumber });
    
    if (user) {
      res.json({ 
        exists: true, 
        registrationNumber: user.registrationNumber,
        hint: user.securityCodeHint || "" 
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error("Verify registration error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

/**
 * @route   POST /api/auth/verify-security-code
 * @desc    Verify user's security code and generate reset token
 * @access  Public
 */
app.post("/api/auth/verify-security-code", async (req, res) => {
  try {
    const { registrationNumber, securityCode } = req.body;
    
    if (!registrationNumber || !securityCode) {
      return res.status(400).json({ 
        valid: false, 
        error: "Registration number and security code are required" 
      });
    }
    
    const formattedRegNumber = registrationValidator.format(registrationNumber);
    const user = await User.findOne({ registrationNumber: formattedRegNumber });
    
    if (!user) {
      return res.json({ valid: false, error: "User not found" });
    }
    
    // Compare the provided security code with the stored hash
    const isValid = await user.compareSecurityCode(securityCode);
    
    if (isValid) {
      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      
      // Save token to user document with expiry
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 300000; // 5mins from now
      await user.save();
      
      console.log(`🔑 Security code verified for ${formattedRegNumber}, reset token generated`);
      
      res.json({ 
        valid: true,
        resetToken: resetToken
      });
    } else {
      res.json({ valid: false, error: "Invalid security code" });
    }
  } catch (error) {
    console.error("Security code verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using valid reset token
 * @access  Public
 */
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Token and new password are required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "Password must be at least 6 characters" 
      });
    }
    
    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or expired reset token" 
      });
    }
    
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    console.log(`✅ Password reset successful for: ${user.registrationNumber}`);
    
    res.json({ 
      success: true, 
      message: "Password reset successful. You can now login with your new password." 
    });
    
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Password reset failed" 
    });
  }
});

/**
 * @route   GET /api/auth/valid-prefixes
 * @desc    Get valid registration number prefixes
 * @access  Public
 */
app.get("/api/auth/valid-prefixes", (req, res) => {
  const prefixes = registrationValidator.getValidPrefixes();
  res.json({ prefixes });
});

/* ============ NOTIFICATION ROUTES ============ */

// Get user notifications
app.get("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = { userId: req.user.id };
    if (unreadOnly === 'true') {
      filter.read = false;
    }
    
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(filter)
    ]);
    
    res.json({
      notifications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
app.get("/api/notifications/unread-count", authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put("/api/notifications/mark-all-read", authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
app.delete("/api/notifications/:id", authenticateToken, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications
app.delete("/api/notifications", authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

/* ============ LOST & FOUND ROUTES ============ */

// CREATE LOST ITEM - PROTECTED
app.post(
  "/api/items",
  authenticateToken,
  lostLimiter,
  lostUpload.single("image"),
  async (req, res) => {
    try {
      console.log("Creating lost item with user:", req.user);
      
      const item = await LostItem.create({
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        date: req.body.date,
        contact: req.body.contact,
        status: req.body.status === "found" ? "found" : "lost",
        image: req.file ? req.file.filename : "",
        postedBy: req.user.name,
        postedByRegistration: req.user.registrationNumber,
        userId: req.user.id
      });

      // Notify all users about new lost item
      await notifyAllUsers(
        'lost',
        '🔍 New Lost Item Reported',
        `${req.user.name} lost: ${req.body.title}`,
        item._id,
        'LostItem'
      );

      console.log("Item created:", item);
      res.json(item);
    } catch (err) {
      console.error("Item creation error:", err);
      res.status(500).json({ error: "Item upload failed" });
    }
  }
);

// CREATE FOUND ITEM - PROTECTED
app.post(
  "/api/found-items",
  authenticateToken,
  lostLimiter,
  lostUpload.single("image"),
  async (req, res) => {
    try {
      console.log("Creating found item with user:", req.user);
      
      const item = await LostItem.create({
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        date: req.body.date,
        contact: req.body.contact,
        status: "found",
        image: req.file ? req.file.filename : "",
        postedBy: req.user.name,
        postedByRegistration: req.user.registrationNumber,
        userId: req.user.id
      });

      await notifyAllUsers(
        'found',
        '✅ New Found Item',
        `${req.user.name} found: ${req.body.title}`,
        item._id,
        'FoundItem'
      );

      console.log("Found item created:", item);
      res.json(item);
    } catch (err) {
      console.error("Found item creation error:", err);
      res.status(500).json({ error: "Found item upload failed" });
    }
  }
);

// GET LOST OR FOUND - PUBLIC
app.get("/api/items", optionalAuth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await LostItem.find(filter).sort({ createdAt: -1 });
  res.json(items);
});

// MARK FOUND - PROTECTED
app.put("/api/items/:id/found", authenticateToken, async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    if (item.userId && item.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only mark your own items as found" });
    }
    
    await LostItem.findByIdAndUpdate(req.params.id, { status: "found" });
    
    await createNotification(
      item.userId,
      'found',
      '✅ Item Marked as Found',
      `Your item "${item.title}" has been marked as found`,
      item._id,
      'LostItem'
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark as found" });
  }
});

// DELETE ITEM - PROTECTED
app.delete("/api/items/:id", authenticateToken, async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    if (item.userId && item.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only delete your own items" });
    }
    
    await LostItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

/* ============ QUESTION PAPERS ROUTES ============ */

// UPLOAD - PROTECTED
app.post(
  "/api/question-papers/upload",
  authenticateToken,
  paperLimiter,
  paperUpload.single("pdf"),
  async (req, res) => {
    try {
      console.log("Uploading paper with user:", req.user);
      
      const paper = await QuestionPaper.create({
        year: req.body.year,
        semester: req.body.semester,
        branch: req.body.branch,
        subject: req.body.subject,
        subjectCode: req.body.subjectCode,
        uploadedBy: req.user.name,
        uploadedByRegistration: req.user.registrationNumber,
        userId: req.user.id,
        pdf: req.file.filename
      });
      
      console.log("Paper uploaded:", paper);
      res.json({ success: true, paper });
    } catch (error) {
      console.error("Paper upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// GET - PUBLIC
app.get("/api/question-papers", optionalAuth, async (req, res) => {
  const filter = {};

  if (req.query.year) {
    const year = parseInt(req.query.year);
    if (!isNaN(year)) filter.year = year;
  }

  if (req.query.semester) {
    const sem = parseInt(req.query.semester);
    if (!isNaN(sem)) filter.semester = sem;
  }

  if (req.query.branch) {
    filter.branch = new RegExp(req.query.branch, "i");
  }

  if (req.query.subject) {
    filter.subject = new RegExp(req.query.subject, "i");
  }

  if (req.query.subjectCode) {
    filter.subjectCode = new RegExp(req.query.subjectCode, "i");
  }

  const papers = await QuestionPaper.find(filter).sort({ uploadedAt: -1 });
  res.json(papers);
});

/* ============ MARKETPLACE ROUTES ============ */

// SELL ITEM - PROTECTED
app.post(
  "/api/marketplace",
  authenticateToken,
  marketLimiter,
  marketUpload.single("image"),
  async (req, res) => {
    try {
      console.log("Creating marketplace item with user:", req.user);
      
      const item = await MarketplaceItem.create({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        condition: req.body.condition,
        contact: req.body.contact,
        postedBy: req.user.name,
        postedByRegistration: req.user.registrationNumber,
        userId: req.user.id,
        status: "available",
        image: req.file ? req.file.filename : ""
      });

      await notifyAllUsers(
        'sell',
        '🛒 New Item for Sale',
        `${req.user.name} is selling: ${req.body.title} for ₹${req.body.price}`,
        item._id,
        'MarketplaceItem'
      );
      
      console.log("Marketplace item created:", item);
      res.json(item);
    } catch (error) {
      console.error("Marketplace item creation error:", error);
      res.status(500).json({ error: "Failed to create marketplace item" });
    }
  }
);

// GET SELL ITEMS - PUBLIC
app.get("/api/marketplace", optionalAuth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const items = await MarketplaceItem.find(filter).sort({ createdAt: -1 });
  res.json(items);
});

// MARK SOLD - PROTECTED
app.put("/api/marketplace/:id/sold", authenticateToken, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    if (item.userId && item.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only mark your own items as sold" });
    }
    
    await MarketplaceItem.findByIdAndUpdate(req.params.id, { status: "sold" });
    
    await createNotification(
      item.userId,
      'sell',
      '💰 Item Sold',
      `Your item "${item.title}" has been marked as sold`,
      item._id,
      'MarketplaceItem'
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark as sold" });
  }
});

// DELETE SELL ITEM - PROTECTED
app.delete("/api/marketplace/:id", authenticateToken, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    if (item.userId && item.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only delete your own items" });
    }
    
    await MarketplaceItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

/* ============ BUY REQUESTS ROUTES ============ */

// CREATE - PROTECTED
app.post("/api/buy-requests", authenticateToken, marketLimiter, async (req, res) => {
  try {
    console.log("Creating buy request with user:", req.user);
    
    const request = await BuyRequest.create({
      itemName: req.body.itemName,
      description: req.body.description,
      minPrice: req.body.minPrice,
      maxPrice: req.body.maxPrice,
      category: req.body.category,
      model: req.body.model,
      contact: req.body.contact,
      postedBy: req.user.name,
      postedByRegistration: req.user.registrationNumber,
      userId: req.user.id,
      status: "open"
    });

    await notifyAllUsers(
      'buy',
      '🛍️ New Buy Request',
      `${req.user.name} wants to buy: ${req.body.itemName}`,
      request._id,
      'BuyRequest'
    );
    
    console.log("Buy request created:", request);
    res.json(request);
  } catch (error) {
    console.error("Buy request creation error:", error);
    res.status(500).json({ error: "Failed to create buy request" });
  }
});

// GET - PUBLIC
app.get("/api/buy-requests", optionalAuth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const requests = await BuyRequest.find(filter).sort({ createdAt: -1 });
  res.json(requests);
});

// MARK FULFILLED - PROTECTED
app.put("/api/buy-requests/:id/fulfilled", authenticateToken, async (req, res) => {
  try {
    const request = await BuyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    if (request.userId && request.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only mark your own requests as fulfilled" });
    }
    
    await BuyRequest.findByIdAndUpdate(req.params.id, { status: "fulfilled" });
    
    await createNotification(
      request.userId,
      'buy',
      '✅ Buy Request Fulfilled',
      `Your request to buy "${request.itemName}" has been marked as fulfilled`,
      request._id,
      'BuyRequest'
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark as fulfilled" });
  }
});

// DELETE BUY REQUEST - PROTECTED
app.delete("/api/buy-requests/:id", authenticateToken, async (req, res) => {
  try {
    const request = await BuyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    if (request.userId && request.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only delete your own requests" });
    }
    
    await BuyRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete request" });
  }
});

/* ============ BIKE RENTAL ROUTES ============ */

// POST RENTAL - PROTECTED
app.post(
  "/api/rentals",
  authenticateToken,
  rentalUpload.single("image"),
  async (req, res) => {
    try {
      console.log("Creating rental with user:", req.user);
      console.log("Rental data:", req.body);
      
      const rentalData = {
        serviceType: req.body.serviceType,
        otherServiceType: req.body.otherServiceType,
        vehicleType: req.body.vehicleType,
        brand: req.body.brand,
        title: req.body.title,
        description: req.body.description,
        rentPerDay: req.body.price || req.body.rentPerDay,
        location: req.body.location,
        contact: req.body.contact,
        image: req.file ? req.file.filename : "",
        postedBy: req.user.name,
        postedByRegistration: req.user.registrationNumber,
        userId: req.user.id
      };

      const rental = await BikeRental.create(rentalData);

      await notifyAllUsers(
        'rental',
        '🚲 New Rental Service',
        `${req.user.name} posted: ${req.body.title || req.body.serviceType} rental`,
        rental._id,
        'BikeRental'
      );
      
      console.log("Rental created:", rental);
      res.json(rental);
    } catch (err) {
      console.error("Rental creation error:", err);
      res.status(500).json({ error: "Rental service upload failed" });
    }
  }
);

// GET ALL RENTALS - PUBLIC
app.get("/api/rentals", optionalAuth, async (req, res) => {
  try {
    const { serviceType, availability } = req.query;
    const filter = {};
    
    if (serviceType) filter.serviceType = serviceType;
    if (availability) filter.availability = availability;
    
    const rentals = await BikeRental.find(filter).sort({ createdAt: -1 });
    res.json(rentals);
  } catch (error) {
    console.error("Rental fetch error:", error);
    res.status(500).json({ error: "Failed to fetch rentals" });
  }
});

// MARK RENTED - PROTECTED
app.put("/api/rentals/:id/rented", authenticateToken, async (req, res) => {
  try {
    const rental = await BikeRental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: "Rental not found" });
    }
    
    if (rental.userId && rental.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only mark your own rentals as rented" });
    }
    
    await BikeRental.findByIdAndUpdate(req.params.id, {
      availability: "rented"
    });
    
    await createNotification(
      rental.userId,
      'rental',
      '✅ Rental Service Rented',
      `Your rental "${rental.title || rental.serviceType}" has been marked as rented`,
      rental._id,
      'BikeRental'
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark as rented" });
  }
});

// DELETE - PROTECTED
app.delete("/api/rentals/:id", authenticateToken, async (req, res) => {
  try {
    const rental = await BikeRental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ error: "Rental not found" });
    }
    
    if (rental.userId && rental.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "You can only delete your own rentals" });
    }
    
    await BikeRental.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete rental" });
  }
});

/* ============ MAP & SEARCH ROUTES ============ */

app.get("/api/map/search", optionalAuth, async (req, res) => {
  const q = req.query.q;
  const building = await Building.findOne({
    keywords: { $regex: q, $options: "i" }
  });
  res.json(building);
});

/* ============ CHATBOT ROUTES ============ */

app.post("/api/chat", optionalAuth, async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.json({
      reply: "Please type a question."
    });
  }

  const localReply = getLocalAnswer(userMessage);
  if (localReply) {
    return res.json({ reply: localReply });
  }

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a chatbot that answers NERIST-related questions. Answer politely even if unsure."
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      }
    );

    const data = await groqRes.json();
    console.log("Groq response:", data);

    res.json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't find that information."
    });
  } catch (err) {
    console.error(err);
    res.json({
      reply: "AI service is temporarily unavailable."
    });
  }
});

/* ============ TEACHER DIRECTORY ROUTES ============ */

// Get all teachers
app.get("/api/teachers", optionalAuth, async (req, res) => {
  try {
    const { department, role, search } = req.query;
    const filter = {};
    
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    if (role && role !== 'all') {
      const roleMap = {
        'hod': /head|hod/i,
        'professor': /^professor$/i,
        'associate': /associate professor/i,
        'assistant': /assistant professor/i,
        'warden': /warden/i
      };
      
      if (roleMap[role]) {
        filter.role = roleMap[role];
      }
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { role: new RegExp(search, 'i') },
        { departmentName: new RegExp(search, 'i') },
        { subjects: new RegExp(search, 'i') }
      ];
    }
    
    const teachers = await Teacher.find(filter).sort({ name: 1 });
    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// Add a teacher
app.post("/api/teachers", authenticateToken, async (req, res) => {
  try {
    const teacher = new Teacher({
      name: req.body.name,
      role: req.body.role,
      department: req.body.department,
      departmentName: req.body.departmentName,
      email: req.body.email,
      phone: req.body.phone,
      photo: req.body.photo,
      subjects: req.body.subjects,
      room: req.body.room,
      addedBy: req.user.id
    });
    
    await teacher.save();
    res.json({ success: true, teacher });
  } catch (error) {
    console.error("Error adding teacher:", error);
    res.status(500).json({ error: "Failed to add teacher" });
  }
});

// Import teachers
app.post("/api/teachers/import", authenticateToken, async (req, res) => {
  try {
    const teachersData = req.body.teachers || [];
    const result = await Teacher.insertMany(teachersData);
    res.json({ 
      success: true, 
      message: `Imported ${result.length} teachers successfully` 
    });
  } catch (error) {
    console.error("Error importing teachers:", error);
    res.status(500).json({ error: "Failed to import teachers" });
  }
});

/* ============ HEALTH CHECK ============ */

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* ============ DEBUG ENDPOINTS ============ */

app.get("/api/debug/tokens", (req, res) => {
  const tokens = Array.from(userTokens.entries()).map(([token, userId]) => ({
    token: token.substring(0, 20) + "...",
    userId
  }));
  res.json({ tokens, count: tokens.length });
});

/* ============ CATCH-ALL ROUTE ============ */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ============ START SERVER ============ */

server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
