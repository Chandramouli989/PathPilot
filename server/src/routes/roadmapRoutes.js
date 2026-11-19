const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateRoadmap,
  getRoadmaps,
  updateMilestone
} = require("../controllers/roadmapController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getRoadmaps);
router.post("/generate", generateRoadmap);
router.patch("/:roadmapId/milestones/:milestoneId", updateMilestone);

module.exports = router;
