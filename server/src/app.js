const express = require("express");
const connectDB = require("./config/db");
const {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter,
  aiLimiter
} = require("./middleware/securityMiddleware");

const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const githubRoutes = require("./routes/githubRoutes");
const projectEvidenceRoutes = require("./routes/projectEvidenceRoutes");
const skillCheckRoutes = require("./routes/skillCheckRoutes");
const codingChallengeRoutes = require("./routes/codingChallengeRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

// Vercel runs behind a trusted proxy. This also makes rate limiting use the
// forwarded client IP rather than the proxy address.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use("/api", apiLimiter);

// Ensure the database is ready before any route accesses a model. The
// connection helper caches the connection for warm Vercel invocations.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    return res.status(503).json({
      success: false,
      message: "The service is temporarily unavailable. Please try again shortly."
    });
  }
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "PathPilot API is running." });
});

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    message: databaseReady ? "PathPilot API and database are ready." : "PathPilot API is running but database is not connected.",
    database: databaseReady ? "connected" : "disconnected"
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/project-evidence", projectEvidenceRoutes);
app.use("/api/skill-checks", skillCheckRoutes);
app.use("/api/coding-challenges", codingChallengeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(200).json({ success: true, message: "You accessed a protected route!", user: req.user });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

// Keep API errors in a predictable JSON shape, including CORS and malformed JSON errors.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const isCorsError = error.message === "Origin is not allowed by the CORS policy.";
  const status = error.status || error.statusCode || (isCorsError ? 403 : 500);
  if (status >= 500) console.error("Unhandled API error:", error.message);
  return res.status(status).json({
    success: false,
    message: status === 400 ? "Invalid request payload." : (status >= 500 ? "An unexpected server error occurred." : error.message)
  });
});

module.exports = app;
