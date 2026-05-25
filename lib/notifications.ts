// lib/notifications.ts

import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function emailWrapper(title: string, body: string): string {
  const logoUrl = `${process.env.NEXTAUTH_URL}/GetMoneyPlanner.png`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
        <img
          src="${logoUrl}"
          alt="GetMoneyPlanner"
          width="52"
          height="52"
          style="border-radius:12px;display:block;margin:0 auto 10px;"
          onerror="this.style.display='none'"
        />
      <p style="margin:0 0 12px;color:#ddd6fe;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">GetMoneyPlanner</p>
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${title}</h1>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.7;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      You received this because you have notifications enabled in GetMoneyPlanner.<br>
      <a href="${process.env.NEXTAUTH_URL}/profile" style="color:#7c3aed;text-decoration:none;">Manage preferences</a>
    </div>
  </div>
</body>
</html>`;
}

export type NotifType =
  | "transactionAlert"
  | "budgetAlert"
  | "goalAlert"
  | "weeklyReport"
  | "monthlyReport"
  | "unusualActivity";

interface NotifPayload {
  ownerEmail: string;
  type: NotifType;
  subject: string;
  title: string;
  bodyHtml: string;
}

export async function sendNotification(payload: NotifPayload): Promise<void> {
  try {
    await connectDB();

    const user = await User.findOne({ email: payload.ownerEmail })
      .select("name notifications")
      .lean();

    if (!user) return;

    const prefs = (user as any).notifications || {};

    const prefKey: Record<NotifType, string> = {
      transactionAlert: "transactionAlerts",
      budgetAlert: "budgetAlerts",
      goalAlert: "goalAlerts",
      weeklyReport: "weeklyReport",
      monthlyReport: "monthlyReport",
      unusualActivity: "unusualActivity",
    };

    const prefField = prefKey[payload.type];
    if (!prefs[prefField]) return;

    if (!prefs.emailAlerts) return;

    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"GetMoneyPlanner" <${process.env.SMTP_USER}>`,
      to: payload.ownerEmail,
      subject: payload.subject,
      html: emailWrapper(payload.title, payload.bodyHtml),
    });

    console.log(`[Notification] Sent ${payload.type} to ${payload.ownerEmail}`);
  } catch (error) {
    console.error("[Notification] Failed to send email:", error);
  }
}

export async function notifyTransactionAdded(
  ownerEmail: string,
  data: { type: "income" | "expense"; amount: number; category: string; currency: string; note?: string }
) {
  const sym = getCurrencySymbol(data.currency);
  const typeLabel = data.type === "income" ? "💰 Income" : "💸 Expense";

  await sendNotification({
    ownerEmail,
    type: "transactionAlert",
    subject: `New ${data.type} recorded — ${sym}${data.amount.toLocaleString()}`,
    title: "Transaction Added",
    bodyHtml: `
      <p>Hi there! A new transaction has been recorded in your account.</p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid ${data.type === "income" ? "#10b981" : "#ef4444"};">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:600;">${typeLabel}</p>
        <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:${data.type === "income" ? "#059669" : "#dc2626"};">${sym}${data.amount.toLocaleString()}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#374151;">Category: <strong>${data.category}</strong></p>
        ${data.note ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Note: ${data.note}</p>` : ""}
      </div>
      <p style="color:#6b7280;font-size:13px;">Log in to <a href="${process.env.NEXTAUTH_URL}/transactions" style="color:#7c3aed;">view all transactions</a>.</p>
    `,
  });
}

export async function notifyBudgetAlert(
  ownerEmail: string,
  data: { spent: number; budget: number; currency: string; percentage: number }
) {
  const sym = getCurrencySymbol(data.currency);
  const isOver = data.spent > data.budget;

  await sendNotification({
    ownerEmail,
    type: "budgetAlert",
    subject: isOver ? "⚠️ Budget Exceeded!" : `⚠️ Budget Alert: ${data.percentage}% used`,
    title: isOver ? "Monthly Budget Exceeded" : "Approaching Budget Limit",
    bodyHtml: `
      <p>${isOver ? "You have exceeded your monthly budget." : `You have used <strong>${data.percentage}%</strong> of your monthly budget.`}</p>
      <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #ef4444;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:13px;color:#6b7280;">Spent</span>
          <span style="font-weight:700;color:#dc2626;">${sym}${data.spent.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:13px;color:#6b7280;">Budget Limit</span>
          <span style="font-weight:600;color:#374151;">${sym}${data.budget.toLocaleString()}</span>
        </div>
        <div style="background:#fee2e2;border-radius:6px;height:8px;margin-top:12px;overflow:hidden;">
          <div style="background:#ef4444;height:100%;width:${Math.min(100, data.percentage)}%;border-radius:6px;"></div>
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;">Review your spending in <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#7c3aed;">Dashboard</a>.</p>
    `,
  });
}

export async function notifyGoalCompleted(
  ownerEmail: string,
  data: { title: string; targetAmount: number; currency: string; icon: string }
) {
  const sym = getCurrencySymbol(data.currency);

  await sendNotification({
    ownerEmail,
    type: "goalAlert",
    subject: `🎉 Goal Achieved: ${data.title}`,
    title: "Financial Goal Completed!",
    bodyHtml: `
      <p>Congratulations! You have successfully achieved your financial goal.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:16px 0;text-align:center;border:1px solid #bbf7d0;">
        <p style="font-size:40px;margin:0 0 8px;">${data.icon || "🏆"}</p>
        <p style="font-size:18px;font-weight:700;color:#065f46;margin:0 0 4px;">${data.title}</p>
        <p style="font-size:22px;font-weight:700;color:#059669;margin:0;">${sym}${data.targetAmount.toLocaleString()}</p>
        <p style="font-size:13px;color:#6b7280;margin:8px 0 0;">Goal completed! 🎊</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">Set new goals in <a href="${process.env.NEXTAUTH_URL}/goals" style="color:#7c3aed;">Financial Goals</a>.</p>
    `,
  });
}

export async function notifyGoalMilestone(
  ownerEmail: string,
  data: { title: string; percent: number; currentAmount: number; currency: string }
) {
  const sym = getCurrencySymbol(data.currency);

  await sendNotification({
    ownerEmail,
    type: "goalAlert",
    subject: `📈 Goal Milestone: ${data.title} is ${data.percent}% complete`,
    title: "Goal Milestone Reached",
    bodyHtml: `
      <p>Great progress! Your goal <strong>${data.title}</strong> has reached <strong>${data.percent}%</strong>.</p>
      <div style="background:#f5f3ff;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #7c3aed;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#4c1d95;">${data.title}</p>
        <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#7c3aed;">${data.percent}% complete</p>
        <div style="background:#ddd6fe;border-radius:6px;height:8px;overflow:hidden;">
          <div style="background:#7c3aed;height:100%;width:${data.percent}%;border-radius:6px;"></div>
        </div>
        <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Saved so far: ${sym}${data.currentAmount.toLocaleString()}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">Keep it up! View your goals at <a href="${process.env.NEXTAUTH_URL}/goals" style="color:#7c3aed;">Goals page</a>.</p>
    `,
  });
}

export async function notifyUnusualActivity(
  ownerEmail: string,
  data: { description: string; ip?: string; time: string }
) {
  await sendNotification({
    ownerEmail,
    type: "unusualActivity",
    subject: "⚠️ Unusual Activity Detected",
    title: "Security Alert",
    bodyHtml: `
      <p>We detected unusual activity on your GetMoneyPlanner account.</p>
      <div style="background:#fff7ed;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #f59e0b;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">Activity Details</p>
        <p style="margin:0 0 4px;font-size:13px;color:#374151;">${data.description}</p>
        <p style="margin:4px 0;font-size:12px;color:#6b7280;">Time: ${data.time}</p>
        ${data.ip ? `<p style="margin:4px 0;font-size:12px;color:#6b7280;">IP: ${data.ip}</p>` : ""}
      </div>
      <p>If this was you, no action needed. If not, <a href="${process.env.NEXTAUTH_URL}/profile?tab=security" style="color:#7c3aed;">change your password immediately</a>.</p>
    `,
  });
}

function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", BDT: "৳",
    INR: "₹", JPY: "¥", CAD: "$", AUD: "$",
    SGD: "$", AED: "د.إ",
  };
  return map[code] || "$";
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const transporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#22c55e,#10b981);padding:32px 40px;text-align:center;">
            <img
              src="${process.env.NEXTAUTH_URL}/GetMoneyPlanner.png"
              alt="GetMoneyPlanner"
              width="48"
              height="48"
              style="border-radius:10px;display:block;margin:0 auto 12px;"
              onerror="this.style.display='none'"
            />
              <p style="margin:0;color:white;font-size:22px;font-weight:900;letter-spacing:-0.5px;">GetMoneyPlanner</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your financial command center</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;">Reset your password</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Hi ${name}, we received a request to reset your GetMoneyPlanner password. Click the button below to create a new one.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:#22c55e;color:#000000;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 4px 12px rgba(34,197,94,0.3);">
                      Reset My Password →
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;">
                    <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                      ⏱ This link expires in <strong>1 hour</strong>.<br/>
                      If you didn't request a password reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${resetUrl}" style="color:#22c55e;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} GetMoneyPlanner. All rights reserved.<br/>
                This email was sent to ${to}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"GetMoneyPlanner" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your GetMoneyPlanner password",
    html,
    text: `Hi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
  });
}

export async function notifyContactConfirmation(
  to: string,
  data: { name: string; subject: string; category: string; message: string }
): Promise<void> {
  const transporter = getTransporter();

  const categoryLabels: Record<string, string> = {
    general: "General Enquiry",
    bug: "Bug Report",
    feature: "Feature Request",
    billing: "Billing",
    privacy: "Privacy",
    account: "Account",
    other: "Other",
  };

  const html = emailWrapper(
    "We received your message",
    `
    <p>Hi <strong>${data.name}</strong>,</p>
    <p>Thank you for reaching out! We've received your message and will get back to you within <strong>2 business days</strong>.</p>
    <div style="background:#f5f3ff;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #7c3aed;">
      <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Your Message Summary</p>
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">
        Category: <strong style="color:#374151;">${categoryLabels[data.category] || "General"}</strong>
      </p>
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#1f2937;">${data.subject}</p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        ${data.message.slice(0, 300)}${data.message.length > 300 ? "…" : ""}
      </p>
    </div>
    <p style="color:#6b7280;font-size:13px;">
      If you didn't send this message or have an urgent issue, 
      <a href="${process.env.NEXTAUTH_URL}/contact" style="color:#7c3aed;">contact us again</a>.
    </p>
    `
  );

  await transporter.sendMail({
    from: `"GetMoneyPlanner" <${process.env.SMTP_USER}>`,
    to,
    subject: `We received your message — GetMoneyPlanner`,
    html,
  });
}

export async function notifyContactAdmin(data: {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  ip: string;
  isLoggedIn: boolean;
  userName?: string | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const transporter = getTransporter();

  const categoryColors: Record<string, string> = {
    bug: "#ef4444",
    feature: "#f59e0b",
    billing: "#10b981",
    privacy: "#3b82f6",
    account: "#6366f1",
    general: "#8b5cf6",
    other: "#6b7280",
  };
  const accent = categoryColors[data.category] || "#8b5cf6";

  const html = emailWrapper(
    `[Contact] ${data.category.toUpperCase()}: ${data.subject}`,
    `
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:0 0 16px;border-left:4px solid ${accent};">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:5px 0;color:#6b7280;width:90px;">Name</td>
          <td style="padding:5px 0;color:#111827;font-weight:600;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Email</td>
          <td style="padding:5px 0;">
            <a href="mailto:${data.email}" style="color:#7c3aed;">${data.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Category</td>
          <td style="padding:5px 0;color:#111827;">
            <span style="background:${accent}18;color:${accent};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;">
              ${data.category}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">Subject</td>
          <td style="padding:5px 0;color:#111827;font-weight:600;">${data.subject}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">IP</td>
          <td style="padding:5px 0;color:#6b7280;font-size:12px;">${data.ip}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#6b7280;">User</td>
          <td style="padding:5px 0;font-size:12px;">
            ${data.isLoggedIn && data.userName
      ? `<span style="color:#10b981;font-weight:600;">${data.userName}</span>
            <span style="color:#6b7280;"> (logged in)</span>`
      : `<span style="color:#6b7280;">Guest</span>`}
          </td>
        </tr>
      </table>
    </div>
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Message</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${data.message}</p>
    </div>
    <div style="margin-top:16px;text-align:center;">
      <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}"
        style="display:inline-block;padding:10px 24px;background:#7c3aed;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:10px;">
        Reply to ${data.name}
      </a>
    </div>
    `
  );

  await transporter.sendMail({
    from: `"GetMoneyPlanner Contact" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    replyTo: data.email,
    subject: `[Contact] ${data.category}: ${data.subject}`,
    html,
  });
}