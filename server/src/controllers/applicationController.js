const Application = require("../models/Application");

const STATUSES = ["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected"];
const TYPES = ["Full-time", "Internship", "Contract", "Part-time", "Other"];

const cleanDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const validOptionalUrl = value => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalize = body => ({
  company: String(body.company || "").trim(),
  role: String(body.role || "").trim(),
  sourceUrl: String(body.sourceUrl || "").trim(),
  location: String(body.location || "").trim(),
  opportunityType: body.opportunityType || "Full-time",
  status: body.status || "Saved",
  dateApplied: cleanDate(body.dateApplied),
  followUpDate: cleanDate(body.followUpDate),
  notes: String(body.notes || "").trim()
});

const validate = data => {
  if (!data.company || data.company.length > 100) return "Company is required (maximum 100 characters).";
  if (!data.role || data.role.length > 120) return "Role is required (maximum 120 characters).";
  if (!validOptionalUrl(data.sourceUrl)) return "Opportunity URL must be a valid http(s) URL.";
  if (!TYPES.includes(data.opportunityType)) return "Select a valid opportunity type.";
  if (!STATUSES.includes(data.status)) return "Select a valid application status.";
  if (data.dateApplied === undefined || data.followUpDate === undefined) return "Enter valid dates.";
  if (data.notes.length > 2000) return "Notes must be 2,000 characters or fewer.";
  return null;
};

const getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.userId })
      .sort({ updatedAt: -1 }).lean();
    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ success: false, message: "Unable to load your application tracker." });
  }
};

const createApplication = async (req, res) => {
  try {
    const data = normalize(req.body);
    const issue = validate(data);
    if (issue) return res.status(400).json({ success: false, message: issue });
    const application = await Application.create({ ...data, user: req.user.userId });
    res.status(201).json({ success: true, message: "Application saved to your tracker.", application });
  } catch (error) {
    console.error("Create application error:", error);
    res.status(500).json({ success: false, message: "Unable to save this application." });
  }
};

const updateApplication = async (req, res) => {
  try {
    const data = normalize(req.body);
    const issue = validate(data);
    if (issue) return res.status(400).json({ success: false, message: issue });
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      data,
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ success: false, message: "Application not found." });
    res.status(200).json({ success: true, message: "Application updated.", application });
  } catch (error) {
    console.error("Update application error:", error);
    if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid application ID." });
    res.status(500).json({ success: false, message: "Unable to update this application." });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!application) return res.status(404).json({ success: false, message: "Application not found." });
    res.status(200).json({ success: true, message: "Application deleted." });
  } catch (error) {
    console.error("Delete application error:", error);
    if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid application ID." });
    res.status(500).json({ success: false, message: "Unable to delete this application." });
  }
};

module.exports = { getApplications, createApplication, updateApplication, deleteApplication };
