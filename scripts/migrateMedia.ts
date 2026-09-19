import mongoose from "mongoose";
import * as cheerio from "cheerio";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import Story from "../src/models/Story";
import Media from "../src/models/Media";
import { connectDB } from "../src/lib/db";

// Helper: Convert Base64 string to Buffer
function base64ToBuffer(base64Data: string): Buffer {
  const base64 = base64Data.split(",")[1] || base64Data;
  return Buffer.from(base64, "base64");
}

// Helper: Upload to Cloudflare Images
async function uploadToCloudflareImages(buffer: Buffer, mimeType: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  if (!accountId || !apiToken) throw new Error("Cloudflare credentials missing");

  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }));
  fd.append("requireSignedURLs", "false");

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`
    },
    body: fd
  });

  if (!res.ok) {
    throw new Error(`CF Upload Error: ${res.statusText}`);
  }

  const data = await res.json();
  const deliveryUrl = data.result.variants[0]; // Usually the 'public' variant
  return deliveryUrl; // return the Cloudflare URL
}

async function run() {
  console.log("Starting Phase 1B Base64 Media Migration...");
  await connectDB();

  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) {
    console.log("Running in DRY RUN mode. No data will be written to DB or uploaded to CF.");
  }

  const stories = await Story.find({ 
    migrationStatus: { $nin: ["committed", "verified"] } 
  });

  const report = {
    totalStories: stories.length,
    storiesWithBase64: 0,
    totalAssetsFound: 0,
    imagesFound: 0,
    videosFound: 0,
    successfulUploads: 0,
    failedUploads: 0,
    duplicatesReused: 0,
    unsupportedAssets: 0,
    alreadyMigrated: 0,
    verificationFailures: 0,
    committedStories: 0,
    failedStories: [] as any[]
  };

  for (const story of stories) {
    try {
      if (!story.content || !story.content.includes("data:image/")) {
        // Already clean or doesn't have base64
        if (story.migrationStatus !== "migrated") {
           report.alreadyMigrated++;
           if (!isDryRun) {
             story.migratedContent = story.content;
             story.migrationStatus = "verified";
             await story.save();
           }
        }
        continue;
      }

      report.storiesWithBase64++;
      const $ = cheerio.load(story.content);
      const images = $("img[src^='data:image/']");
      
      let storyFailed = false;
      let assetsFailedCount = 0;
      let reason = "";

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const src = $(img).attr("src");
          if (!src) continue;

          report.totalAssetsFound++;
          report.imagesFound++;

          const match = src.match(/^data:(image\/[a-zA-Z+]+);base64,/);
          if (!match) {
            report.unsupportedAssets++;
            continue;
          }

          const mimeType = match[1];
          const buffer = base64ToBuffer(src);
          const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

          // Deduplication check
          const existingMedia = await Media.findOne({ checksum, status: "ready" });
          let newUrl = "";

          if (existingMedia) {
            report.duplicatesReused++;
            newUrl = existingMedia.url;
          } else {
            // Upload to CF
            if (!isDryRun) {
              try {
                newUrl = await uploadToCloudflareImages(buffer, mimeType);
                report.successfulUploads++;
                
                // Track in DB
                await Media.create({
                  provider: "cloudflare-images",
                  providerId: "extracted-from-url-or-api", // Real implementation should extract actual CF id
                  type: "image",
                  url: newUrl,
                  mimeType,
                  sizeBytes: buffer.length,
                  checksum,
                  status: "ready"
                });
              } catch (e) {
                report.failedUploads++;
                assetsFailedCount++;
                storyFailed = true;
                reason = (e as Error).message;
                break; // stop processing this story
              }
            } else {
              // Dry run fake URL
              newUrl = "https://imagedelivery.net/fake-dry-run-url/" + checksum;
            }
          }

          // Replace src in Cheerio DOM
          $(img).attr("src", newUrl);
        }
      }

      if (storyFailed) {
        report.failedStories.push({
          storyId: story._id.toString(),
          status: "failed",
          assetsFailedCount,
          reason
        });
        if (!isDryRun) {
          story.migrationStatus = "failed";
          await story.save();
        }
      } else {
        // Success
        const migratedHtml = $.html();
        if (!isDryRun) {
          story.migratedContent = migratedHtml;
          story.migrationStatus = "verified"; // we mark it verified ready for commit
          await story.save();
        }
      }
    } catch (e) {
      report.failedStories.push({
        storyId: story._id.toString(),
        status: "failed",
        assetsFailedCount: 0,
        reason: (e as Error).message
      });
      if (!isDryRun) {
         story.migrationStatus = "failed";
         await story.save();
      }
    }
  }

  const reportPath = path.join(process.cwd(), "migration-report.json");
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Migration completed. Report saved to ${reportPath}`);
  mongoose.disconnect();
}

run().catch(console.error);
