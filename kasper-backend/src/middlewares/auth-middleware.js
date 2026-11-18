const { User } = require('../models/User.js');
const { verify_token } = require('../services/auth-service.js');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors.js');

// Requires "Authorization: Bearer <token>"
const protect = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        throw new UnauthorizedError('Authentication required');
    }

    const token = header.split(' ')[1];
    const decoded = verify_token(token); // throws on invalid / expired

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
        throw new UnauthorizedError('User no longer exists or is inactive');
    }

    req.user = user;
    next();
};

// Use AFTER protect: router.get('/x', protect, restrictTo('admin'), handler)
const restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('You do not have permission to perform this action');
    }
    next();
};

module.exports = { protect, restrictTo };