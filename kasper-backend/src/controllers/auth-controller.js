const auth_service = require('../services/auth-service.js');

const register_user = async (req, res, next) => {
    try {
        const result = await auth_service.register_user(req.body);
        res.status(201).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const verify_email = async (req, res, next) => {
    try {
        const result = await auth_service.verify_email(req.body);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const resend_code = async (req, res, next) => {
    try {
        await auth_service.resend_verification_code(req.body);
        // رد موحد: مبنقولش لو الإيميل موجود ولا لأ
        res.status(200).json({
            status: 'success',
            message: 'If this account is awaiting verification, a new code has been sent',
        });
    } catch (error) {
        next(error);
    }
};

const login_user = async (req, res, next) => {
    try {
        const result = await auth_service.login_user(req.body);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const get_me = async (req, res) => {
    // req.user is set by the protect middleware; the model's toJSON strips the password
    res.status(200).json({
        status: 'success',
        data: { user: req.user },
    });
};

module.exports = { register_user, verify_email, resend_code, login_user, get_me };