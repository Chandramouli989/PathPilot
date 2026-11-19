const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = userId => jwt.sign(
  { userId: String(userId) },
  process.env.JWT_SECRET,
  { algorithm: "HS256", expiresIn: "1d" }
);

const registerUser = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 60 characters." });
    }
    if (!emailPattern.test(email) || email.length > 254) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters and no more than 72 bytes." });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("JWT_SECRET must contain at least 32 characters.");
      return res.status(500).json({ success: false, message: "Authentication is not configured correctly." });
    }

    const existingUser = await User.findOne({ email }).select("_id");
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to complete registration." });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!emailPattern.test(email) || !password || password.length > 72) {
      return res.status(400).json({ success: false, message: "Enter a valid email and password." });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("JWT_SECRET must contain at least 32 characters.");
      return res.status(500).json({ success: false, message: "Authentication is not configured correctly." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = createToken(user._id);
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to complete login." });
  }
};

module.exports = { registerUser, loginUser };
