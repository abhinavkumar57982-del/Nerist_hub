const mongoose = require("mongoose");

const BikeRentalSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ["bike-scooty", "drawing", "printing", "washing-machine", "other"], // Updated to match form
      required: true
    },
    otherServiceType: {
      type: String,
      default: ""
    },
    vehicleType: {
      type: String,
      default: ""
    },
    brand: {
      type: String,
      default: ""
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: "" // Changed from required to default
    },
    rentPerDay: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    contact: {
      type: String,
      required: true
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
    availability: {
      type: String,
      enum: ["available", "rented"],
      default: "available"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BikeRental", BikeRentalSchema);
