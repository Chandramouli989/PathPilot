const Submission = require("../models/CodingChallengeSubmission");
const bank = require("../services/codingChallengeBank");

exports.list = (_req, res) => res.json({ success: true, challenges: bank.list() });

exports.detail = (req, res) => {
  const challenge = bank.get(req.params.challengeId);
  if (!challenge) return res.status(404).json({ success: false, message: "Challenge not found." });
  // The browser runner needs these cases. They are visible to the client,
  // so they are practice checks, not a secure hidden-test judging system.
  res.json({ success: true, challenge });
};

exports.submit = async (req, res) => {
  try {
    const challenge = bank.get(req.params.challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: "Challenge not found." });
    const { code, passedTests, totalTests } = req.body;
    if (typeof code !== "string" || !code.trim() || code.length > 20000) {
      return res.status(400).json({ success: false, message: "Submit code between 1 and 20,000 characters." });
    }
    if (!Number.isInteger(passedTests) || !Number.isInteger(totalTests) ||
        totalTests !== challenge.tests.length || passedTests < 0 || passedTests > totalTests) {
      return res.status(400).json({ success: false, message: "Invalid test summary." });
    }
    const submission = await Submission.create({
      user: req.user.userId,
      challengeId: challenge.id,
      code,
      passedTests,
      totalTests,
      outcome: passedTests === totalTests ? "passed" : "needs_practice"
    });
    res.status(201).json({
      success: true,
      message: "Submission saved. Test results were produced in your browser sandbox and are not independently verified.",
      submission: {
        _id: submission._id,
        challengeId: submission.challengeId,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        outcome: submission.outcome,
        createdAt: submission.createdAt
      }
    });
  } catch (error) {
    console.error("Coding challenge submission error:", error);
    res.status(500).json({ success: false, message: "Unable to save submission." });
  }
};

exports.history = async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user.userId })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load coding challenge history." });
  }
};
