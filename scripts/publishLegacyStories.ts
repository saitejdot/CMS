import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import Story from "../src/models/Story";
import { connectDB } from "../src/lib/db";

async function run() {
  await connectDB();
  console.log("Updating legacy stories without a status to PUBLISHED...");

  const result = await Story.updateMany(
    { status: { $exists: false } },
    { $set: { status: "PUBLISHED" } }
  );

  console.log(`Matched ${result.matchedCount} stories, modified ${result.modifiedCount} stories.`);
  mongoose.disconnect();
}

run().catch(console.error);
