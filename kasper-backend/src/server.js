require('dotenv').config();
const { connectDB } = require('./config/db');
const express = require('express');
const app = express() ;


const auth_router = require('../src/routes/auth.js')


app.use(express.json());
app.use('/api/auth' , auth_router)


// تشغيل السيرفر
connectDB().then(()=>{
    app.listen(3000 , ()=>{
        console.log("server is running")
    })
})