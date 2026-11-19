const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProjectEvidence,
  createProjectEvidence,
  updateProjectEvidence,
  deleteProjectEvidence
} = require("../controllers/projectEvidenceController");

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProjectEvidence);
router.post("/", createProjectEvidence);
router.patch("/:id", updateProjectEvidence);
router.delete("/:id", deleteProjectEvidence);

module.exports = router;
