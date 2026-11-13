import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  url: { type: String, required: true, maxlength: 2048 },
  classification: { type: String, enum: ["Valid", "Suspicious", "Invalid"], required: true },
  score: { type: Number, required: true },
  reasons: [{ type: String }],
  protocol: String,
  hostname: String,
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Analysis", analysisSchema);
