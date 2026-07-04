import { Router } from "express";
import HTMLtoDOCX from "html-to-docx";
import PDFDocument from "pdfkit";
import TurndownService from "turndown";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

const turndown = new TurndownService();

function safeFilename(title) {
  return (title || "document").replace(/[^a-z0-9\-_ ]/gi, "").trim() || "document";
}

// POST /api/export/docx  { title, html }
router.post("/docx", async (req, res) => {
  try {
    const { title, html } = req.body;
    const buffer = await HTMLtoDOCX(html || "<p></p>", null, {
      title: title || "Untitled document",
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(title)}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error("Docx export error:", err);
    res.status(500).json({ error: "Couldn't generate the Word file. Try again." });
  }
});

// POST /api/export/markdown  { title, html }
router.post("/markdown", (req, res) => {
  try {
    const { title, html } = req.body;
    const markdown = turndown.turndown(html || "");
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(title)}.md"`);
    res.send(markdown);
  } catch (err) {
    console.error("Markdown export error:", err);
    res.status(500).json({ error: "Couldn't generate the markdown file. Try again." });
  }
});

// POST /api/export/pdf  { title, plainText }
// Note: this is a text-only PDF (headings/paragraphs), not a pixel-perfect
// rendering of the editor's formatting - a solid v1, upgradeable later to a
// full HTML-to-PDF render if richer fidelity is needed.
router.post("/pdf", (req, res) => {
  try {
    const { title, plainText } = req.body;
    const doc = new PDFDocument({ margin: 60 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(title)}.pdf"`);
    doc.pipe(res);

    doc.font("Times-Bold").fontSize(20).text(title || "Untitled document");
    doc.moveDown();
    doc.font("Times-Roman").fontSize(12).text(plainText || "", { align: "left" });
    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ error: "Couldn't generate the PDF. Try again." });
  }
});

export default router;
