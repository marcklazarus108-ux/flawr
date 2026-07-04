import { Router } from "express";
import multer from "multer";
import requireAuth from "../middleware/requireAuth.js";
import { chatAboutDocument, editText, transcribeImage } from "../utils/groq.js";

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/ai/chat  { message, documentText }
router.post("/chat", async (req, res) => {
  try {
    const { message, documentText } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Type a message first." });
    }
    const reply = await chatAboutDocument(message, documentText || "");
    res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(502).json({ error: "The AI assistant didn't respond. Try again." });
  }
});

// POST /api/ai/edit  { selectedText, instruction }
router.post("/edit", async (req, res) => {
  try {
    const { selectedText, instruction } = req.body;
    if (!selectedText || !instruction) {
      return res.status(400).json({ error: "Select some text and describe the change." });
    }
    const result = await editText(selectedText, instruction);
    res.json({ result });
  } catch (err) {
    console.error("AI edit error:", err);
    res.status(502).json({ error: "The AI couldn't make that edit. Try again." });
  }
});

// POST /api/ai/scan  (multipart form, field name "image")
router.post("/scan", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Attach a photo to scan." });
    }
    const base64 = req.file.buffer.toString("base64");
    const text = await transcribeImage(base64, req.file.mimetype);
    res.json({ text });
  } catch (err) {
    console.error("AI scan error:", err);
    res.status(502).json({ error: "Couldn't read that photo. Try a clearer shot." });
  }
});

export default router;
