const nodemailer = require('nodemailer');

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Use Ethereal for dev
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return { transporter, testAccount };
};

const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const result = await getTransporter();
  const transporter = result.transporter || result;
  const testAccount = result.testAccount;

  const info = await transporter.sendMail({
    from: '"LockBox" <noreply@lockbox.app>',
    to: email,
    subject: 'Reset your LockBox password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">Reset Password</a>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>— The LockBox Team</p>
      </div>
    `,
  });

  if (testAccount) {
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendPasswordResetEmail };
