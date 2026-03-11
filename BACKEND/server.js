const express=require('express');
const dotenv=require('dotenv');
const cors=require('cors');
require('colors');
const connectDB=require('./config/db');
const authRoutes=require("./routes/authRoutes");
const interviewRoutes=require("./routes/interviewRoutes");
const path=require("path");
dotenv.config({ path: path.join(__dirname,".env") });
connectDB();
const app=express();
app.use(express.json());
app.use(cors({
    origin:"*",
    methods:["GET","POST","PUT","PATCH","DELETE"],
    allowedHeaders:["Content-Type","Authorization"],
}));
app.get('/',(req,res)=>{
    res.json({ status: "Backend API is running" });                                                                                              
});
app.use("/api/auth",authRoutes);
app.use("/api/interviews",interviewRoutes);
app.use((err,req,res,next)=>{
    console.error(err);
    res.status(err.statusCode || 500).json({
        success:false,
        message:err.message || "Server Error",
    });
});
const PORT=process.env.PORT || 5000;
const server=app.listen(PORT,()=>{
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
});
process.on('unhandledRejection',(err)=>{
    console.log(`Error: ${err.message}`.red.bold);
    server.close(()=>process.exit(1));
});
