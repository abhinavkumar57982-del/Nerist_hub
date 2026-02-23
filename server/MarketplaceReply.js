const mongoose = require("mongoose");

const MarketplaceReplySchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceItem',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRegistration: {
    type: String,
    required: true
  },
  senderContact: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    required: [true, "Message is required"]
  },
  replyType: {
    type: String,
    enum: ["question", "interest", "offer", "contact", "other"],
    default: "question"
  },
  offerAmount: {
    type: Number,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MarketplaceReply", MarketplaceReplySchema);
