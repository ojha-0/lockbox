const nodemailer = require('nodemailer');

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return { transporter, testAccount };
};

const sendConsentRequestEmail = async (email, name, thirdPartyName, scope, consentUrl) => {
  const result = await getTransporter();
  const transporter = result.transporter || result;
  const testAccount = result.testAccount;

  const info = await transporter.sendMail({
    from: '"LockBox" <noreply@lockbox.app>',
    to: email,
    subject: `${thirdPartyName} is requesting your LockBox data`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2>Consent Request</h2>
        <p>Hi ${name},</p>
        <p><strong>${thirdPartyName}</strong> is requesting access to the following data from your LockBox account:</p>
        <ul>${scope.map(s => `<li>${s}</li>`).join('')}</ul>
        <p>Review and approve or deny this request. The link expires in 24 hours.</p>
        <a href="${consentUrl}" style="display:inline-block;padding:12px 24px;background:#0A1628;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">Review Request</a>
        <p>If you did not expect this request, you can safely ignore this email or deny the request.</p>
        <p>— The LockBox Team</p>
      </div>
    `,
  });

  if (testAccount) {
    console.log('Consent email preview URL:', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendConsentRequestEmail };
