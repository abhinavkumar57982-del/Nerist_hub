const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // ADD THIS - Security Code
  securityCode: {
    type: String,
    required: true
  },
  // ADD THIS - Security Code Hint (optional)
  securityCodeHint: {
    type: String,
    trim: true,
    default: ""
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ""
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ADD THIS - Hash security code before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('securityCode')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.securityCode = await bcrypt.hash(this.securityCode, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ADD THIS - Compare security code method
userSchema.methods.compareSecurityCode = async function(candidateCode) {
  return await bcrypt.compare(candidateCode, this.securityCode);
};

module.exports = mongoose.model("User", userSchema);
