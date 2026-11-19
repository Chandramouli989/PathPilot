const router=require("express").Router(),auth=require("../middleware/authMiddleware"),c=require("../controllers/skillCheckController");
router.use(auth);router.get("/",c.list);router.get("/results",c.results);router.get("/:skill/questions",c.questions);router.post("/:skill/submit",c.submit);module.exports=router;
