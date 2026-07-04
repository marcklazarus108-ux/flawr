import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { documentsApi } from "../api/documents";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    documentsApi
      .list()
      .then(setDocs)
      .catch(() => setError("Couldn't load your documents."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    try {
      const doc = await documentsApi.create("Untitled document");
      navigate(`/doc/${doc.id}`);
    } catch {
      setError("Couldn't create a new document.");
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm("Delete this document? This can't be undone.")) return;
    try {
      await documentsApi.remove(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Couldn't delete that document.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="font-serif text-xl text-flawr-800 dark:text-flawr-100">Flawr</div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-neutral-500">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium">Your documents</h1>
          <button
            onClick={handleCreate}
            className="rounded-md bg-flawr-800 hover:bg-flawr-900 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            New document
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
            <p className="font-medium mb-1">Start your first document</p>
            <p className="text-sm text-neutral-500 mb-4">
              Write from scratch, or scan a photo once you're inside the editor.
            </p>
            <button
              onClick={handleCreate}
              className="rounded-md bg-flawr-800 hover:bg-flawr-900 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              Create document
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            {docs.map((doc) => (
              <li
                key={doc.id}
                onClick={() => navigate(`/doc/${doc.id}`)}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {doc.preview || "Empty document"}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="text-xs text-neutral-400 hover:text-red-600 ml-4 shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
