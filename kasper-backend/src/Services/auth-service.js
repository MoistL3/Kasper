const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // اتأكد إنها من غير { } لو مصدّرها module.exports = User
const {
    BadRequestError,
    UnauthorizedError,
    ConflictError,
} = require('../utils/errors');

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

const register_user = async ({ name, email, password, role }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ConflictError('Email is already registered');
    }

    const hashed_password = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        email,
        password: hashed_password,
        role,
    });

    const token = generate_token(user._id);
    return {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
    };
};

const login_user = async ({ email, password }) => {
    if (!email || !password) {
        throw new BadRequestError('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    const valid_password = user && (await bcrypt.compare(password, user.password));
    if (!valid_password) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const token = generate_token(user._id);
    return {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
    };
};

module.exports = {
    register_user,
    login_user,
    verify_token,
};