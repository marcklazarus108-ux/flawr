import { useRef, useState } from "react";
import { aiApi } from "../api/documents";

export default function ScanButton({ onTranscribed }) {
  const inputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError("");
    setScanning(true);
    try {
      const text = await aiApi.scan(file);
      onTranscribed(text);
    } catch {
      setError("Couldn't read that photo. Try better lighting or a straighter angle.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 disabled:opacity-60"
      >
        {scanning ? "Reading photo…" : "Scan page"}
      </button>
      {error && (
        <p className="absolute top-full mt-1 right-0 w-56 text-xs text-red-600 bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900 rounded-md p-2 z-10">
          {error}
        </p>
      )}
    </div>
  );
}
