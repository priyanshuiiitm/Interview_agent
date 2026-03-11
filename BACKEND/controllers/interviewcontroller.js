const multer=require("multer");
const Interview=require("../models(database)/Interview");
const Feedback=require("../models(database)/Feedback");
const{
    startAgentInterview,
    chatWithAgent,
    endAgentInterview,
    uploadResumeToAgent
}=require("../services/agentservice");

const normalizeReport=(report={})=>({
    overall_score:report.overall_score ?? report.overallScore ?? 0,
    summary:report.summary ?? "",
    strengths:Array.isArray(report.strengths) ? report.strengths : [],
    weaknesses:Array.isArray(report.weaknesses) ? report.weaknesses : [],
    verdict:report.verdict ?? "Pending",
});

const storage=multer.memoryStorage();
const upload=multer({storage});
const ROLE_MAP={
    "Frontend Developer": "frontend",
    "Backend Developer": "backend",
    "Fullstack Engineer": "fullstack-developer",
    "Data Analyst": "data-analyst",
    "Data Scientist": "data-scientist",
    "ML Engineer": "ml-engineer",
    "GenAI Engineer": "genai-engineer",
    "App Developer": "app-developer",
    "Cybersecurity Engineer": "cybersecurity-engineer",
    "Blockchain Developer": "blockchain-developer",
};
const DIFFICULTY_MAP={
    "Junior (0-2 yrs)": "junior",                                                                                                                
    "Mid-Level (3-5 yrs)": "mid",                                                                                                                
    "Senior (6+ yrs)": "senior",                                                                                                                 
};
const startInterview=async(req,res,next)=>{
    try{
        const roleLabel=req.body.role || "Frontend Developer";
        const difficultyLabel=req.body.difficulty || "Junior (0-2 yrs)";
        const resumeContext=req.body.resume_context || null;
        const role=ROLE_MAP[roleLabel] || "frontend";
        const difficulty=DIFFICULTY_MAP[difficultyLabel] || "junior";
        const topic=`${roleLabel}-${difficultyLabel}`;
        const agentStart=await startAgentInterview(topic,resumeContext);
        const interview=await Interview.create({
            userId:req.user._id,
            role,
            difficulty,
            status:"active",
            agentSessionId:agentStart.session_id,
            resumeContext,
            transcript:[
                {
                    sender:"ai",
                    content:agentStart.question || "Welcome to your interview.",
                    metadata:{type:"question"},
                },
            ],
        });
        res.status(201).json({
            success:true,
            interviewId:interview._id,
            agentSessionId:agentStart.session_id,
            question:agentStart.question,
            hint:agentStart.hint,
        });
    } catch(error){
        next(error);
    }
};
const chatInterview=async(req,res,next)=>{
    try{
        const{id}=req.params;
        const{answer}=req.body;
        if(!answer){
            return res.status(400).json({success:false,message:"answer is required"});
        }
        const interview=await Interview.findOne({_id:id,userId:req.user._id});
        if(!interview){
            return res.status(404).json({success:false,message:"Interview not found"});
        }
        if(interview.status!=="active"){
            return res.status(400).json({success:false,message:"Interview is not active"});
        }
        interview.transcript.push({sender:"user",content:answer});
        let agentResponse;
        try{
            agentResponse=await chatWithAgent(interview.agentSessionId,answer);
        }
        catch(error){
            if(error.message?.includes("timed out")){
                return res.status(504).json({
                    success:false,
                    message:"Interview agent took too long to respond. Please try again.",
                });
            }
            throw error;
        }
        if(agentResponse.report){
            const normalizedReport=normalizeReport(agentResponse.report);
            interview.status="completed";
            interview.endTime=new Date();
            interview.transcript.push({
                sender:"ai",
                content:"Interview ended. Report generated.",
                metadata:{type:"report"},
            });
            await interview.save();
            await Feedback.findOneAndUpdate(
                {
                    interviewId:interview._id,userId:req.user._id
                },
                {
                    interviewId:interview._id,
                    userId:req.user._id,
                    overallScore:normalizedReport.overall_score,
                    summary:normalizedReport.summary,
                    strengths:normalizedReport.strengths,
                    weaknesses:normalizedReport.weaknesses,
                    verdict:normalizedReport.verdict,
                },
                {upsert:true,new:true}
            );
            return res.json({
                success:true,
                ended:true,
                message:agentResponse.question,
                report:normalizedReport,
            });
        }
        interview.transcript.push({
            sender:"ai",
            content:agentResponse.question || "",
            metadata:{type:"question",hint:agentResponse.hint || ""},
        });
        await interview.save();
        return res.json({
            success:true,
            ended:false,
            question:agentResponse.question,
            hint:agentResponse.hint,
            score:agentResponse.score,
            feedback:agentResponse.feedback,
        });
    }
    catch(error){
        next(error);
    }
};
const endInterview=async(req,res,next)=>{
    try{
        const{id}=req.params;
        const interview=await Interview.findOne({_id:id,userId:req.user._id});
        if(!interview){
            return res.status(404).json({success:false,message:"Interview not found"});
        }
        if(interview.status!=="active"){
            const feedback=await Feedback.findOne({
                interviewId:id,
                userId:req.user._id,
            });
            return res.json({
                success:true,
                ended:true,
                report:feedback ? normalizeReport(feedback.toObject()) : null,
            });
        }
        let agentResponse;
        try{
            agentResponse=await endAgentInterview(interview.agentSessionId);
        }
        catch(error){
            if(error.message?.includes("timed out")){
                return res.status(504).json({
                    success:false,
                    message:"Interview agent took too long while generating the final report. Please try ending again.",
                });
            }
            throw error;
        }
        const normalizedReport=normalizeReport(agentResponse.report);
        interview.status="completed";
        interview.endTime=new Date();
        interview.transcript.push({
            sender:"ai",
            content:"Interview ended early by candidate. Report generated.",
            metadata:{type:"report",reason:"user_exit"},
        });
        await interview.save();
        await Feedback.findOneAndUpdate(
            {
                interviewId:interview._id,userId:req.user._id
            },
            {
                interviewId:interview._id,
                userId:req.user._id,
                overallScore:normalizedReport.overall_score,
                summary:normalizedReport.summary,
                strengths:normalizedReport.strengths,
                weaknesses:normalizedReport.weaknesses,
                verdict:normalizedReport.verdict,
            },
            {upsert:true,new:true}
        );
        return res.json({
            success:true,
            ended:true,
            message:agentResponse.question || "Interview ended.",
            report:normalizedReport,
        });
    }
    catch(error){
        next(error);
    }
};
const uploadResume=[
    upload.single("file"),
    async(req,res,next)=>{
        try{
            if(!req.file){
                return res.status(400).json({success:false,message:"No file uploaded"});
            }
            const result=await uploadResumeToAgent(req.file);
            return res.json({
                success:true,
                parsed:result.data || null,
                message:result.message || "Resume parsed",
            });
        }
        catch(error){
            next(error);
        }
    },
];
const getReport=async(req,res,next)=>{
    try{
        const{id}=req.params;
        const feedback=await Feedback.findOne({
            interviewId:id,
            userId:req.user._id,
        });
        if(!feedback){
            return res.status(404).json({success:false,message:"Report not found yet"});
        }
        return res.json(
            {
              success:true,
              report:normalizeReport(feedback.toObject())  
            }
        );
    }
    catch(error){
        next(error);
    }
};
module.exports={
    startInterview,
    chatInterview,
    endInterview,
    uploadResume,
    getReport,
};
