const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/codingChallengeController");

router.use(auth);
router.get("/", controller.list);
router.get("/history", controller.history);
router.get("/:challengeId", controller.detail);
router.post("/:challengeId/submit", controller.submit);

module.exports = router;
