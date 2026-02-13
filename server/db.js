const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/nerist_lost_found")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("DB error:", err));
