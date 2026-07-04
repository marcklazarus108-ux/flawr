import { useEffect, useState } from "react";

// Shows the Flawr mark once when the app first loads, then fades out into
// the real app. Mirrors the reveal pattern used by Meta's apps: mark scales
// up and fades in, wordmark follows shortly after, brief hold, cross-fade out.
export default function Splash({ onDone }) {
  const [stage, setStage] = useState("mark"); // mark -> wordmark -> hold -> leaving

  useEffect(() => {
    const t1 = setTimeout(() => setStage("wordmark"), 200);
    const t2 = setTimeout(() => setStage("hold"), 550);
    const t3 = setTimeout(() => setStage("leaving"), 950);
    const t4 = setTimeout(() => onDone(), 1250);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  const leaving = stage === "leaving";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-flawr-800 transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`h-20 w-20 rounded-2xl bg-white flex items-center justify-center font-serif text-4xl text-flawr-800 transition-all duration-500 ${
          stage === "mark" ? "scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        F
      </div>
      <div
        className={`mt-4 font-serif text-2xl text-white transition-all duration-500 ${
          stage === "mark" ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        }`}
      >
        Flawr
      </div>
    </div>
  );
}
