const mongoose = require("mongoose");

const marketplaceSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  condition: String,
  contact: String,
  image: String,
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
    default: "available"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MarketplaceItem", marketplaceSchema);