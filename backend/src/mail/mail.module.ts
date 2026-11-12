import { Injectable, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/smtp-transport";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter<Transporter.SentMessageInfo> | null =
    null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST");
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>("SMTP_PORT", 587),
        secure: this.config.get<number>("SMTP_PORT", 587) === 465,
        auth: this.config.get<string>("SMTP_USER")
          ? {
              user: this.config.get<string>("SMTP_USER"),
              pass: this.config.get<string>("SMTP_PASS"),
            }
          : undefined,
      });
    }
  }

  async send(options: MailOptions): Promise<void> {
    const from = this.config.get<string>("SMTP_FROM") || "Shop <no-reply@shop.local>";
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — skipping email to ${options.to}: ${options.subject}`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({ from, ...options });
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
    }
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <h2>Hi ${escapeHtml(name)},</h2>
          <p>We received a request to reset your password. This link expires in 30 minutes.</p>
          <p><a href="${resetUrl}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Reset password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
