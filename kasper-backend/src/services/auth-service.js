const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User.js');
const {
    BadRequestError,
    UnauthorizedError,
    ConflictError,
} = require('../utils/errors.js');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is missing in .env');
    }
    return secret;
};

const generate_token = (user_id) => {
    return jwt.sign({ id: user_id }, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
};

const verify_token = (token) => {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'string' || !decoded.id) {
        throw new UnauthorizedError('Invalid token payload');
    }
    return decoded;
};

const to_public_user = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

const register_user = async ({ name, email, password } = {}) => {
    // NOTE: `role` is intentionally NOT read from the request. Everyone registers as 'member'.
    if (!name || !email || !password) {
        throw new BadRequestError('Please provide name, email and password');
    }
    // typeof checks stop NoSQL-injection payloads like {"email": {"$gt": ""}}
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        throw new BadRequestError('name, email and password must be strings');
    }
    // Validate the PLAIN password here: the schema's minlength only ever sees the 60-char hash
    if (password.length < 8 || password.length > 72) {
        throw new BadRequestError('Password must be between 8 and 72 characters');
    }

    const normalized_email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalized_email });
    if (existingUser) {
        throw new ConflictError('Email is already registered');
    }

    const hashed_password = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        email: normalized_email,
        password: hashed_password,
    });

    return { user: to_public_user(user), token: generate_token(user._id) };
};

const login_user = async ({ email, password } = {}) => {
    if (!email || !password) {
        throw new BadRequestError('Please provide email and password');
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new BadRequestError('email and password must be strings');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    const valid_password = user && (await bcrypt.compare(password, user.password));
    if (!valid_password || !user.isActive) {
        throw new UnauthorizedError('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false }); // password here is the hash; skip re-validation

    return { user: to_public_user(user), token: generate_token(user._id) };
};

module.exports = {
    register_user,
    login_user,
    verify_token,
};