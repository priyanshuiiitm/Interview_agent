const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const User=require("../models(database)/User");
const signToken=(id)=>
    jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN || "7d",
    });
    const signup=async(req,res,next)=>{
        try{
            const{name,email,password}=req.body;
            if(!name || !email || !password){
                return res.status(400).json({success:false,message:"name,email,password are required"});
            }
            const existing=await User.findOne({email:email.toLowerCase()});
            if(existing){
                return res.status(409).json({success:false,message:"Email already registered"});
            }
            const hashed=await bcrypt.hash(password,10);
            const user=await User.create({
                name,
                email:email.toLowerCase(),
                password:hashed,
            });
            const token=signToken(user._id);
            return res.status(201).json({
                success:true,
                token,
                user:{id:user._id,name:user.name,email:user.email,role:user.role},
            });
        } catch(error){
            next(error);
        }
    };
const login=async(req,res,next)=>{
    try{
        const{email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({success:false,message:"email and passowrd are required"});
        }
        const user=await User.findOne({email:email.toLowerCase()});
        if(!user){
            return res.status(401).json({success:false,message:"Invalid credentials"});
        }
        const ok=await bcrypt.compare(password,user.password);
        if(!ok){
            return res.status(401).json({success:false,message:"Invalid credentials"});
        }
        const token=signToken(user._id);
        return res.json({
            success:true,
            token,
            user:{id:user._id,name:user.name,email:user.email,role:user.role},
        });
    }catch(error){
        next(error);
    }
};
const me=async(req,res)=>{
    res.json({success:true,user:req.user});
};
module.exports={signup,login,me};
