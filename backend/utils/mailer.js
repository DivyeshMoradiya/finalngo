const nodemailer = require('nodemailer');

let transporter = null;
let isTestTransporter = false;

async function ensureTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465; // true for 465, false for 587/25
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const enableDebug = String(process.env.SMTP_DEBUG).toLowerCase() === 'true';
  const rejectUnauthorized = String(process.env.SMTP_TLS_REJECT_UNAUTH || 'true').toLowerCase() !== 'false';

  // Treat any provided host as valid, including localhost for dev setups
  if (host) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: { rejectUnauthorized },
      logger: enableDebug,
      debug: enableDebug,
      pool: true,
    });
    isTestTransporter = false;
    return transporter;
  }

  // Fallback to Ethereal for development so it doesn't fail
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  isTestTransporter = true;
  console.warn('[Mailer] No valid SMTP configured. Using Ethereal test SMTP. Emails will not reach real inboxes.');
  return transporter;
}

async function verifyTransport() {
  try {
    const tx = await ensureTransporter();
    await tx.verify();
    console.log('[Mailer] SMTP connection verified');
  } catch (err) {
    console.error('[Mailer] SMTP verify failed:', err?.message || err);
  }
}

async function sendMail(to, subject, html) {
  if (!to) throw new Error('Missing recipient');
  const tx = await ensureTransporter();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@hopenest.local';
  const info = await tx.sendMail({ from, to, subject, html });
  if (isTestTransporter) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('[Mailer] Preview URL:', url);
  }
}

module.exports = { sendMail, verifyTransport };

