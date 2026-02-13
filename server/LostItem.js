const mongoose = require("mongoose");

const LostItemSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    location: String,
    date: String,
    contact: String,
    status: {
      type: String,
      enum: ["lost", "found"],
      required: true
    },
    image: String,
    postedBy: {
      type: String,
      default: "Anonymous"
    },
    postedByRegistration: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostItem", LostItemSchema);