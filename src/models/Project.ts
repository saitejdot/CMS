import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true, // Long form HTML content for project details
    },
    technologies: [
      {
        type: String,
      },
    ],
    coverImage: {
      type: String,
    },
    githubUrl: {
      type: String,
    },
    liveUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"],
      default: "DRAFT",
    }
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
