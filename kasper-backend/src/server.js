const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });const { connectDB } = require('./config/db');
const express = require('express');
const app = express() ;


const auth_router = require('../src/routes/auth-routes.js')


app.use(express.json());
app.use('/api/auth' , auth_router)


// تشغيل السيرفر
connectDB().then(()=>{
    app.listen(3000 , ()=>{
        console.log("server is running")
    })
})