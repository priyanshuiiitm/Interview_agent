const express=require("express");
const{
    startInterview,
    chatInterview,
    endInterview,
    uploadResume,
    getReport,
}=require("../controllers/interviewcontroller");
const {protect}=require("../middleware/auth");
const router=express.Router();
router.post("/upload-resume",protect,uploadResume);
router.post("/start",protect,startInterview);
router.post("/:id/chat",protect,chatInterview);
router.post("/:id/end",protect,endInterview);
router.get("/:id/report",protect,getReport);
module.exports=router;
