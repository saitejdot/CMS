import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    coverImage: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"],
      default: "DRAFT",
    }
  },
  {
    timestamps: true,
    collection: "blogs",
  }
);

// Indexes for performance
StorySchema.index({ status: 1, createdAt: -1 });
StorySchema.index({ slug: 1 });

export default mongoose.models.Story || mongoose.model("Story", StorySchema);
