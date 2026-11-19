const mongoose = require("mongoose");

const projectEvidenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  projectName: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1200 },
  skills: { type: [String], default: [], validate: v => v.length <= 15 },
  repositoryUrl: { type: String, trim: true, default: "" },
  liveUrl: { type: String, trim: true, default: "" },
  evidenceType: {
    type: String,
    enum: ["Personal project", "Academic project", "Internship", "Open source", "Other"],
    default: "Personal project"
  },
  status: { type: String, enum: ["In progress", "Completed"], default: "In progress" }
}, { timestamps: true });

projectEvidenceSchema.index({ user: 1, updatedAt: -1 });
module.exports = mongoose.model("ProjectEvidence", projectEvidenceSchema);
