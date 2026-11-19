const { analyzeGitHubPortfolio } = require("../services/githubService");

const getPortfolioAnalysis = async (req, res) => {
  try {
    const username = String(req.query.username || "").trim();
    if (!username) {
      return res.status(400).json({ success: false, message: "GitHub username is required." });
    }

    const data = await analyzeGitHubPortfolio(username);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GitHub portfolio analysis error:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to analyze this GitHub profile right now."
    });
  }
};

module.exports = { getPortfolioAnalysis };
