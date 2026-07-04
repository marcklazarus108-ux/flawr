import { useRef, useState, useEffect } from "react";
import { aiApi } from "../api/documents";

export default function AiSidebar({ getDocumentText }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me to help with this document, I can draft, rewrite, summarize, or answer questions about it." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const documentText = getDocumentText();
      const reply = await aiApi.chat(text, documentText);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't respond just now. Try asking again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-72 shrink-0 border-l border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 text-sm font-medium">
        Ai assistant
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm px-3 py-2 rounded-md max-w-[90%] ${
              m.role === "user"
                ? "ml-auto bg-flawr-800 text-white"
                : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="text-sm px-3 py-2 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 max-w-[90%] text-neutral-400">
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-neutral-200 dark:border-neutral-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Flawr about this doc"
          className="flex-1 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-flawr-400"
        />
        <button
          type="submit"
          disabled={sending}
          className="text-sm px-3 py-1.5 rounded-md bg-flawr-800 hover:bg-flawr-900 text-white disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
