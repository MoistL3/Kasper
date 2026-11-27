const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const academicRoutes = require('./routes/academic-routes');
const errorHandler = require('./middlewares/error-middleware');
const { NotFoundError } = require('./utils/errors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Kasper API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/academic', academicRoutes);

// Anything that didn't match a route above
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Must be last, and must have exactly 4 params
app.use(errorHandler);

module.exports = app;