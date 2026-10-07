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
      const colonIdx = payload.indexOf(":");
      if (colonIdx === -1) return null;
      
      const email = payload.slice(0, colonIdx);
      const signature = payload.slice(colonIdx + 1);
      
      if (!email || !signature) return null;

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(email);
      const expectedSignature = hmac.digest("hex");

      // timingSafeEqual throws if buffers are different lengths
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSignature);
      if (sigBuf.length !== expBuf.length) return null;

      // Use constant-time comparison to prevent timing attacks
      if (crypto.timingSafeEqual(sigBuf, expBuf)) {
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
import { connectDB } from "@/lib/db";

export async function notifySubscribers(blogId: string, title: string, slug: string, category: string, reqId: string) {
  console.log(`[${reqId}] Starting async subscriber notification for story ${blogId}`);
  try {
    await connectDB();
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
    
    const subscribers = await Subscriber.find().select("email name").lean();
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

    await Promise.allSettled(subscribers.map(async (sub) => {
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${emailService.generateUnsubscribeToken(sub.email)}`;
      const emailHtml = `
        <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #111214; padding: 40px 20px; color: #17181B; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #F9F9F7; border-radius: 8px; overflow: hidden;">
            
            <!-- TOP HEADER -->
            <div style="background-color: #111214; padding: 16px 24px; border-bottom: 1px solid #222;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" align="left" valign="middle">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #3B3D42; margin-right: 6px;"></span>
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #3B3D42; margin-right: 6px;"></span>
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #3B3D42;"></span>
                  </td>
                  <td width="33%" align="center" valign="middle">
                    <span style="color: #ffffff; font-weight: bold; font-size: 14px; letter-spacing: 1px;">saitejdot</span>
                  </td>
                  <td width="33%" align="right" valign="middle">
                    <span style="color: #777A80; font-size: 12px; font-family: monospace;">01 / 01</span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- QUOTE HERO -->
            <div style="background-color: #111214; padding: 60px 40px; text-align: center; position: relative;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="width: 40px; height: 1px; background-color: #FFD600; margin: 0 auto;"></div>
                  </td>
                </tr>
              </table>
              
              <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.5; color: #F9F9F7; margin: 0; font-style: italic;">
                "Too many flaws to be perfect.<br>
                Too many blessings to be ungrateful."
              </p>
              
              <p style="font-size: 14px; color: #777A80; margin: 20px 0 0 0; letter-spacing: 1px;">
                — saitejdot
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #FFD600; margin: 0 auto;"></div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- CONTENT BODY -->
            <div style="padding: 50px 40px;">
              
              <!-- PERSONALIZED GREETING -->
              <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #17181B; font-weight: 800;">
                hey, ${sub.name ? sub.name : 'there'}.
              </h1>
              <div style="width: 40px; height: 3px; background-color: #FFD600; margin-bottom: 30px;"></div>
              
              <!-- WELCOME MESSAGE -->
              <p style="font-size: 16px; line-height: 1.6; color: #3B3D42; margin: 0 0 20px 0;">
                How’s it going?
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #3B3D42; margin: 0 0 40px 0;">
                I wrote a new blog, and since you decided to leave your email with me, this little thing landed directly in your inbox.
              </p>
              
              <!-- BLOG SECTION -->
              <div style="background-color: #ffffff; border-left: 4px solid #FFD600; padding: 30px; margin-bottom: 40px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                <p style="font-size: 12px; font-weight: bold; letter-spacing: 1.5px; color: #777A80; margin: 0 0 10px 0;">
                  NEW ON THE BLOG
                </p>
                <h2 style="font-size: 22px; line-height: 1.4; color: #17181B; margin: 0 0 10px 0;">
                  ${title}
                </h2>
                <p style="font-size: 14px; color: #777A80; font-style: italic; margin: 0;">
                  a new story by Tej
                </p>
              </div>
              
              <!-- READ STORY CTA -->
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${blogUrl}" style="display: inline-block; background-color: #FFD600; color: #17181B; padding: 16px 36px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none; letter-spacing: 0.5px;">
                  READ THE STORY &rarr;
                </a>
              </div>
              
              <!-- WEBSITE CTA -->
              <p style="text-align: center; font-size: 14px; color: #777A80; margin: 0 0 15px 0;">
                Want to see what else I’m building?
              </p>
              
              <div style="text-align: center; margin-bottom: 50px;">
                <a href="${baseUrl}" style="display: inline-block; background-color: #111214; color: #F9F9F7; padding: 14px 32px; border-radius: 6px; font-size: 13px; font-weight: bold; text-decoration: none; letter-spacing: 0.5px;">
                  VISIT SAITEJDOT &#8599;
                </a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #E5E5E0; margin: 0 0 40px 0;">
              
              <!-- CARE SECTION -->
              <h3 style="margin: 0 0 5px 0; font-size: 16px; letter-spacing: 1.5px; color: #17181B; text-transform: uppercase;">
                AND BEFORE YOU GO...
              </h3>
              <div style="width: 30px; height: 2px; background-color: #FFD600; margin-bottom: 25px;"></div>
              
              <p style="font-size: 15px; color: #3B3D42; margin: 0 0 25px 0;">
                A few care tips for you:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px;">
                <tr>
                  <td width="30" valign="top" style="font-family: monospace; font-size: 14px; color: #777A80; padding-bottom: 12px;">01 &mdash;</td>
                  <td valign="top" style="font-size: 15px; color: #3B3D42; padding-bottom: 12px; line-height: 1.5;">Drink <strong>6 glasses of water</strong> every day.</td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="font-family: monospace; font-size: 14px; color: #777A80; padding-bottom: 12px;">02 &mdash;</td>
                  <td valign="top" style="font-size: 15px; color: #3B3D42; padding-bottom: 12px; line-height: 1.5;">Don’t forget to <strong>work out</strong>.</td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="font-family: monospace; font-size: 14px; color: #777A80; padding-bottom: 12px;">03 &mdash;</td>
                  <td valign="top" style="font-size: 15px; color: #3B3D42; padding-bottom: 12px; line-height: 1.5;">Take a few minutes for <strong>meditation or silence</strong>.</td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="font-family: monospace; font-size: 14px; color: #777A80; padding-bottom: 12px;">04 &mdash;</td>
                  <td valign="top" style="font-size: 15px; color: #3B3D42; padding-bottom: 12px; line-height: 1.5;">Get <strong>7–8 hours of sleep</strong> — non-negotiable.</td>
                </tr>
                <tr>
                  <td width="30" valign="top" style="font-family: monospace; font-size: 14px; color: #777A80; padding-bottom: 12px;">05 &mdash;</td>
                  <td valign="top" style="font-size: 15px; color: #3B3D42; padding-bottom: 12px; line-height: 1.5;">For God’s sake, <strong>wear sunscreen</strong>.</td>
                </tr>
              </table>
              
              <!-- HIGHLIGHTED PRINCIPLE -->
              <div style="background-color: #111214; padding: 30px; border-radius: 8px; margin-bottom: 50px;">
                <p style="font-size: 12px; font-weight: bold; letter-spacing: 2px; color: #FFD600; margin: 0 0 15px 0;">
                  MOST IMPORTANTLY.
                </p>
                <p style="font-size: 18px; line-height: 1.5; color: #F9F9F7; margin: 0 0 5px 0;">
                  Know what matters in your life.
                </p>
                <p style="font-size: 18px; line-height: 1.5; color: #F9F9F7; margin: 0;">
                  Then prioritize it.
                </p>
              </div>
              
              <!-- PERSONAL CLOSING -->
              <p style="font-size: 15px; line-height: 1.6; color: #3B3D42; margin: 0 0 10px 0;">
                Take care of yourself.
              </p>
              
              <p style="font-size: 15px; line-height: 1.6; color: #3B3D42; margin: 0 0 30px 0;">
                And take care of the people you love.
              </p>
              
              <p style="font-size: 14px; color: #777A80; font-style: italic; margin: 0;">
                — Naga Sai Teja (saitejdot)
              </p>
              
            </div>
            
            <!-- UNSUBSCRIBE FOOTER -->
            <div style="background-color: #EAEAE5; padding: 40px; text-align: center;">
              <p style="font-size: 13px; color: #777A80; margin: 0 0 10px 0;">
                Never want me to disturb you again?
              </p>
              <a href="${unsubscribeUrl}" style="display: inline-block; color: #17181B; font-weight: bold; font-size: 12px; text-decoration: none; letter-spacing: 1px; border-bottom: 1px solid #17181B; padding-bottom: 2px; margin-bottom: 15px;">
                UNSUBSCRIBE &rarr;
              </a>
              <p style="font-size: 13px; color: #777A80; margin: 0;">
                No hard feelings.
              </p>
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
    }));
    
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