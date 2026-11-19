const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/interviewController");

router.use(auth);
router.get("/questions", controller.listQuestions);
router.get("/history", controller.history);
router.post("/evaluate", controller.evaluate);

module.exports = router;
