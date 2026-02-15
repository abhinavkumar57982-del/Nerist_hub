const mongoose = require("mongoose");

const QuestionPaperSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    branch: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    subjectCode: {
      type: String,
      required: true
    },
    pdf: {
      type: String,
      required: true
    },
    // Add Cloudinary public ID for PDF
    pdfPublicId: {
      type: String,
      default: ""
    },
    uploadedBy: {
      type: String,
      default: "Anonymous"
    },
    uploadedByRegistration: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionPaper", QuestionPaperSchema);
