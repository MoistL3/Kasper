const { Profile } = require('../models/Profile.js');
const storage = require('./storage-service.js');
const { detect_image_type } = require('../utils/image-type.js');
const { BadRequestError } = require('../utils/errors.js');

// Lazy create: أول مرة اليوزر يفتح البروفايل بيتعملّه
const get_or_create_profile = async (user_id) => {
    try {
        return await Profile.findOneAndUpdate(
            { user: user_id },
            { $setOnInsert: { bio: '' } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        // طلبين متزامنين أول مرة: التاني بيضرب unique index، فنقرا اللي اتعمل
        if (error.code === 11000) return Profile.findOne({ user: user_id });
        throw error;
    }
};

const to_public_profile = async (profile) => ({
    id: profile._id,
    user: profile.user,
    bio: profile.bio,
    avatarUrl: profile.avatar?.key ? await storage.get_signed_url(profile.avatar.key) : null,
    updatedAt: profile.updatedAt,
});

const get_my_profile = async (user_id) => {
    const profile = await get_or_create_profile(user_id);
    return to_public_profile(profile);
};

const update_my_profile = async (user_id, { bio } = {}) => {
    if (bio === undefined) {
        throw new BadRequestError('Nothing to update');
    }
    if (typeof bio !== 'string') {
        throw new BadRequestError('bio must be a string');
    }
    const profile = await get_or_create_profile(user_id);
    profile.bio = bio;
    await profile.save(); // maxlength validator بيشتغل هنا
    return to_public_profile(profile);
};

const set_avatar = async (user_id, file) => {
    if (!file) {
        throw new BadRequestError('Please upload an image in the "avatar" field');
    }
    const mimetype = detect_image_type(file.buffer);
    if (!mimetype) {
        throw new BadRequestError('Only JPEG, PNG or WebP images are allowed');
    }

    const profile = await get_or_create_profile(user_id);
    const old_key = profile.avatar?.key;

    // 1) ارفع الجديدة  2) حدّث Mongo  3) امسح القديمة
    // لو 2 فشلت لسه عندك القديمة شغالة، ومنسيبش ملف يتيم في S3
    const new_key = await storage.upload_avatar(user_id, { buffer: file.buffer, mimetype });
    profile.avatar = { key: new_key, contentType: mimetype, updatedAt: new Date() };
    try {
        await profile.save();
    } catch (error) {
        await storage.delete_object(new_key).catch(() => {});
        throw error;
    }

    if (old_key) {
        await storage.delete_object(old_key).catch((e) => console.error('Old avatar cleanup failed:', e));
    }
    return to_public_profile(profile);
};

const remove_avatar = async (user_id) => {
    const profile = await get_or_create_profile(user_id);
    const old_key = profile.avatar?.key;
    if (!old_key) return to_public_profile(profile); // idempotent

    profile.avatar = null;
    await profile.save();
    await storage.delete_object(old_key).catch((e) => console.error('Avatar cleanup failed:', e));
    return to_public_profile(profile);
};

module.exports = { get_my_profile, update_my_profile, set_avatar, remove_avatar };