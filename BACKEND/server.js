const express=require('express');
const dotenv=require('dotenv');
const cors=require('cors');
require('colors');
dotenv.config({path:'./.env'});
const connectDB=require('./config/db');
connectDB();
const app=express();
app.use(express.json());
app.use(cors());
app.get('/',(req,res)=>{
    res.send('API is running...');
});
const PORT=process.env.PORT || 5000;
const server=app.listen(PORT,()=>{
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
});
process.on('unhandledRejection',(err,promise)=>{
    console.log(`Error: ${err.message}`);
    server.close(()=>process.exit(1));
})