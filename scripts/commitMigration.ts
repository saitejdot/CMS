import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import Story from "../src/models/Story";
import { connectDB } from "../src/lib/db";

async function commitMigration() {
  console.log("Starting Phase 1B Base64 Media Migration COMMIT...");
  await connectDB();

  const verifiedStories = await Story.find({
    migrationStatus: "verified",
    migratedContent: { $exists: true, $ne: null }
  });

  console.log(`Found ${verifiedStories.length} verified stories to commit.`);

  let committedCount = 0;
  let failedCount = 0;

  for (const story of verifiedStories) {
    try {
      // Atomic commit
      const result = await Story.updateOne(
        { 
          _id: story._id, 
          migrationStatus: "verified",
          migratedContent: { $exists: true, $ne: null }
        },
        {
          $set: {
            content: story.migratedContent,
            migrationStatus: "committed"
          },
          $unset: {
            migratedContent: ""
          }
        }
      );

      if (result.modifiedCount === 1) {
        committedCount++;
      } else {
        console.warn(`Failed to commit story ${story._id}: Record might have changed state.`);
        failedCount++;
      }
    } catch (e) {
      console.error(`Error committing story ${story._id}:`, e);
      failedCount++;
    }
  }

  console.log("------------------------------------------");
  console.log("Commit complete.");
  console.log(`Committed: ${committedCount}`);
  console.log(`Failed: ${failedCount}`);
  
  mongoose.disconnect();
}

commitMigration().catch(console.error);
