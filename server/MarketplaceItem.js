const mongoose = require("mongoose");

const MarketplaceItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    condition: {
      type: String,
      enum: ["new", "like-new", "good", "fair", "poor"],
      default: "good"
    },
    contact: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    // Cloudinary public ID field
    imagePublicId: {
      type: String,
      default: ""
    },
    postedBy: {
      type: String,
      default: "Anonymous"
    },
    postedByRegistration: {
      type: String,
      default: ""
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketplaceItem", MarketplaceItemSchema);
