import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
    batchId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    recipientCount: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "SENT", "FAILED"],
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    requestId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.EmailLog || mongoose.model("EmailLog", EmailLogSchema);
