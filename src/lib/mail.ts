import nodemailer from "nodemailer";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// Providers
// -----------------------------------------------------------------------------

export interface EmailProvider {
  send(options: { to: string; subject: string; text?: string; html?: string }): Promise<any>;
}

class GmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async send(options: { to: string; subject: string; text?: string; html?: string }) {
    const from = `"Naga Sai Teja" <${process.env.GMAIL_USER}>`;
    return this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}

// -----------------------------------------------------------------------------
// Service Abstraction
// -----------------------------------------------------------------------------

class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async sendTransactional(to: string, subject: string, text: string, html?: string) {
    return this.provider.send({ to, subject, text, html });
  }

  /**
   * Generates a stable idempotency key for a logical notification.
   */
  generateIdempotencyKey(storyId: string, publicationVersion: number, notificationType: string): string {
    return `story-publication-notification:${storyId}:${publicationVersion}:${notificationType}`;
  }

  /**
   * Generates a secure HMAC signed token for unsubscribing.
   */
  generateUnsubscribeToken(email: string): string {
    const secret = process.env.UNSUBSCRIBE_SECRET;
    if (!secret) throw new Error("UNSUBSCRIBE_SECRET is not set");
    
    // We sign the email itself
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(email);
    const signature = hmac.digest("hex");
    
    // The token is base64(email:signature)
    const payload = `${email}:${signature}`;
    return Buffer.from(payload).toString("base64url");
  }

  /**
   * Verifies an unsubscribe token and returns the email if valid.
   */
  verifyUnsubscribeToken(token: string): string | null {
    try {
      const secret = process.env.UNSUBSCRIBE_SECRET;
      if (!secret) return null;

      const payload = Buffer.from(token, "base64url").toString("utf-8");
      const [email, signature] = payload.split(":");
      
      if (!email || !signature) return null;

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(email);
      const expectedSignature = hmac.digest("hex");

      // Use constant-time comparison to prevent timing attacks
      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return email;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

// Initialize the service with our chosen provider
const gmailProvider = new GmailProvider();
export const emailService = new EmailService(gmailProvider);

// Temporary backward compatibility
export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  return emailService.sendTransactional(to, subject, text, html);
}

// -----------------------------------------------------------------------------
// Subscriber Notification Logic
// -----------------------------------------------------------------------------

import Subscriber from "@/models/Subscriber";
import EmailLog from "@/models/EmailLog";

export async function notifySubscribers(blogId: string, title: string, slug: string, category: string, reqId: string) {
  console.log(`[${reqId}] Starting async subscriber notification for story ${blogId}`);
  try {
    const publicationVersion = 1; // Simplify for now since we don't track versions yet
    const notificationType = "publish";
    const idempotencyKey = emailService.generateIdempotencyKey(blogId, publicationVersion, notificationType);
    
    // Check for idempotency
    const existingLog = await EmailLog.findOne({ idempotencyKey });
    if (existingLog && existingLog.status === "SENT") {
      console.log(`[${reqId}] Notification already sent (idempotency key match).`);
      return;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tejwrites.vercel.app";
    const blogUrl = `${baseUrl}/story/${slug}`;
    
    const subscribers = await Subscriber.find().select("email").lean();
    let sentCount = 0;
    
    // We log PENDING state
    let emailLog = existingLog || new EmailLog({
      storyId: blogId,
      idempotencyKey,
      recipientCount: subscribers.length,
      status: "PENDING",
      requestId: reqId
    });
    await emailLog.save();

    for (const sub of subscribers) {
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${emailService.generateUnsubscribeToken(sub.email)}`;
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <div style="background-color: #fcde7b; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #383c45; letter-spacing: 1px;">Naga Sai Teja</h1>
              <p style="margin: 5px 0 0; font-size: 14px; color: #383c45; opacity: 0.8;">New Story Post Published</p>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px; font-size: 28px; color: #111; line-height: 1.3;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 30px;">
                Hey! I've just published a new article in the <strong>${category}</strong> category.
              </p>
              <a href="${blogUrl}" style="display: inline-block; background-color: #ffa200; color: #ffffff; padding: 15px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none;">
                Read the Full Story
              </a>
            </div>
            <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; font-size: 14px; color: #999;">
                You received this because you're subscribed to Naga Sai Teja's Story.
              </p>
              <p style="margin: 15px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #ffa200; text-decoration: underline; font-size: 13px;">Unsubscribe</a>
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #bbb;">
            &copy; ${new Date().getFullYear()} Naga Sai Teja. All rights reserved.
          </div>
        </div>
      `;
      try {
        await emailService.sendTransactional(
          sub.email,
          `New Post: ${title}`,
          `Hey! A new story is live: ${title}. Read it here: ${blogUrl}`,
          emailHtml
        );
        sentCount++;
      } catch (err) {
        console.error(`[${reqId}] Failed to send to ${sub.email}`);
      }
    }
    
    // Update log
    emailLog.status = "SENT";
    emailLog.recipientCount = sentCount; // Actual sent
    await emailLog.save();
    console.log(`[${reqId}] Notification sent successfully to ${sentCount} subscribers.`);
  } catch (error) {
    console.error(`[${reqId}] Notification process failed:`, error);
    try {
      const idempotencyKey = emailService.generateIdempotencyKey(blogId, 1, "publish");
      await EmailLog.updateOne(
        { idempotencyKey },
        { status: "FAILED", error: (error as Error).message }
      );
    } catch (e) {
      console.error(`[${reqId}] Could not update EmailLog on failure:`, e);
    }
  }
}