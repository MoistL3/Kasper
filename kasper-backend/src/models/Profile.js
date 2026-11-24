const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        contentType: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const profileSchema = new mongoose.Schema(
    {
        // unique = علاقة 1:1 مع اليوزر
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [300, 'Bio cannot exceed 300 characters'],
            default: '',
        },
        // بنخزن الـ key بس، مش اللينك (اللينك بيتولد وقت القراءة)
        avatar: { type: avatarSchema, default: null },
    },
    { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);
module.exports = { Profile };