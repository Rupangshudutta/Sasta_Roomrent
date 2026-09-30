import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Best-effort email. The API must never fail a customer action because SMTP
 * is down, so every send is wrapped and only logged on error. When SMTP_HOST
 * is not configured the function is a no-op (logged once).
 */
let transporter: nodemailer.Transporter | null = null;
let warnedNotConfigured = false;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtp.host) {
    if (!warnedNotConfigured) {
      console.warn('[mail] SMTP_HOST not set — email notifications are disabled');
      warnedNotConfigured = true;
    }
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export interface MailMessage {
  to: string | string[];
  subject: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  const t = getTransporter();
  const recipients = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean);
  if (!t || recipients.length === 0) return false;
  try {
    await t.sendMail({ from: env.smtp.from, to: recipients.join(','), subject: message.subject, text: message.text });
    return true;
  } catch (err: any) {
    console.error('[mail] send failed:', err?.message || err);
    return false;
  }
}

/** Fire-and-forget wrapper so request handlers do not wait on SMTP. */
export function notify(message: MailMessage): void {
  void sendMail(message);
}
