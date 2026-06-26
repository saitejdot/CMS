import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

// Dependencies for email notifications
import Subscriber from "@/models/Subscriber";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { title, content, category, tags, coverImage } = body;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newBlog = await Blog.create({
      title,
      slug,
      content,
      category,
      tags,
      coverImage,
    });

    // Email notification system
    try {
      const subscribers = await Subscriber.find();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tejwrites.vercel.app";
      const blogUrl = `${baseUrl}/blog/${slug}`;

      for (const sub of subscribers) {
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`;

        const emailHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              
              <!-- Header -->
              <div style="background-color: #fcde7b; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: #383c45; letter-spacing: 1px;">Naga Sai Teja</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #383c45; opacity: 0.8;">New Blog Post Published</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px; text-align: center;">
                <h2 style="margin: 0 0 20px; font-size: 28px; color: #111; line-height: 1.3;">${title}</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 30px;">
                  Hey! I've just published a new article in the <strong>${category}</strong> category. I thought you might find it interesting.
                </p>
                
                <a href="${blogUrl}" style="display: inline-block; background-color: #ffa200; color: #ffffff; padding: 15px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none; transition: background-color 0.3s ease;">
                  Read the Full Story
                </a>
              </div>

              <!-- Footer -->
              <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; font-size: 14px; color: #999;">
                  You received this because you're subscribed to Naga Sai Teja's Blog.
                </p>
                <p style="margin: 15px 0 0;">
                  <a href="${unsubscribeUrl}" style="color: #ffa200; text-decoration: underline; font-size: 13px;">
                    Unsubscribe
                  </a>
                </p>
              </div>

            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #bbb;">
              &copy; ${new Date().getFullYear()} Naga Sai Teja. All rights reserved.
            </div>
          </div>
        `;

        await sendEmail(
          sub.email,
          `New Post: ${title}`,
          `Hey! A new blog is live: ${title}. Read it here: ${blogUrl}`,
          emailHtml
        );
      }
    } catch (mailError) {
      console.error("Email sending failed:", mailError);
    }

    return NextResponse.json({
      success: true,
      data: newBlog,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}