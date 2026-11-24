const { AppError } = require('../utils/errors.js');


// eslint-disable-next-line no-unused-vars
const error_handler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err.name === 'ValidationError') {
        // Mongoose schema validation
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    } else if (err.code === 11000) {
        // Unique index violation (e.g. two simultaneous registers with same email)
        statusCode = 409;
        message = 'Email is already registered';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}`;
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Invalid or expired token';
    } else if (err.type === 'entity.parse.failed') {
        // Malformed JSON body
        statusCode = 400;
        message = 'Malformed JSON body';
    }

    if (statusCode === 500) {
        console.error(err); // log the real error, never leak it to the client
    }

    res.status(statusCode).json({
        status: statusCode < 500 ? 'fail' : 'error',
        message,
    });
};

module.exports = error_handler;