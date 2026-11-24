const { S3Client } = require('@aws-sdk/client-s3');

// forcePathStyle: LocalStack بيستخدم localhost:4566/<bucket>، مش <bucket>.localhost
const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
});

const getBucket = () => process.env.S3_BUCKET || 'kasper-avatars';

module.exports = { s3, getBucket };