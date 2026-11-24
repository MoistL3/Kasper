import api from './axios';

export const getMyProfile = async () => {
    const res = await api.get('/profile/me');
    return res.data.data.profile;
};

export const updateMyProfile = async (payload) => {
    const res = await api.patch('/profile/me', payload);
    return res.data.data.profile;
};

export const uploadAvatar = async (file) => {
    const form = new FormData();
    form.append('avatar', file); // field name must match upload.single('avatar')
    const res = await api.put('/profile/me/avatar', form);
    return res.data.data.profile;
};

export const removeAvatar = async () => {
    const res = await api.delete('/profile/me/avatar');
    return res.data.data.profile;
};