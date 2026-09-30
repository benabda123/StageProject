const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true pour le port 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function buildResetEmailTemplate(code) {
  return {
    subject: 'Réinitialisation de votre mot de passe Keystone',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="margin:0;padding:24px;background-color:#f5f5f7;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e4e7;">
          <h2 style="color:#1a1a2e;margin-top:0;">Réinitialisation de votre mot de passe</h2>
          <p style="color:#555555;">Bonjour,</p>
          <p style="color:#555555;">Vous avez demandé la réinitialisation de votre mot de passe Keystone. Utilisez le code ci-dessous pour confirmer votre identité :</p>
          <div style="text-align:center;margin:24px 0;">
            <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#7c3aed;background:#f3e8ff;padding:12px 24px;border-radius:8px;">${code}</span>
          </div>
          <p style="color:#555555;"><strong>Ce code expire dans 10 minutes.</strong></p>
          <p style="color:#999999;font-size:13px;margin-bottom:0;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      </body>
      </html>
    `,
  };
}

async function sendPasswordResetCode(to, code) {
  const mail = buildResetEmailTemplate(code);
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: mail.subject,
    html: mail.html,
  });
}

module.exports = { sendPasswordResetCode };
