const mongoose = require("mongoose");

const RentalReplySchema = new mongoose.Schema({
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BikeRental',
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
    enum: ["question", "interest", "booking", "contact", "other"],
    default: "question"
  },
  bookingDate: {
    type: Date,
    default: null
  },
  bookingDuration: {
    type: Number, // in days/hours as per service
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

module.exports = mongoose.model("RentalReply", RentalReplySchema);
