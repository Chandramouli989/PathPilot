const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, trim: true, maxlength: 120 },
  sourceUrl: { type: String, trim: true, default: "", maxlength: 500 },
  location: { type: String, trim: true, default: "", maxlength: 100 },
  opportunityType: {
    type: String,
    enum: ["Full-time", "Internship", "Contract", "Part-time", "Other"],
    default: "Full-time"
  },
  status: {
    type: String,
    enum: ["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected"],
    default: "Saved"
  },
  dateApplied: { type: Date, default: null },
  followUpDate: { type: Date, default: null },
  notes: { type: String, trim: true, default: "", maxlength: 2000 }
}, { timestamps: true });

applicationSchema.index({ user: 1, updatedAt: -1 });
applicationSchema.index({ user: 1, followUpDate: 1, status: 1 });

module.exports = mongoose.model("Application", applicationSchema);
