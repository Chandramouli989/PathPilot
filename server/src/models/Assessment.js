const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    education: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },

    skills: {
      type: [String],
      default: [],
      validate: value => value.length <= 30
    },

    interests: {
      type: [String],
      required: true,
      validate: value => value.length > 0 && value.length <= 30
    },

    strengths: {
      type: [String],
      default: [],
      validate: value => value.length <= 30
    },

    preferredWorkStyle: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site", "No Preference"],
      default: "No Preference"
    },

    careerGoal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },

    recommendations: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index({ user: 1 }, { unique: true });

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;