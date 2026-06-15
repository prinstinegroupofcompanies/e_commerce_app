import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";

/**
 * @param {{ to: string, subject: string, template: string, data: Record<string, unknown> }} opts
 */
export async function sendTemplateEmail(opts) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn("[email] SMTP not configured; skipping send to", opts.to);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  const filePath = path.join(process.cwd(), "emails", opts.template);
  const source = fs.readFileSync(filePath, "utf8");
  const html = Handlebars.compile(source)({
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "Markay Hall",
    ...opts.data,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Markay Hall <noreply@localhost>",
    to: opts.to,
    subject: opts.subject,
    html,
  });

  return { sent: true };
}
