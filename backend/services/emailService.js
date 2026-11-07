import nodemailer from "nodemailer";

// Universal SMTP / Service email transport
// Supports Gmail, Resend, Brevo, AWS SES, or any custom SMTP provider.
//
// Recommended configuration for Gmail (Free, no domain needed):
//   SMTP_SERVICE=gmail   (or SMTP_HOST=smtp.gmail.com, SMTP_PORT=465)
//   SMTP_USER=your_email@gmail.com
//   SMTP_PASS=your-16-char-app-password
//   SMTP_FROM=SAGA CITY <your_email@gmail.com>
//   FRONTEND_URL=https://test-buddy-bay.vercel.app

function createTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SERVICE } =
    process.env;

  const timeoutConfig = {
    connectionTimeout: 8000, // 8s to establish TCP connection
    greetingTimeout: 5000,   // 5s to wait for SMTP greeting
    socketTimeout: 10000,    // 10s socket inactivity timeout
  };

  if (SMTP_SERVICE) {
    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error(
        "Email service not configured. Set SMTP_USER and SMTP_PASS in environment."
      );
    }
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      ...timeoutConfig,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment."
    );
  }

  const port = Number(SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    ...timeoutConfig,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendVerificationEmail(to, rawToken) {
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const link = `${frontendUrl}/verify-email?token=${rawToken}`;

  const transport = createTransport();
  await transport.sendMail({
    from,
    to,
    subject: "Verify your SAGA CITY account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#111827;margin-top:0">Welcome to SAGA CITY</h2>
        <p style="color:#374151;font-size:15px;line-height:1.5">
          Please confirm your email address to activate your student account.
          This link will expire in <strong>30 minutes</strong>.
        </p>
        <div style="margin:28px 0">
          <a href="${link}"
             style="display:inline-block;padding:12px 24px;background:#1a56db;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;font-size:14px">
            Verify Email Address
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280;line-height:1.4">
          If you did not create an account on SAGA CITY, you can safely ignore this message.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
        <p style="font-size:12px;color:#9ca3af;word-break:break-all">
          Button not working? Paste this link into your browser:<br />
          <a href="${link}" style="color:#1a56db">${link}</a>
        </p>
      </div>`,
    text: `Welcome to SAGA CITY\n\nPlease confirm your email address by opening the following link:\n${link}\n\nThis link will expire in 30 minutes.\nIf you did not register, please ignore this email.`,
  });
}
