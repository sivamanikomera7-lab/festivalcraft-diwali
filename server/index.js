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
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 5000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
const razorpayReady = (keyId.startsWith("rzp_test_") || keyId.startsWith("rzp_live_")) && keySecret && !keySecret.includes("REPLACE");
const razorpay = razorpayReady ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

const dataDir = process.env.STORAGE_DIR || path.join(__dirname, "data");
const uploadsDir = path.join(dataDir, "uploads");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
const db = new Database(path.join(dataDir, "festivalcraft.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY, amount INTEGER NOT NULL, currency TEXT NOT NULL,
  sender TEXT NOT NULL, receiver TEXT NOT NULL, message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created', payment_id TEXT, gift_id TEXT UNIQUE,
  photos TEXT NOT NULL DEFAULT '[]', audio TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);
const getOrder = db.prepare("SELECT * FROM orders WHERE order_id = ?");
const getGift = db.prepare("SELECT * FROM orders WHERE gift_id = ? AND status='paid'");
const insertOrder = db.prepare(`INSERT INTO orders(order_id,amount,currency,sender,receiver,message,status)
 VALUES(@order_id,@amount,@currency,@sender,@receiver,@message,'created')`);
const markPaid = db.prepare("UPDATE orders SET status='paid', payment_id=?, gift_id=COALESCE(gift_id, ?) WHERE order_id=? AND status!='paid'");
const updatePhotos = db.prepare("UPDATE orders SET photos=? WHERE gift_id=? AND status='paid'");
const updateAudio = db.prepare("UPDATE orders SET audio=? WHERE gift_id=? AND status='paid'");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 11 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "photos" && allowedImageTypes.has(file.mimetype)) return cb(null, true);
    if (file.fieldname === "audio" && ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Unsupported file type."));
  }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false }));
app.use("/uploads", express.static(uploadsDir, { dotfiles: "deny", index: false, maxAge: "1h" }));

// Webhook uses raw bytes, before express.json().
app.post("/api/razorpay-webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!webhookSecret) return res.status(503).json({ error: "Webhook secret is not configured." });
  const signature = req.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", webhookSecret).update(req.body).digest("hex");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ error: "Invalid webhook signature." });
  try {
    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const orderId = payment?.order_id || orderEntity?.id;
      const paymentId = payment?.id || null;
      const row = orderId ? getOrder.get(orderId) : null;
      if (row && paymentId && payment?.status === "captured" && payment.amount === row.amount && payment.currency === row.currency) {
        markPaid.run(paymentId, crypto.randomBytes(18).toString("hex"), orderId);
      }
    }
    res.json({ received: true });
  } catch { res.status(400).json({ error: "Invalid webhook body." }); }
});
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, razorpayConfigured: Boolean(razorpay) }));

app.post("/api/create-order", async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ error: "Razorpay test keys configure చేయండి. .env.exampleను .envగా copy చేయండి." });
    const { sender, receiver, message = "" } = req.body || {};
    const cleanSender = cleanText(sender, 60);
    const cleanReceiver = cleanText(receiver, 60);
    const cleanMessage = cleanText(message, 500);
    if (!cleanSender || !cleanReceiver || cleanMessage.length < 3) return res.status(400).json({ error: "Sender, receiver, message అవసరం." });
    // Price is fixed on the server: ₹10 = 1000 paise.
    const amount = 1000, currency = "INR";
    const order = await razorpay.orders.create({
      amount, currency, receipt: `fc_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`,
      notes: { product: "FestivalCraft Diwali Gift" }
    });
    insertOrder.run({ order_id: order.id, amount, currency, sender: cleanSender, receiver: cleanReceiver, message: cleanMessage });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (e) {
    console.error("create-order:", e?.message || e);
    res.status(500).json({ error: "Order create కాలేదు. Server logs check చేయండి." });
  }
});

app.post("/api/verify-payment", async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ verified: false, error: "Razorpay keys configure కాలేదు." });
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!orderId || orderId !== razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing or mismatched payment fields." });
    }
    const row = getOrder.get(orderId);
    if (!row) return res.status(404).json({ verified: false, error: "Order not found." });
    const expected = crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const a = Buffer.from(razorpay_signature), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ verified: false, error: "Payment signature verification failed." });

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.order_id !== orderId || payment.status !== "captured" || payment.amount !== row.amount || payment.currency !== row.currency) {
      return res.status(400).json({ verified: false, error: "Payment is not captured or does not match this order." });
    }
    const giftId = row.gift_id || crypto.randomBytes(18).toString("hex");
    markPaid.run(razorpay_payment_id, giftId, orderId);
    const latest = getOrder.get(orderId);
    res.json({ verified: latest.status === "paid", giftId: latest.gift_id, orderId });
  } catch (e) {
    console.error("verify-payment:", e?.message || e);
    res.status(502).json({ verified: false, error: "Payment status confirm కాలేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి." });
  }
});

app.post("/api/gifts/:giftId/media", (req, res) => {
  upload.fields([{ name: "photos", maxCount: 10 }, { name: "audio", maxCount: 1 }])(req, res, err => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed." });
    const giftId = String(req.params.giftId || "");
    if (!/^[a-f0-9]{36}$/.test(giftId)) return res.status(400).json({ error: "Invalid gift ID." });
    const row = getGift.get(giftId);
    if (!row) {
      cleanupFiles(req.files);
      return res.status(404).json({ error: "Paid gift not found." });
    }
    const photoFiles = req.files?.photos || [];
    const audioFiles = req.files?.audio || [];
    if (photoFiles.length > 10 || audioFiles.length > 1) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: "గరిష్ఠంగా 10 photos, 1 voice message మాత్రమే." });
    }
    const photoUrls = photoFiles.map(f => `/uploads/${path.basename(f.filename)}`);
    const audioUrl = audioFiles[0] ? `/uploads/${path.basename(audioFiles[0].filename)}` : row.audio;
    updatePhotos.run(JSON.stringify(photoUrls), giftId);
    if (audioUrl) updateAudio.run(audioUrl, giftId);
    res.json({ saved: true, photoCount: photoUrls.length, audio: audioUrl || null });
  });
});

app.get("/api/gifts/:giftId", (req, res) => {
  const giftId = String(req.params.giftId || "");
  if (!/^[a-f0-9]{36}$/.test(giftId)) return res.status(404).json({ error: "Gift not found." });
  const row = getGift.get(giftId);
  if (!row) return res.status(404).json({ error: "Gift not found." });
  res.json({
    sender: row.sender, receiver: row.receiver, message: row.message,
    photos: JSON.parse(row.photos || "[]"), audio: row.audio || null, createdAt: row.created_at
  });
});

function cleanupFiles(files) {
  if (!files) return;
  for (const list of Object.values(files)) for (const file of list) {
    try { fs.unlinkSync(file.path); } catch {}
  }
}
function cleanText(value, max) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

const distPath = path.resolve(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}
app.use((err, _req, res, _next) => {
  console.error("server error:", err?.message || err);
  if (!res.headersSent) res.status(500).json({ error: "Unexpected server error." });
});
app.listen(PORT, () => console.log(`FestivalCraft API running on http://localhost:${PORT}; Razorpay configured: ${Boolean(razorpay)}`));
