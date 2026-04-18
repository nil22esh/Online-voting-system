import nodemailer from "nodemailer";
import config from "../config/config.js";
import logger from "../utils/logger.js";

/**
 * Configure Nodemailer Transporter
 */
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, // true for 465, false for other ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Verify transporter connection
 */
transporter.verify((error, success) => {
  if (error) {
    logger.error(`SMTP Connection Error: ${error.message}`);
  } else {
    logger.info("SMTP Server is ready to take our messages");
  }
});

/**
 * Generic function to send email
 */
const sendEmail = async (options) => {
  const mailOptions = {
    from: config.smtp.from,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    return null;
  }
};

/**
 * Shared base layout wrapper for all emails
 */
const baseTemplate = (content, accentColor = "#6c63ff") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Online Voting System</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:40px 40px 30px;text-align:center;border-bottom:3px solid ${accentColor};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <div style="display:inline-block;background:linear-gradient(135deg,${accentColor},#a78bfa);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:28px;">🗳️</div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size:26px;font-weight:800;background:linear-gradient(90deg,#ffffff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;">Online Voting System</span>
                    <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Secure · Transparent · Democratic</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#1e1e2e;padding:40px;border-left:1px solid #2a2a3e;border-right:1px solid #2a2a3e;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#16162a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #2a2a3e;border-top:none;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;">This is an automated message — please do not reply to this email.</p>
              <p style="margin:0;font-size:12px;color:#64748b;">© 2026 Online Voting System. All rights reserved.</p>
              <div style="margin-top:16px;">
                <span style="display:inline-block;width:6px;height:6px;background:${accentColor};border-radius:50%;margin:0 3px;"></span>
                <span style="display:inline-block;width:6px;height:6px;background:#a78bfa;border-radius:50%;margin:0 3px;"></span>
                <span style="display:inline-block;width:6px;height:6px;background:#38bdf8;border-radius:50%;margin:0 3px;"></span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Reusable greeting block
 */
const greeting = (name) => `
  <p style="margin:0 0 20px;font-size:16px;color:#94a3b8;">
    Hello, <strong style="color:#e2e8f0;">${name}</strong> 👋
  </p>
`;

/**
 * Reusable CTA button
 */
const ctaButton = (href, label, color = "#6c63ff") => `
  <div style="text-align:center;margin:32px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${color},#a78bfa);color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:50px;font-weight:700;font-size:15px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(108,99,255,0.4);">${label} &rarr;</a>
  </div>
`;

/**
 * Reusable divider
 */
const divider = () => `<hr style="border:none;border-top:1px solid #2a2a3e;margin:28px 0;" />`;

/**
 * Send Welcome Email on Registration
 */
export const sendWelcomeEmail = async (user) => {
  const subject = "🎉 Welcome to Online Voting System!";
  const message = `Hello ${user.name},\n\nWelcome to the Online Voting System. Your account has been successfully created.\n\nBest regards,\nThe OVS Team`;

  const content = `
    ${greeting(user.name)}
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#ffffff;">Welcome aboard! 🎉</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.7;">
      Your account on the <strong style="color:#a78bfa;">Online Voting System</strong> has been <strong style="color:#4ade80;">successfully created</strong>. You're now part of a secure, transparent digital democracy platform.
    </p>

    <!-- Feature Highlights -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="33%" style="padding:16px;background:#16213e;border-radius:12px;text-align:center;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">🔒</div>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">Secure</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">End-to-end encrypted</p>
        </td>
        <td width="4%" style="font-size:1px;">&nbsp;</td>
        <td width="33%" style="padding:16px;background:#16213e;border-radius:12px;text-align:center;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">🗳️</div>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">Vote Easily</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">From anywhere</p>
        </td>
        <td width="4%" style="font-size:1px;">&nbsp;</td>
        <td width="33%" style="padding:16px;background:#16213e;border-radius:12px;text-align:center;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">📊</div>
          <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">Live Results</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Real-time updates</p>
        </td>
      </tr>
    </table>

    ${ctaButton(`${config.frontendUrl}/login`, "Login to Your Account")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">If you didn't create this account, please ignore this email or contact us immediately.</p>
  `;

  const html = baseTemplate(content, "#6c63ff");

  return await sendEmail({ email: user.email, subject, message, html });
};

/**
 * Send Verification Email on Registration
 */
export const sendVerificationEmail = async (user, token) => {
  const verificationLink = `${config.frontendUrl}/verify-email?token=${token}`;
  const subject = "✅ Verify Your Account - Online Voting System";
  const message = `Hello ${user.name},\n\nPlease verify your account: ${verificationLink}\n\nBest regards,\nThe OVS Team`;

  const content = `
    ${greeting(user.name)}
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#ffffff;">Confirm Your Email ✅</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.7;">
      Thank you for registering with the <strong style="color:#a78bfa;">Online Voting System</strong>. To maintain the integrity of our elections, we need to verify your email address.
    </p>

    <!-- Security Badge -->
    <div style="background:linear-gradient(135deg,#0f3460,#16213e);border:1px solid #38bdf8;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🛡️</div>
      <p style="margin:0;font-size:14px;color:#38bdf8;font-weight:700;">Email Verification Required</p>
      <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">This link expires in <strong style="color:#fbbf24;">24 hours</strong></p>
    </div>

    ${ctaButton(verificationLink, "Verify My Email Address", "#10b981")}
    ${divider()}
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="margin:0;font-size:12px;color:#38bdf8;word-break:break-all;background:#0f0f1a;padding:10px 14px;border-radius:8px;border:1px solid #1e293b;">${verificationLink}</p>
  `;

  const html = baseTemplate(content, "#10b981");

  return await sendEmail({ email: user.email, subject, message, html });
};

/**
 * Send OTP Email for Voting
 */
export const sendOTPEmail = async (user, otpCode) => {
  const subject = "🔐 Your Voting OTP Code";
  const message = `Your OTP for voting verification is: ${otpCode}. This code is valid for 5 minutes.`;

  // Split OTP digits for individual boxes
  const otpDigits = String(otpCode).split("");
  const digitBoxes = otpDigits
    .map(
      (d) =>
        `<span style="display:inline-block;width:44px;height:54px;line-height:54px;background:#0f0f1a;border:2px solid #6c63ff;border-radius:10px;font-size:26px;font-weight:800;color:#a78bfa;text-align:center;margin:0 4px;font-family:'Courier New',monospace;">${d}</span>`
    )
    .join("");

  const content = `
    ${greeting(user.name)}
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#ffffff;">Your One-Time Passcode 🔐</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.7;">
      You requested a verification code to cast your vote. Use the code below to complete your identity verification:
    </p>

    <!-- OTP Box -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #6c63ff;border-radius:16px;padding:32px 24px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 16px;font-size:12px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Your OTP Code</p>
      <div style="margin-bottom:16px;">${digitBoxes}</div>
      <p style="margin:0;font-size:13px;color:#fbbf24;font-weight:600;">⏱ Valid for <strong>5 minutes</strong> only</p>
    </div>

    <!-- Warning -->
    <div style="background:#1c1407;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#fcd34d;line-height:1.6;">
        ⚠️ <strong>Never share this code</strong> with anyone. Our team will never ask for your OTP. If you didn't request this, please disregard this email.
      </p>
    </div>

    ${divider()}
    <p style="margin:0;font-size:13px;color:#64748b;">This OTP was requested for your account associated with this email. It will expire automatically.</p>
  `;

  const html = baseTemplate(content, "#f59e0b");

  return await sendEmail({ email: user.email, subject, message, html });
};

/**
 * Send Vote Confirmation Email
 */
export const sendVoteConfirmationEmail = async (user, electionName) => {
  const subject = "🗳️ Vote Cast Successfully!";
  const message = `Hello ${user.name},\n\nYour vote for "${electionName}" has been successfully cast and recorded.\n\nThank you for participating!`;

  const content = `
    ${greeting(user.name)}
    <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#ffffff;">Your Vote is Counted! 🗳️</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.7;">
      We're pleased to confirm that your vote for the following election has been <strong style="color:#4ade80;">securely recorded</strong> in our system.
    </p>

    <!-- Election Badge -->
    <div style="background:linear-gradient(135deg,#052e16,#064e3b);border:1px solid #4ade80;border-radius:16px;padding:24px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:12px;color:#86efac;letter-spacing:2px;text-transform:uppercase;">Election</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#ffffff;">"${electionName}"</p>
      <div style="display:inline-block;background:#4ade80;color:#052e16;padding:8px 24px;border-radius:50px;font-weight:800;font-size:14px;letter-spacing:0.5px;">✔ VOTE RECORDED</div>
    </div>

    <!-- Stats Row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td width="48%" style="padding:16px;background:#16213e;border-radius:12px;text-align:center;">
          <div style="font-size:22px;margin-bottom:6px;">🔐</div>
          <p style="margin:0;font-size:13px;font-weight:700;color:#e2e8f0;">Encrypted</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Blockchain secured</p>
        </td>
        <td width="4%" style="font-size:1px;">&nbsp;</td>
        <td width="48%" style="padding:16px;background:#16213e;border-radius:12px;text-align:center;">
          <div style="font-size:22px;margin-bottom:6px;">📋</div>
          <p style="margin:0;font-size:13px;font-weight:700;color:#e2e8f0;">Auditable</p>
          <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Verifiable by you</p>
        </td>
      </tr>
    </table>

    <!-- Inspirational Quote -->
    <div style="background:#1a1a2e;border-left:4px solid #a78bfa;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#cbd5e1;font-style:italic;line-height:1.6;">
        "The vote is the most powerful nonviolent tool we have in a democratic society." — John Lewis
      </p>
    </div>

    ${divider()}
    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
      Thank you for exercising your democratic right. Your participation makes our democracy stronger. 🌟
    </p>
  `;

  const html = baseTemplate(content, "#4ade80");

  return await sendEmail({ email: user.email, subject, message, html });
};
