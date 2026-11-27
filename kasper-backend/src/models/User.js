const mongoose = require('mongoose');
const { COLLEGES } = require('../config/academic-data.js');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'User name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [80, 'Name cannot exceed 80 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true, // بيعمل Unique Index تلقائياً ويمنع تكرار الإيميل
            lowercase: true, // بيحول الإيميل لحروف صغيرة قبل الحفظ
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // ميرجعش في أي استعلام find إلا لو طلبته صراحة
        },
        role: {
            type: String,
            enum: ['student', 'lead', 'admin'],
            default: 'student',
        },
        college: {
            type: String,
            required: [true, 'College is required'],
            enum: { values: COLLEGES, message: 'Invalid college' },
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            // مفيش enum هنا: القسم بيعتمد على الكلية، فالتحقق من الزوج بيتم في auth-service
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        // حقول التحقق كلها select:false: مبترجعش في أي query إلا لو طلبتها بـ .select('+field')
        // تحذير: لو نسيت تطلب verificationSentAt في query، قيمتها undefined والـ cooldown بيتخطّى بصمت
        verificationCodeHash: { type: String, select: false, default: null },
        verificationExpiresAt: { type: Date, select: false, default: null },
        verificationAttempts: { type: Number, select: false, default: 0 },
        verificationSentAt: { type: Date, select: false, default: null },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password;
                delete ret.verificationCodeHash;
                delete ret.verificationExpiresAt;
                delete ret.verificationAttempts;
                delete ret.verificationSentAt;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const User = mongoose.model('User', userSchema);
module.exports = { User };