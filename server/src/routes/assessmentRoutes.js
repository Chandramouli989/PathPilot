const express = require("express");

const {
  createAssessment,
  getAssessment,
  updateAssessment
} = require("../controllers/assessmentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Submit a career assessment
router.post("/", authMiddleware, createAssessment);

// Get the user's career assessment
router.get("/", authMiddleware, getAssessment);

router.patch("/", authMiddleware, updateAssessment);

module.exports = router;