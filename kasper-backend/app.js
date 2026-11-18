const express = require('express');
const cors = require('cors');
const auth_router = require('./routes/auth-routes.js');
const error_handler = require('./middlewares/error-middleware.js');
const { NotFoundError } = require('./utils/errors.js');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Kasper API is running' });
});

app.use('/api/auth', auth_router);

// Anything that didn't match a route above
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Must be last, and must have exactly 4 params
app.use(error_handler);

module.exports = app;