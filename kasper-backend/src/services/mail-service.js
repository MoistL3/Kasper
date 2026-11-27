const { getTransporter, getFrom } = require('../config/mail.js');

// الاسم جاي من اليوزر، فلازم يتعمله escape قبل ما يدخل في HTML
const escape_html = (value) =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

const send_verification_email = async (to, code, name = '', expires_in_minutes = 10) => {
    const greeting = name ? `Hi ${name},` : 'Hi,';

    const text = [
        greeting,
        '',
        `Your Kasper verification code is: ${code}`,
        `It expires in ${expires_in_minutes} minutes.`,
        '',
        "If you didn't create a Kasper account, you can safely ignore this email.",
    ].join('\n');

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
  <h2 style="margin:0 0 4px;color:#6d45e8">Kasper</h2>
  <p style="margin:0 0 24px;color:#64748b;font-size:13px">your smart academic assistant</p>
  <p>${escape_html(greeting)}</p>
  <p>Use this code to verify your email address:</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:20px 0;color:#0f172a">${code}</p>
  <p style="color:#64748b;font-size:13px">This code expires in ${expires_in_minutes} minutes.
  If you didn't create a Kasper account, you can safely ignore this email.</p>
</div>`;

    await getTransporter().sendMail({
        from: getFrom(),
        to,
        subject: `${code} is your Kasper verification code`,
        text,
        html,
    });
};

module.exports = { send_verification_email };