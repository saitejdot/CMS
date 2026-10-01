/**
 * Send a welcome email to all subscribers.
 * Usage: node scripts/send-welcome.mjs
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
  const col = db.collection("subscribers");
  const subscribers = await col.find().toArray();

  if (subscribers.length === 0) {
    console.log("⚠️  No subscribers found.");
    process.exit(0);
  }

  console.log(`Found ${subscribers.length} subscribers. Sending emails...`);

  let sent = 0;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://saitejdot.vercel.app";

  for (const sub of subscribers) {
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${generateUnsubscribeToken(sub.email)}`;
    
    // We use the new template style
    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">Hey, ${sub.name || 'there'}.</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">Welcome to my inner circle.</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">This is just a quick test to make sure you're receiving my emails correctly. From now on, whenever I publish a new piece of writing, you'll be the first to know.</p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">I appreciate you sticking around.</p>
            
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
    `;

    try {
      await transporter.sendMail({
        from: `"Naga Sai Teja" <${EMAIL_USER}>`,
        to: sub.email,
        subject: "Welcome to my inner circle.",
        html: emailHtml,
      });
      console.log(`  ✅ Sent to: ${sub.name} <${sub.email}>`);
      sent++;
    } catch (err) {
      console.error(`  ❌ Failed for ${sub.email}: `, err.message);
    }
  }

  await client.close();
  console.log(`\n🎉 Done! Sent ${sent} welcome emails.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
