import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Analysis from "./models/Analysis.js";
import { analyzeUrl } from "./utils/analyzer.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const memoryHistory = [];
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "URL Guard API", database: mongoose.connection.readyState === 1 ? "MongoDB connected" : "Memory mode" }));

app.post("/api/analyze", async (req, res) => {
  try {
    if (typeof req.body?.url !== "string") return res.status(400).json({ message: "Please provide a URL string." });
    const result = analyzeUrl(req.body.url);
    let saved = { ...result, _id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`, analyzedAt: new Date().toISOString() };
    if (mongoose.connection.readyState === 1) {
      const doc = await Analysis.create({ ...result, automaton: undefined });
      saved = { ...result, _id: doc._id, analyzedAt: doc.createdAt };
    } else {
      memoryHistory.unshift(saved);
      memoryHistory.splice(100);
    }
    res.json(saved);
  } catch (error) { res.status(500).json({ message: "Analysis failed.", error: error.message }); }
});

app.get("/api/history", async (_req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const rows = await Analysis.find().sort({ createdAt: -1 }).limit(50).lean();
      return res.json(rows);
    }
    res.json(memoryHistory);
  } catch (error) { res.status(500).json({ message: "Could not load history.", error: error.message }); }
});

app.delete("/api/history/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Delete history is available after MongoDB is connected. Memory history clears when the server restarts." });
    const deleted = await Analysis.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found." });
    res.json({ message: "Record deleted." });
  } catch { res.status(400).json({ message: "Invalid record ID." }); }
});

async function start() {
  if (process.env.MONGO_URI) {
    try { await mongoose.connect(process.env.MONGO_URI); console.log("MongoDB connected"); }
    catch (error) { console.error("MongoDB connection failed; continuing in memory mode:", error.message); }
  } else console.log("MONGO_URI not set; using temporary in-memory history.");
  app.listen(PORT, "0.0.0.0", () => console.log(`API running on port ${PORT}`));
}
start();
