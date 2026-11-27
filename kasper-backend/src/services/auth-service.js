const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User.js');
const { is_valid_pair } = require('../config/academic-data.js');
const { send_verification_email } = require('./mail-service.js');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    TooManyRequestsError,
} = require('../utils/errors.js');

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
// رسالة واحدة لكل أسباب الفشل (غلط / منتهي / محاولات خلصت / مفيش حساب) عشان مفيش تسريب معلومات
const INVALID_CODE_MESSAGE = 'Invalid or expired verification code';

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
    college: user.college,
    department: user.department,
});

// ---------- Email verification helpers ----------

// crypto.randomInt آمن تشفيريًا (Math.random مينفعش للأكواد)
const generate_code = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// HMAC مربوط بالإيميل: حتى لو الداتابيز اتسربت، الكود مش بيتقرأ منها مباشرة
const hash_code = (email, code) =>
    crypto.createHmac('sha256', getJwtSecret()).update(`${email}:${code}`).digest('hex');

const safe_equal = (a, b) => {
    const buf_a = Buffer.from(a);
    const buf_b = Buffer.from(b);
    return buf_a.length === buf_b.length && crypto.timingSafeEqual(buf_a, buf_b);
};

// ملاحظة: الـ user لازم يكون جاي من query عملت فيها .select('+verificationSentAt')
const cooldown_left_ms = (user) => {
    if (!user.verificationSentAt) return 0;
    return Math.max(0, user.verificationSentAt.getTime() + RESEND_COOLDOWN_MS - Date.now());
};

const assert_cooldown_passed = (user) => {
    const left = cooldown_left_ms(user);
    if (left > 0) {
        throw new TooManyRequestsError(
            `Please wait ${Math.ceil(left / 1000)} seconds before requesting a new code`
        );
    }
};

// بيولّد كود جديد، يخزن الهاش، ويبعت الإيميل (الكود القديم بيبطل لأن الهاش اتغيّر)
const issue_verification_code = async (user) => {
    const code = generate_code();
    user.verificationCodeHash = hash_code(user.email, code);
    user.verificationExpiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    user.verificationAttempts = 0;
    user.verificationSentAt = new Date();
    await user.save({ validateBeforeSave: false });

    await send_verification_email(user.email, code, user.name, CODE_TTL_MINUTES);
};

// ---------- Auth flows ----------

const register_user = async ({ name, email, password, college, department } = {}) => {
    // NOTE: `role` is intentionally NOT read from the request. Everyone registers as 'student'.
    if (!name || !email || !password || !college || !department) {
        throw new BadRequestError('Please provide name, email, password, college and department');
    }
    // typeof checks stop NoSQL-injection payloads like {"email": {"$gt": ""}}
    if ([name, email, password, college, department].some((v) => typeof v !== 'string')) {
        throw new BadRequestError('name, email, password, college and department must be strings');
    }
    // Validate the PLAIN password here: the schema's minlength only ever sees the 60-char hash
    if (password.length < 8 || password.length > 72) {
        throw new BadRequestError('Password must be between 8 and 72 characters');
    }
    // الفرونت dropdown مش حماية: لازم الزوج كلية/قسم يتأكد منه هنا
    if (!is_valid_pair(college, department)) {
        throw new BadRequestError('Invalid college or department');
    }

    const normalized_email = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalized_email }).select('+verificationSentAt');
    if (user) {
        // "Pending" = مسجّل بس لسه ماأكدش، وفعلًا اتبعتله كود قبل كده.
        // شرط verificationSentAt بيحمي الحسابات القديمة (اللي اتعملت قبل الميزة دي) من إن حد يكتب فوقها.
        const is_pending = !user.isEmailVerified && user.verificationSentAt;
        if (!is_pending) {
            throw new ConflictError('Email is already registered');
        }
        assert_cooldown_passed(user);
    }

    const hashed_password = await bcrypt.hash(password, 12);

    if (user) {
        // حساب لسه مش متأكد: نكتب البيانات الجديدة فوقه بدل ما نقفل الإيميل على صاحبه الحقيقي
        user.name = name;
        user.password = hashed_password;
        user.college = college;
        user.department = department;
        await user.save();
    } else {
        user = await User.create({
            name,
            email: normalized_email,
            password: hashed_password,
            college,
            department,
        });
    }

    await issue_verification_code(user);

    // مفيش token هنا: الـ token بيتعمل بعد التحقق من الكود بس
    return { email: user.email, requiresVerification: true };
};

const verify_email = async ({ email, code } = {}) => {
    if (!email || !code) {
        throw new BadRequestError('Please provide email and code');
    }
    if (typeof email !== 'string' || typeof code !== 'string') {
        throw new BadRequestError('email and code must be strings');
    }
    if (!/^\d{6}$/.test(code)) {
        throw new BadRequestError(INVALID_CODE_MESSAGE);
    }

    const normalized_email = email.trim().toLowerCase();

    // خطوة واحدة ذرّية: ندوّر + نتأكد إن الكود لسه صالح والمحاولات ما خلصتش + نزوّد العدّاد.
    // لو عملناها على مرحلتين (اقرا ثم زوّد) فطلبات متزامنة كتير تتخطى حد المحاولات.
    const user = await User.findOneAndUpdate(
        {
            email: normalized_email,
            isEmailVerified: false,
            isActive: true,
            verificationCodeHash: { $ne: null },
            verificationExpiresAt: { $gt: new Date() },
            verificationAttempts: { $lt: MAX_VERIFY_ATTEMPTS },
        },
        { $inc: { verificationAttempts: 1 } },
        { new: true }
    ).select('+verificationCodeHash');

    if (!user) {
        throw new BadRequestError(INVALID_CODE_MESSAGE);
    }

    if (!safe_equal(user.verificationCodeHash, hash_code(user.email, code))) {
        throw new BadRequestError(INVALID_CODE_MESSAGE); // العدّاد زاد بالفعل فوق
    }

    user.isEmailVerified = true;
    user.verificationCodeHash = null; // الكود يُستخدم مرة واحدة
    user.verificationExpiresAt = null;
    user.verificationAttempts = 0;
    await user.save({ validateBeforeSave: false });

    return { user: to_public_user(user), token: generate_token(user._id) };
};

const resend_verification_code = async ({ email } = {}) => {
    if (!email) {
        throw new BadRequestError('Please provide email');
    }
    if (typeof email !== 'string') {
        throw new BadRequestError('email must be a string');
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase(),
        isEmailVerified: false,
        isActive: true,
    }).select('+verificationSentAt');

    // مفيش حساب أو متأكد بالفعل: نرجع بهدوء (الـ controller بيرد برسالة موحدة)
    if (!user) return;

    assert_cooldown_passed(user);
    await issue_verification_code(user);
};

const login_user = async ({ email, password } = {}) => {
    if (!email || !password) {
        throw new BadRequestError('Please provide email and password');
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new BadRequestError('email and password must be strings');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
        '+password +verificationSentAt'
    );
    const valid_password = user && (await bcrypt.compare(password, user.password));
    if (!valid_password || !user.isActive) {
        throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isEmailVerified) {
        // الباسورد صح بس الإيميل مش متأكد: نبعتله كود جديد (لو الـ cooldown عدّى) ونوجّه الفرونت لصفحة التحقق
        if (cooldown_left_ms(user) === 0) {
            await issue_verification_code(user).catch((e) =>
                console.error('Could not send verification email:', e)
            );
        }
        throw new ForbiddenError('Please verify your email before signing in', 'EMAIL_NOT_VERIFIED');
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false }); // password here is the hash; skip re-validation

    return { user: to_public_user(user), token: generate_token(user._id) };
};

module.exports = {
    register_user,
    verify_email,
    resend_verification_code,
    login_user,
    verify_token,
};