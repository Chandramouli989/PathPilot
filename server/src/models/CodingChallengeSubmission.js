const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  challengeId: { type: String, required: true },
  language: { type: String, enum: ["javascript"], default: "javascript" },
  code: { type: String, required: true, maxlength: 20000 },
  passedTests: { type: Number, min: 0, required: true },
  totalTests: { type: Number, min: 1, required: true },
  outcome: { type: String, enum: ["passed", "needs_practice"], required: true },
  executionMode: { type: String, default: "browser_sandbox_unverified" }
}, { timestamps: true });

schema.pre("validate", function validateSubmission() {
  if (this.passedTests > this.totalTests) this.invalidate("passedTests", "Passed tests cannot exceed total tests.");
  const expectedOutcome = this.passedTests === this.totalTests ? "passed" : "needs_practice";
  if (this.outcome !== expectedOutcome) this.invalidate("outcome", "Outcome must match the test counts.");
});

schema.index({ user: 1, challengeId: 1, createdAt: -1 });
module.exports = mongoose.model("CodingChallengeSubmission", schema);
