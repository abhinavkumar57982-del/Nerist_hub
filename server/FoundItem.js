const mongoose = require("mongoose");

const FoundItemSchema = new mongoose.Schema(
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
      enum: ["found"],
      default: "found"
    },
    image: {
      type: String,
      default: ""
    },
    imagePublicId: {
      type: String,
      default: ""
    },
    postedBy: {
      type: String,
      required: [true, "Poster name is required"]
    },
    postedByRegistration: {
      type: String,
      required: [true, "Registration number is required"]
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

FoundItemSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("FoundItem", FoundItemSchema);
