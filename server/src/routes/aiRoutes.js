const express = require("express");
const { testAI ,
    generateCareerRecommendations
 } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", authMiddleware, testAI);
router.get(
    "/career-recommendations",
    authMiddleware,
    generateCareerRecommendations
  );


module.exports = router;