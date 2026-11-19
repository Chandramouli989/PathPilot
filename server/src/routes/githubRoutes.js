const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getPortfolioAnalysis } = require("../controllers/githubController");

const router = express.Router();
router.get("/analyze", authMiddleware, getPortfolioAnalysis);

module.exports = router;
