const User = require("../models/User");

const normalizeStringArray = value => {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter(item => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 30);
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Explicit allowlist: never pass req.body directly into a MongoDB update.
    const updates = {};
    if (req.body.education !== undefined) {
      if (typeof req.body.education !== "string" || req.body.education.length > 160) {
        return res.status(400).json({ success: false, message: "Education must be text under 160 characters." });
      }
      updates.education = req.body.education.trim();
    }
    if (req.body.careerGoal !== undefined) {
      if (typeof req.body.careerGoal !== "string" || req.body.careerGoal.length > 300) {
        return res.status(400).json({ success: false, message: "Career goal must be text under 300 characters." });
      }
      updates.careerGoal = req.body.careerGoal.trim();
    }
    for (const field of ["skills", "interests"]) {
      if (req.body[field] !== undefined) {
        const normalized = normalizeStringArray(req.body[field]);
        if (!normalized) return res.status(400).json({ success: false, message: `${field} must be an array of text values.` });
        updates[field] = normalized;
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No supported profile fields were provided." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, message: "Profile updated successfully.", user });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update profile." });
  }
};

module.exports = { getProfile, updateProfile };
