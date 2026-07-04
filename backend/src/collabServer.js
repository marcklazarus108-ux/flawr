import "dotenv/config";
import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import prisma from "./utils/prisma.js";
import { verifyToken } from "./utils/token.js";

// Pulls a rough plain-text version out of the Yjs document so the dashboard
// preview, search, and AI features have something readable to work with.
// Tiptap's Collaboration extension stores content in an XML fragment named
// "default" - we stringify it and strip the tags.
function extractPlainText(ydoc) {
  const fragment = ydoc.getXmlFragment("default");
  const xml = fragment.toString();
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Render (and most PaaS hosts) assign the port to listen on via PORT at
// runtime and route external traffic to it - COLLAB_PORT is only used for
// local development, where there's no PORT env var set.
const listenPort = process.env.PORT || process.env.COLLAB_PORT || 1234;

const server = Server.configure({
  port: listenPort,

  // Every client must present a valid login token to connect. Sharing model:
  // any signed-in Flawr user with the document's link can join and edit -
  // see the note in routes/documents.js.
  async onAuthenticate(data) {
    const { token } = data;
    if (!token) throw new Error("Missing login token.");
    try {
      const payload = verifyToken(token);
      return { userId: payload.userId };
    } catch {
      throw new Error("Invalid or expired login token.");
    }
  },

  // When a document is opened, load its last saved state from Postgres.
  async onLoadDocument(data) {
    const { documentName, document } = data;
    const record = await prisma.document.findUnique({ where: { id: documentName } });
    if (record?.ydoc) {
      Y.applyUpdate(document, new Uint8Array(record.ydoc));
    }
    return document;
  },

  // Debounced by Hocuspocus internally - fires periodically while people
  // are editing, and once more when everyone disconnects.
  async onStoreDocument(data) {
    const { documentName, document } = data;
    const state = Buffer.from(Y.encodeStateAsUpdate(document));
    const plainText = extractPlainText(document);

    await prisma.document
      .update({
        where: { id: documentName },
        data: { ydoc: state, plainText },
      })
      .catch((err) => {
        console.error(`Couldn't save document ${documentName}:`, err.message);
      });
  },
});

server.listen();
console.log(`Flawr collaboration server running on port ${listenPort}`);
