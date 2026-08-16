import mongoose from "mongoose";

const TranslationSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    translatedContent: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Unique index — one translation per story + language combination
TranslationSchema.index({ storyId: 1, language: 1 }, { unique: true });

export default mongoose.models.Translation || mongoose.model("Translation", TranslationSchema);
