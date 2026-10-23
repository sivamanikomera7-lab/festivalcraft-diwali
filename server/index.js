import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import Razorpay from "razorpay";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
console.log("FestivalCraft server starting...");
const PORT = Number(process.env.PORT || 5000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

const razorpayReady =
  (keyId.startsWith("rzp_test_") || keyId.startsWith("rzp_live_")) &&
  Boolean(keySecret) &&
  !keySecret.includes("REPLACE");
const distPath = path.resolve(process.cwd(), "dist");

console.log("Frontend build path:", distPath);
console.log(
  "Frontend index exists:",
  fs.existsSync(path.join(distPath, "index.html"))
);

if (fs.existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));

  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
      return next();
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.status(500).send("Frontend build missing. Check Render logs.");
  });
}
app.listen(PORT, () => {
  console.log(`FestivalCraft API running on port ${PORT}`);
});
