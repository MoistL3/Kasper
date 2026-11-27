import api from './axios';

export const getAcademicStructure = async () => {
    const res = await api.get('/academic/structure');
    return res.data.data.structure; // { "Engineering": ["Computer Engineering", ...], ... }
};