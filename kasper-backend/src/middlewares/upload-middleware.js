const multer = require('multer');

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

// memoryStorage: الملف بيفضل buffer في الرام لحد ما نبعته لـ S3. الـ limit ده بيحمي الرام.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_AVATAR_SIZE, files: 1 },
});

module.exports = { avatar_upload: upload.single('avatar'), MAX_AVATAR_SIZE };