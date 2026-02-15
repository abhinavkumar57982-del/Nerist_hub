const mongoose = require("mongoose");

const buyRequestSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  description: String,
  minPrice: Number,
  maxPrice: Number,
  category: String,
  model: String,
  contact: {
    type: String,
    required: true
  },
  postedBy: {
    type: String,
    default: "Anonymous"
  },
  postedByRegistration: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    default: "open"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("BuyRequest", buyRequestSchema);
