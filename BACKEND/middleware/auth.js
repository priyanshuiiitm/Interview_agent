const jwt=require("jsonwebtoken");
const User=require("../models(database)/User");
const protect=async(req,res,next)=>{
    try{
        const authHeader=req.headers.authorization || "";
        const token=authHeader.startsWith("Bearer")? authHeader.split(" ")[1]:null;
        if(!token){
            return res.status(401).json({ success:false,message:"Not authorized"});
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findById(decoded.id).select("-password");
        if(!user){
            return res.status(404).json({success:false,message:"Invalid token user"});
        }
        req.user=user;
        next();
    } catch(error){
        return res.status(401).json({success:false,message:"Token invalid or expired"});
    }
};
module.exports={protect};