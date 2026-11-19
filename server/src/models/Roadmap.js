const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    estimatedHours: { type: Number, min: 1, default: 4 },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    },
    completedAt: { type: Date, default: null }
  },
  { _id: true }
);

const phaseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    objective: { type: String, required: true, trim: true },
    milestones: {
      type: [milestoneSchema],
      validate: value => value.length > 0
    }
  },
  { _id: true }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true
    },
    careerTitle: { type: String, required: true, trim: true },
    overview: { type: String, required: true },
    durationWeeks: { type: Number, min: 1, max: 52, default: 12 },
    phases: {
      type: [phaseSchema],
      validate: value => value.length > 0
    }
  },
  { timestamps: true }
);

roadmapSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Roadmap", roadmapSchema);
