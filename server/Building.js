// models/Building.js
const mongoose = require("mongoose");

const BuildingSchema = new mongoose.Schema({
  name: String,
  keywords: [String],
  latitude: Number,
  longitude: Number,
  rooms: [
    {
      roomName: String,
      floor: String,
      description: String
    }
  ]
});

module.exports = mongoose.model("Building", BuildingSchema);
