import mongoose from "mongoose";

const PageContentSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      unique: true, // e.g., "about", "now"
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PageContent || mongoose.model("PageContent", PageContentSchema);
