import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useAuth } from "../AuthContext";
import { documentsApi } from "../api/documents";
import Toolbar from "../components/Toolbar";
import AiSidebar from "../components/AiSidebar";
import ThemeToggle from "../components/ThemeToggle";

const COLLAB_URL = import.meta.env.VITE_COLLAB_URL || "ws://localhost:1234";

function userColor(userId) {
  // Deterministic color per user, so the same person always gets the same
  // cursor color across sessions.
  const hues = ["#0C447C", "#993C1D", "#3B6D11", "#72243E", "#534AB7"];
  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) % hues.length;
  return hues[hash];
}

export default function Editor() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [docList, setDocList] = useState([]);
  const [loadError, setLoadError] = useState("");

  const ydoc = useMemo(() => new Y.Doc(), [id]);

  const provider = useMemo(() => {
    const token = localStorage.getItem("flawr_token");
    return new HocuspocusProvider({
      url: COLLAB_URL,
      name: id,
      document: ydoc,
      token,
    });
  }, [id, ydoc]);

  useEffect(() => {
    documentsApi
      .get(id)
      .then((doc) => setTitle(doc.title))
      .catch(() => setLoadError("Couldn't open that document."));
    documentsApi.list().then(setDocList).catch(() => {});
    return () => provider.destroy();
  }, [id]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }), // Yjs handles undo/history
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({
          provider,
          user: { name: user?.name || "Someone", color: userColor(user?.id || "x") },
        }),
        Placeholder.configure({ placeholder: "Start writing, or scan a page to begin…" }),
        Link.configure({ openOnClick: false }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      editorProps: {
        attributes: {
          class: "prose dark:prose-invert max-w-none focus:outline-none font-serif text-[15px] leading-relaxed",
        },
      },
    },
    [ydoc, provider]
  );

  const getDocumentText = useCallback(() => (editor ? editor.getText() : ""), [editor]);

  let titleTimer;
  function handleTitleChange(value) {
    setTitle(value);
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => {
      documentsApi.rename(id, value).catch(() => {});
    }, 600);
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950">
      <header className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 shrink-0"
          >
            ← Documents
          </button>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-sm font-medium bg-transparent focus:outline-none min-w-0 flex-1"
          />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <ThemeToggle />
          <span className="text-sm text-neutral-500 hidden sm:inline">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Sign out
          </button>
        </div>
      </header>

      {loadError && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300 px-4 py-2">
          {loadError}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <aside className="w-52 shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto hidden md:block">
          <div className="p-2">
            {docList.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/doc/${d.id}`)}
                className={`w-full text-left text-xs px-2.5 py-2 rounded-md truncate block ${
                  d.id === id
                    ? "bg-flawr-50 dark:bg-flawr-900 text-flawr-800 dark:text-flawr-100"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                {d.title}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <Toolbar editor={editor} title={title} />
          <div className="flex-1 overflow-y-auto px-6 md:px-16 py-8">
            <EditorContent editor={editor} />
          </div>
        </main>

        <AiSidebar getDocumentText={getDocumentText} />
      </div>
    </div>
  );
}
