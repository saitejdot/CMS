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
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async send(options: { to: string; subject: string; text?: string; html?: string }) {
    const from = `"Naga Sai Teja" <${process.env.EMAIL_USER || process.env.GMAIL_USER}>`;
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
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://saitejdot.vercel.app";
    const blogUrl = `${baseUrl}/stories/${slug}`;
    
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
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">Hey, ${sub.name}.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">How’s it going?</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">I wrote a new blog, and since you decided to leave your email with me, this little thing landed directly in your inbox.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 10px;">The title says:</p>
              
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #111; line-height: 1.3;">“${title}”</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">If that sounds interesting, smash the button below and go straight to the story.</p>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${blogUrl}" style="display: inline-block; background-color: #ffa200; color: #ffffff; padding: 15px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none;">
                  READ THE STORY →
                </a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">Want to see what else I’ve been building, writing, or obsessing over?</p>
              
              <div style="text-align: center; margin-bottom: 40px;">
                <a href="${baseUrl}" style="display: inline-block; background-color: #383c45; color: #ffffff; padding: 15px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none;">
                  VISIT MY WEBSITE →
                </a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 40px 0;">
              
              <h3 style="margin: 0 0 20px; font-size: 20px; color: #111;">And before you go...</h3>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">A few care tips for you:</p>
              
              <ul style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Drink <strong>6 glasses of water</strong> every day.</li>
                <li style="margin-bottom: 10px;">Don’t forget to <strong>work out</strong>.</li>
                <li style="margin-bottom: 10px;">Take a few minutes for <strong>meditation, silence, or simply doing nothing</strong>.</li>
                <li style="margin-bottom: 10px;">Get <strong>7–8 hours of sleep</strong> — non-negotiable.</li>
                <li style="margin-bottom: 10px;">For God’s sake, <strong>wear sunscreen</strong>.</li>
                <li style="margin-bottom: 10px;">Most importantly, know what matters in your life and <strong>prioritize it</strong>.</li>
              </ul>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">Take care of yourself.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">And take care of the people you love.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #666; font-style: italic;">— Naga Sai Teja (saitejdot)</p>
              
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 40px 0;">
              
              <div style="text-align: center;">
                <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 10px;">Never want me to disturb you again?</p>
                <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 20px;">No hard feelings.</p>
                <a href="${unsubscribeUrl}" style="display: inline-block; color: #ffa200; font-weight: bold; text-decoration: underline; font-size: 14px; margin-bottom: 10px;">
                  UNSUBSCRIBE
                </a>
                <p style="font-size: 12px; color: #999; margin: 0;">You can leave anytime.</p>
              </div>
            </div>
          </div>
        </div>
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