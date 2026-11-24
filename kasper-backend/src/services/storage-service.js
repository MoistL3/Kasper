const crypto = require('crypto');
const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3, getBucket } = require('../config/s3.js');

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Returns the object key, e.g. avatars/<userId>/<uuid>.png
const upload_avatar = async (user_id, { buffer, mimetype }) => {
    const key = `avatars/${user_id}/${crypto.randomUUID()}.${EXTENSIONS[mimetype]}`;
    await s3.send(
        new PutObjectCommand({
            Bucket: getBucket(),
            Key: key,
            Body: buffer,
            ContentType: mimetype,
        })
    );
    return key;
};

const delete_object = async (key) => {
    await s3.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
};

const get_signed_url = (key, ttl_seconds = 3600) =>
    getSignedUrl(s3, new GetObjectCommand({ Bucket: getBucket(), Key: key }), {
        expiresIn: ttl_seconds,
    });

module.exports = { upload_avatar, delete_object, get_signed_url };