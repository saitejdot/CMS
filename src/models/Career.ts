import mongoose from "mongoose";

const CareerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["experience", "education", "certification", "achievement"],
    },
    title: {
      type: String,
      required: true,
    },
    organization: {
      type: String, // Company, University, or Issuing Body
      required: true,
    },
    location: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date, // null means "Present"
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    url: {
      type: String, // Link to credential or company
    },
    skills: [
      {
        type: String,
      },
    ],
    order: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

CareerSchema.index({ type: 1, order: 1, startDate: -1 });

export default mongoose.models.Career || mongoose.model("Career", CareerSchema);
