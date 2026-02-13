const mongoose = require("mongoose");

const questionPaperSchema = new mongoose.Schema({
  year: Number,
  semester: Number,
  branch: String,
  subject: String,
  subjectCode: String,
  pdf: String,
  uploadedBy: { 
    type: String, 
    default: "Anonymous" 
  },
  uploadedByRegistration: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("QuestionPaper", questionPaperSchema);