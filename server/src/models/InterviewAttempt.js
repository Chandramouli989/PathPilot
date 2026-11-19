const mongoose = require("mongoose");

const interviewAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, required: true, maxlength: 80 },
  questionId: { type: String, required: true, maxlength: 30 },
  category: { type: String, enum: ["Technical", "Project", "Behavioral"], required: true },
  question: { type: String, required: true, maxlength: 1000 },
  answer: { type: String, required: true, maxlength: 8000 },
  feedback: {
    overall: { type: String, required: true, maxlength: 2500 },
    strengths: [{ type: String, maxlength: 300 }],
    improvements: [{ type: String, maxlength: 300 }],
    suggestedStructure: { type: String, maxlength: 2000 },
    score: { type: Number, min: 0, max: 100, required: true },
    rubric: {
      relevance: { type: Number, min: 0, max: 5 },
      clarity: { type: Number, min: 0, max: 5 },
      structure: { type: Number, min: 0, max: 5 },
      specificity: { type: Number, min: 0, max: 5 }
    }
  },
  feedbackMode: { type: String, enum: ["groq_ai", "rule_based_fallback"], default: "groq_ai" }
}, { timestamps: true });

interviewAttemptSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("InterviewAttempt", interviewAttemptSchema);
