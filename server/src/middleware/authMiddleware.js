const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please sign in."
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please sign in."
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from the server environment.");
    return res.status(500).json({
      success: false,
      message: "Authentication is temporarily unavailable."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please sign in again."
    });
  }
};

module.exports = authMiddleware;
