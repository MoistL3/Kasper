const nodemailer = require('nodemailer');

let transporter;

// lazy: بنعمله أول استخدام، بعد ما dotenv يكون حمّل المتغيرات
const getTransporter = () => {
    if (!transporter) {
        const user = process.env.SMTP_USER;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: Number(process.env.SMTP_PORT) || 1025,
            secure: process.env.SMTP_SECURE === 'true', // true لبورت 465 فقط، 587 بيستخدم STARTTLS
            auth: user ? { user, pass: process.env.SMTP_PASS } : undefined, // Mailpit مش محتاج auth
        });
    }
    return transporter;
};

const getFrom = () => process.env.MAIL_FROM || 'Kasper <no-reply@kasper.dev>';

module.exports = { getTransporter, getFrom };