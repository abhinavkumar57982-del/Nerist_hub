const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostItem',
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

// Export both models
module.exports = {
  LostItem: mongoose.model("LostItem", LostItemSchema),
  Reply: mongoose.model("Reply", ReplySchema)
};
