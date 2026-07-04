import { Router } from "express";
import prisma from "../utils/prisma.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// GET /api/documents - list the signed-in user's documents, newest first
router.get("/", async (req, res) => {
  const docs = await prisma.document.findMany({
    where: { ownerId: req.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, plainText: true, updatedAt: true, createdAt: true },
  });

  const withPreview = docs.map((d) => ({
    ...d,
    preview: d.plainText.slice(0, 140),
  }));

  res.json({ documents: withPreview });
});

// POST /api/documents - create a new, empty document
router.post("/", async (req, res) => {
  const title = (req.body?.title || "Untitled document").slice(0, 200);
  const doc = await prisma.document.create({
    data: { title, ownerId: req.userId },
  });
  res.status(201).json({ document: doc });
});

// GET /api/documents/:id - fetch one document (including its Yjs state, base64-encoded)
// Note on sharing: any signed-in Flawr user who has the document's link can
// open and co-edit it - the same "anyone with the link" model classic Google
// Docs sharing used before granular permissions. There's no per-person
// invite list yet - that would be a natural next feature to add.
router.get("/:id", async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: "Document not found." });

  res.json({
    document: {
      id: doc.id,
      title: doc.title,
      plainText: doc.plainText,
      ydoc: doc.ydoc ? doc.ydoc.toString("base64") : null,
      updatedAt: doc.updatedAt,
      isOwner: doc.ownerId === req.userId,
    },
  });
});

// PATCH /api/documents/:id - rename a document
router.patch("/:id", async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, ownerId: req.userId },
  });
  if (!doc) return res.status(404).json({ error: "Document not found." });

  const title = (req.body?.title || doc.title).slice(0, 200);
  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: { title },
  });
  res.json({ document: updated });
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, ownerId: req.userId },
  });
  if (!doc) return res.status(404).json({ error: "Document not found." });

  await prisma.document.delete({ where: { id: doc.id } });
  res.status(204).end();
});

export default router;
