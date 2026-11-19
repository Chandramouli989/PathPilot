const Assessment = require("../models/Assessment");

const stringArray = value => Array.isArray(value)
  ? value.filter(item => typeof item === "string").map(item => item.trim()).filter(Boolean).slice(0, 30)
  : null;

const validatePayload = body => {
  const education = typeof body.education === "string" ? body.education.trim() : "";
  const careerGoal = typeof body.careerGoal === "string" ? body.careerGoal.trim() : "";
  const skills = stringArray(body.skills);
  const interests = stringArray(body.interests);
  const strengths = body.strengths === undefined ? [] : stringArray(body.strengths);
  const preferredWorkStyle = body.preferredWorkStyle || "No Preference";

  if (!education || education.length > 160) return { error: "Enter your education (maximum 160 characters)." };
  if (!careerGoal || careerGoal.length > 300) return { error: "Enter a career goal (maximum 300 characters)." };
  if (!skills || !interests || !strengths) return { error: "Skills, interests and strengths must be arrays of text values." };
  if (interests.length === 0) return { error: "Add at least one interest." };
  if (!["Remote", "Hybrid", "On-site", "No Preference"].includes(preferredWorkStyle)) {
    return { error: "Select a valid preferred work style." };
  }

  return { data: { education, careerGoal, skills, interests, strengths, preferredWorkStyle } };
};

const createAssessment = async (req, res) => {
  try {
    const result = validatePayload(req.body);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    const existing = await Assessment.findOne({ user: req.user.userId }).select("_id");
    if (existing) return res.status(409).json({ success: false, message: "You have already submitted an assessment." });

    const assessment = await Assessment.create({ ...result.data, user: req.user.userId });
    return res.status(201).json({ success: true, message: "Career assessment submitted successfully.", assessment });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You have already submitted an assessment." });
    console.error("Create assessment error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to submit assessment." });
  }
};

const getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ user: req.user.userId });
    if (!assessment) return res.status(404).json({ success: false, message: "Career assessment not found." });
    return res.status(200).json({ success: true, assessment });
  } catch (error) {
    console.error("Get assessment error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load assessment." });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const result = validatePayload(req.body);
    if (result.error) return res.status(400).json({ success: false, message: result.error });

    // Only supported assessment fields can be changed. Recommendations are invalidated.
    const updated = await Assessment.findOneAndUpdate(
      { user: req.user.userId },
      { $set: { ...result.data, recommendations: null } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Career assessment not found." });
    return res.status(200).json({ success: true, message: "Career assessment updated successfully.", assessment: updated });
  } catch (error) {
    console.error("Update assessment error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update assessment." });
  }
};

module.exports = { createAssessment, getAssessment, updateAssessment };
