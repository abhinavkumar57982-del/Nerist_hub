const mongoose = require("mongoose");

const LostItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"]
    },
    description: {
      type: String,
      required: [true, "Description is required"]
    },
    location: {
      type: String,
      required: [true, "Location is required"]
    },
    date: {
      type: String,
      required: [true, "Date is required"]
    },
    contact: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["lost", "found"],
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    // Add Cloudinary public ID field
    imagePublicId: {
      type: String,
      default: ""
    },
    postedBy: {
      type: String,
      default: "Anonymous"
    },
    postedByRegistration: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostItem", LostItemSchema);
