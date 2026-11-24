const profile_service = require('../services/profile-service.js');

const get_my_profile = async (req, res, next) => {
    try {
        const profile = await profile_service.get_my_profile(req.user._id);
        res.status(200).json({ status: 'success', data: { profile } });
    } catch (error) {
        next(error);
    }
};

const update_my_profile = async (req, res, next) => {
    try {
        const profile = await profile_service.update_my_profile(req.user._id, req.body);
        res.status(200).json({ status: 'success', data: { profile } });
    } catch (error) {
        next(error);
    }
};

const set_my_avatar = async (req, res, next) => {
    try {
        const profile = await profile_service.set_avatar(req.user._id, req.file);
        res.status(200).json({ status: 'success', data: { profile } });
    } catch (error) {
        next(error);
    }
};

const remove_my_avatar = async (req, res, next) => {
    try {
        const profile = await profile_service.remove_avatar(req.user._id);
        res.status(200).json({ status: 'success', data: { profile } });
    } catch (error) {
        next(error);
    }
};

module.exports = { get_my_profile, update_my_profile, set_my_avatar, remove_my_avatar };