import nodemailer from "nodemailer";

// Universal email service supporting:
// 1. Brevo HTTPS API (Recommended for Render free tier — no SMTP port blocks, no domain needed)
// 2. Standard SMTP / Gmail (via Nodemailer)

async function sendViaBrevoApi({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER
  )?.trim();
  const senderName = process.env.BREVO_SENDER_NAME || "SAGA CITY";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Brevo not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in environment."
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Brevo API failed with status ${response.status}`
    );
  }

  return response.json();
}

function createTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SERVICE } =
    process.env;

  const timeoutConfig = {
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
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
  const link = `${frontendUrl}/verify-email?token=${rawToken}`;

  const html = `
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
    </div>`;

  const text = `Welcome to SAGA CITY\n\nPlease confirm your email address by opening the following link:\n${link}\n\nThis link will expire in 30 minutes.\nIf you did not register, please ignore this email.`;

  // 1. If Brevo API key is configured, send via Brevo HTTPS REST API (Port 443 — works on Render Free Tier)
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevoApi({
      to,
      subject: "Verify your SAGA CITY account",
      html,
      text,
    });
  }

  // 2. Fall back to standard SMTP / Nodemailer
  const transport = createTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from,
    to,
    subject: "Verify your SAGA CITY account",
    html,
    text,
  });
}
