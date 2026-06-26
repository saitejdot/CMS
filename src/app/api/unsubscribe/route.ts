import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    // Decode email if it was encoded (though we'll use plain for now)
    const decodedEmail = decodeURIComponent(email);

    await Subscriber.findOneAndDelete({ email: decodedEmail });

    return new NextResponse(`
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fcde7b; margin: 0; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            h1 { color: #383c45; margin-bottom: 1rem; }
            p { color: #666; line-height: 1.5; }
            .btn { display: inline-block; margin-top: 1.5rem; padding: 10px 20px; background: #ffa200; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Unsubscribed Successfully</h1>
            <p>You've been removed from our mailing list. You won't receive any more notifications from Naga Sai Teja's Blog.</p>
            <a href="/" class="btn">Back to Home</a>
          </div>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  } catch {
    return new NextResponse("Error unsubscribing", { status: 500 });
  }
}
