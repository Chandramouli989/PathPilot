const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
} = require("../controllers/applicationController");

const router = express.Router();
router.use(authMiddleware);
router.get("/", getApplications);
router.post("/", createApplication);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;
