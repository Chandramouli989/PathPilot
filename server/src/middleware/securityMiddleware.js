const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");

const configuredOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map(origin => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Requests from curl/Postman and server-to-server clients may not send Origin.
    if (!origin || configuredOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(new Error("Origin is not allowed by the CORS policy."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 180,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many API requests. Please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please wait 15 minutes and try again." }
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "AI request limit reached. Please try again later." }
});

module.exports = {
  helmetMiddleware: helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),
  corsMiddleware: cors(corsOptions),
  apiLimiter,
  authLimiter,
  aiLimiter
};
