/**
 * Seed subscribers directly into MongoDB.
 * Usage: node scripts/seed-subscribers.mjs
 *
 * Add names and emails to the SUBSCRIBERS array below, then run.
 */

import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env");
  process.exit(1);
}

// ─── ADD YOUR SUBSCRIBERS HERE ───────────────────────────────────────────────
const SUBSCRIBERS = [
  { name: "Durga",           email: "pavandurgapavandurga181@gmail.com" },
  { name: "Sujith",          email: "gsujith116@gmail.com" },
  { name: "Sai Teja",        email: "nagasaiteja.career@gmail.com" },
  { name: "Mahitha",         email: "mahithachandu06@gmail.com" },
  { name: "Pujitha",         email: "pujithachinamuthevi4041@gmail.com" },
  { name: "Syam",            email: "syambukkuru@gmail.com" },
  { name: "Saranya",         email: "saranyasravanam19@gmail.com" },
  { name: "Purushotham",     email: "spurushothamreddy1@gmail.com" },
  { name: "Nissy",           email: "nissyr0306@gmail.com" },
  { name: "Jahnavi Durga",   email: "g.jahnavidurga@gmail.com" },
  { name: "Naga Pranathi",   email: "bollimunthanagapranathi@gmail.com" },
  { name: "Naga Sai Teja",   email: "bollimunthanagasaiteja@gmail.com" },
];
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (SUBSCRIBERS.length === 0) {
    console.log("⚠️  No subscribers in the list. Add them to the SUBSCRIBERS array.");
    process.exit(0);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db();
  const col = db.collection("subscribers");

  let inserted = 0;
  let skipped = 0;

  for (const sub of SUBSCRIBERS) {
    try {
      await col.insertOne({
        name: sub.name,
        email: sub.email.toLowerCase().trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✅ Added: ${sub.name} <${sub.email}>`);
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        console.log(`  ⏭️  Skipped (duplicate): ${sub.email}`);
        skipped++;
      } else {
        console.error(`  ❌ Failed: ${sub.email} —`, err.message);
      }
    }
  }

  await client.close();
  console.log(`\n🎉 Done! ${inserted} added, ${skipped} skipped (duplicates).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
