const ProjectEvidence = require("../models/ProjectEvidence");

const isValidOptionalUrl = value => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizePayload = body => ({
  projectName: String(body.projectName || "").trim(),
  description: String(body.description || "").trim(),
  skills: Array.isArray(body.skills)
    ? [...new Set(body.skills.map(skill => String(skill).trim()).filter(Boolean))].slice(0, 15)
    : [],
  repositoryUrl: String(body.repositoryUrl || "").trim(),
  liveUrl: String(body.liveUrl || "").trim(),
  evidenceType: body.evidenceType || "Personal project",
  status: body.status || "In progress"
});

const validatePayload = data => {
  if (!data.projectName || data.projectName.length > 100) return "Project name is required (maximum 100 characters).";
  if (!data.description || data.description.length > 1200) return "Add a project description (maximum 1,200 characters).";
  if (!isValidOptionalUrl(data.repositoryUrl) || !isValidOptionalUrl(data.liveUrl)) return "Repository and demo links must be valid http(s) URLs.";
  if (!["Personal project", "Academic project", "Internship", "Open source", "Other"].includes(data.evidenceType)) return "Select a valid evidence type.";
  if (!["In progress", "Completed"].includes(data.status)) return "Select a valid project status.";
  return null;
};

const getProjectEvidence = async (req, res) => {
  try {
    const items = await ProjectEvidence.find({ user: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.status(200).json({ success: true, evidence: items });
  } catch (error) {
    console.error("Get project evidence error:", error);
    res.status(500).json({ success: false, message: "Unable to load project evidence." });
  }
};

const createProjectEvidence = async (req, res) => {
  try {
    const data = normalizePayload(req.body);
    const validationError = validatePayload(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const item = await ProjectEvidence.create({ ...data, user: req.user.userId });
    res.status(201).json({ success: true, message: "Project evidence saved.", evidence: item });
  } catch (error) {
    console.error("Create project evidence error:", error);
    res.status(500).json({ success: false, message: "Unable to save project evidence." });
  }
};

const updateProjectEvidence = async (req, res) => {
  try {
    const data = normalizePayload(req.body);
    const validationError = validatePayload(data);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const item = await ProjectEvidence.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      data,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Project evidence not found." });
    res.status(200).json({ success: true, message: "Project evidence updated.", evidence: item });
  } catch (error) {
    console.error("Update project evidence error:", error);
    if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid evidence ID." });
    res.status(500).json({ success: false, message: "Unable to update project evidence." });
  }
};

const deleteProjectEvidence = async (req, res) => {
  try {
    const item = await ProjectEvidence.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!item) return res.status(404).json({ success: false, message: "Project evidence not found." });
    res.status(200).json({ success: true, message: "Project evidence deleted." });
  } catch (error) {
    console.error("Delete project evidence error:", error);
    if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid evidence ID." });
    res.status(500).json({ success: false, message: "Unable to delete project evidence." });
  }
};

module.exports = { getProjectEvidence, createProjectEvidence, updateProjectEvidence, deleteProjectEvidence };
