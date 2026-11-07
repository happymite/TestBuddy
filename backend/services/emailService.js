import nodemailer from "nodemailer";

// Resend SMTP relay – free tier, 3 k emails/month, no credit card.
// Set these in backend/.env:
//   SMTP_HOST=smtp.resend.com
//   SMTP_PORT=465
//   SMTP_USER=resend
//   SMTP_PASS=<your-resend-api-key>
//   SMTP_FROM=SAGA CITY <no-reply@yourdomain.com>
//   FRONTEND_URL=https://test-buddy-bay.vercel.app

function createTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
  }

  const port = Number(SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendVerificationEmail(to, rawToken) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const link = `${frontendUrl}/verify-email?token=${rawToken}`;

  const transport = createTransport();
  await transport.sendMail({
    from,
    to,
    subject: "Verify your SAGA CITY account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to SAGA CITY</h2>
        <p>Click the button below to verify your email address.
           This link expires in <strong>30 minutes</strong>.</p>
        <a href="${link}"
           style="display:inline-block;padding:12px 24px;background:#1a56db;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Verify my email
        </a>
        <p style="margin-top:20px;font-size:0.85rem;color:#666">
          If you did not create an account, ignore this email.
        </p>
        <p style="font-size:0.8rem;color:#aaa">
          Or copy this link: ${link}
        </p>
      </div>`,
    text: `Verify your SAGA CITY account\n\nClick: ${link}\n\nExpires in 30 minutes.\nIf you did not register, ignore this email.`,
  });
}
