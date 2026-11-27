
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.code = code; // كود نصي اختياري يقدر الفرونت يتفرع عليه (زي EMAIL_NOT_VERIFIED)
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Bad request') { super(message, 400); }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') { super(message, 401); }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code) { super(message, 403, code); }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') { super(message, 404); }
}

class ConflictError extends AppError {
    constructor(message = 'Conflict') { super(message, 409); }
}

class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') { super(message, 429); }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
};