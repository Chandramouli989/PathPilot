const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true, maxlength: 40 },
  selectedOption: { type: Number, required: true, min: 0, max: 3 },
  correct: { type: Boolean, required: true }
}, { _id: false });

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  skill: { type: String, required: true, trim: true, maxlength: 80 },
  score: { type: Number, min: 0, max: 100, required: true },
  correctAnswers: { type: Number, required: true, min: 0 },
  totalQuestions: { type: Number, required: true, min: 1 },
  passed: { type: Boolean, required: true },
  answers: { type: [answerSchema], default: [] }
}, { timestamps: true });

schema.pre("validate", function validateAttempt() {
  if (this.correctAnswers > this.totalQuestions) {
    this.invalidate("correctAnswers", "Correct answers cannot exceed total questions.");
  }
  if (this.answers.length && this.answers.length !== this.totalQuestions) {
    this.invalidate("answers", "Answer count must match total questions.");
  }
  if (this.answers.length && this.answers.filter(answer => answer.correct).length !== this.correctAnswers) {
    this.invalidate("correctAnswers", "Correct answer count must match answer details.");
  }
});

schema.index({ user: 1, skill: 1, createdAt: -1 });
module.exports = mongoose.model("SkillCheckAttempt", schema);
