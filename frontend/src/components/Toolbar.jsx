import { useState } from "react";
import ScanButton from "./ScanButton";
import { aiApi, exportApi } from "../api/documents";

export default function Toolbar({ editor, title }) {
  const [asking, setAsking] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [working, setWorking] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  if (!editor) return null;

  const hasSelection = !editor.state.selection.empty;

  async function handleAskAi(e) {
    e.preventDefault();
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText || !instruction.trim()) return;

    setWorking(true);
    try {
      const result = await aiApi.edit(selectedText, instruction);
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
      setInstruction("");
      setAsking(false);
    } catch {
      window.alert("The AI couldn't make that edit. Try again.");
    } finally {
      setWorking(false);
    }
  }

  function handleScanned(text) {
    editor.chain().focus().insertContent(`<p>${text.replace(/\n+/g, "</p><p>")}</p>`).run();
  }

  function getHtmlAndText() {
    return { html: editor.getHTML(), text: editor.getText() };
  }

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-1 px-4 py-2 flex-wrap">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="B" />
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="I" italic />
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="S" strike />
        <Divider />
        <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} label="H1" />
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2" />
        <Divider />
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="•" />
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="1." />
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          label="Table"
        />

        <div className="flex-1" />

        {hasSelection && (
          <button
            onClick={() => setAsking((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-md bg-flawr-50 dark:bg-flawr-900 text-flawr-800 dark:text-flawr-100 hover:bg-flawr-100 dark:hover:bg-flawr-800"
          >
            Ask AI
          </button>
        )}

        <ScanButton onTranscribed={handleScanned} />

        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Export
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-md z-10 py-1">
              {[
                ["Word (.docx)", () => { const { html } = getHtmlAndText(); exportApi.docx(title, html); }],
                ["PDF (.pdf)", () => { const { text } = getHtmlAndText(); exportApi.pdf(title, text); }],
                ["Markdown (.md)", () => { const { html } = getHtmlAndText(); exportApi.markdown(title, html); }],
              ].map(([label, fn]) => (
                <button
                  key={label}
                  onClick={() => { fn(); setExportOpen(false); }}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {asking && (
        <form onSubmit={handleAskAi} className="flex items-center gap-2 px-4 pb-3">
          <input
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Tell the AI what to do with the selected text"
            className="flex-1 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-flawr-400"
          />
          <button
            type="submit"
            disabled={working}
            className="text-xs px-3 py-1.5 rounded-md bg-flawr-800 hover:bg-flawr-900 text-white disabled:opacity-60"
          >
            {working ? "Working…" : "Apply"}
          </button>
        </form>
      )}
    </div>
  );
}

function ToolbarButton({ onClick, label, active, italic, strike }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2 py-1.5 rounded-md min-w-[28px] ${
        active
          ? "bg-flawr-50 dark:bg-flawr-900 text-flawr-800 dark:text-flawr-100"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
      } ${italic ? "italic" : ""} ${strike ? "line-through" : ""}`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1" />;
}
