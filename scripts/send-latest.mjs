/**
 * Send the new email template for a specific blog post.
 * Usage: node scripts/send-latest.mjs
 */

import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://saitejdot.vercel.app";

if (!MONGODB_URI || !EMAIL_USER || !EMAIL_PASS || !UNSUBSCRIBE_SECRET) {
  console.error("❌ Missing required environment variables in .env");
  process.exit(1);
}

function generateUnsubscribeToken(email) {
  const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
  hmac.update(email);
  const signature = hmac.digest("hex");
  const payload = `${email}:${signature}`;
  return Buffer.from(payload).toString("base64url");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db();

  // Find the post
  const story = await db.collection("blogs").findOne({ title: /Endhu koraku/i });
  if (!story) {
    console.log("❌ Could not find the blog post.");
    process.exit(1);
  }

  const title = story.title;
  const slug = story.slug;
  const blogUrl = `${baseUrl}/stories/${slug}`;

  const col = db.collection("subscribers");
  const subscribers = await col.find().toArray();

  if (subscribers.length === 0) {
    console.log("⚠️  No subscribers found.");
    process.exit(0);
  }

  console.log(`Found ${subscribers.length} subscribers. Sending emails for "${title}"...`);

  let sent = 0;

  for (const sub of subscribers) {
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${generateUnsubscribeToken(sub.email)}`;

    // Exact template we just designed
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
                  a new story by Naga Sai Teja
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
      await transporter.sendMail({
        from: `"Naga Sai Teja" <${EMAIL_USER}>`,
        to: sub.email,
        subject: `New post: ${title}`,
        html: emailHtml,
      });
      console.log(`  ✅ Sent to: ${sub.name} <${sub.email}>`);
      sent++;
    } catch (err) {
      console.error(`  ❌ Failed for ${sub.email}: `, err.message);
    }
  }

  await client.close();
  console.log(`\n🎉 Done! Sent ${sent} emails for post: "${title}".`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
