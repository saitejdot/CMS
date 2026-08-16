import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ["cloudflare-images", "cloudflare-stream"],
    },
    providerId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "video"],
    },
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
    },
    mimeType: {
      type: String,
    },
    sizeBytes: {
      type: Number,
    },
    checksum: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      default: "ready",
      enum: ["uploaded", "processing", "ready", "failed"],
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    duration: {
      type: Number,
    },
    thumbnailUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
