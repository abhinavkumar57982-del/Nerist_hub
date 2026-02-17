const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  // userId is now OPTIONAL for anonymous users
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Changed from true to false
  },
  subscription: {
    type: Object,
    required: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
pushSubscriptionSchema.index({ userId: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
