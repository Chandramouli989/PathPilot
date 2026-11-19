const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    education: {
      type: String
    },

    skills: {
      type: [String]
    },

    interests: {
      type: [String]
    },

    careerGoal: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;