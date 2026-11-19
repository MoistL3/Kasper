const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth-routes');
// استدعي الـ errorHandler بتاعك هنا

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Error Handling Middleware في الآخر
// app.use(errorHandler);

module.exports = app;