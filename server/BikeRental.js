const mongoose = require("mongoose");

const bikeRentalSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: ["bike-scooty", "drawing", "printing", "washing-machine", "other"]
    },
    otherServiceType: String,
    vehicleType: String,
    brand: String,
    rentPerDay: Number,
    location: String,
    contact: String,
    description: String,
    availability: {
      type: String,
      default: "available"
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

module.exports = mongoose.model("BikeRental", bikeRentalSchema);