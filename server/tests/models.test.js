const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const SkillCheckAttempt = require("../src/models/SkillCheckAttempt");
const CodingChallengeSubmission = require("../src/models/CodingChallengeSubmission");

const user = new mongoose.Types.ObjectId();

test("SkillCheckAttempt accepts internally consistent answer records", async () => {
  const answers = Array.from({ length: 5 }, (_, index) => ({
    questionId: `q${index + 1}`,
    selectedOption: 1,
    correct: index < 4
  }));
  const attempt = new SkillCheckAttempt({
    user, skill: "JavaScript", score: 80, correctAnswers: 4,
    totalQuestions: 5, passed: true, answers
  });
  await assert.doesNotReject(attempt.validate());
});

test("SkillCheckAttempt rejects answer counts that disagree with details", async () => {
  const attempt = new SkillCheckAttempt({
    user, skill: "JavaScript", score: 80, correctAnswers: 4,
    totalQuestions: 5, passed: true,
    answers: [{ questionId: "q1", selectedOption: 1, correct: true }]
  });
  await assert.rejects(attempt.validate());
});

test("CodingChallengeSubmission accepts a consistent passed result", async () => {
  const submission = new CodingChallengeSubmission({
    user, challengeId: "two-sum", code: "function solve() {}",
    passedTests: 3, totalTests: 3, outcome: "passed"
  });
  await assert.doesNotReject(submission.validate());
});

test("CodingChallengeSubmission rejects an outcome that disagrees with test counts", async () => {
  const submission = new CodingChallengeSubmission({
    user, challengeId: "two-sum", code: "function solve() {}",
    passedTests: 2, totalTests: 3, outcome: "passed"
  });
  await assert.rejects(submission.validate());
});
