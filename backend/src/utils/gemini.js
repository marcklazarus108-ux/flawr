// Thin wrapper around Google's Gemini API. Uses plain fetch so we don't need
// an extra SDK dependency. Docs: https://ai.google.dev/gemini-api/docs

const MODEL = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(parts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set on the server.");
  }

  const res = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return text.trim();
}

// Chat: the user asks a question or gives an instruction about their document.
// documentText is the current plain-text content, so the AI has context.
export async function chatAboutDocument(message, documentText) {
  const prompt = `You are Flawr's writing assistant, built into a document editor. The user is chief in command - you help with their writing but never take over unasked.

Current document content:
"""
${documentText || "(empty document)"}
"""

The user says: "${message}"

Reply conversationally and helpfully, in plain text, no markdown formatting symbols like ** or #. If they asked you to change the document, describe what you would change - actual edits are applied separately via the edit feature.`;

  return callGemini([{ text: prompt }]);
}

// Inline edit: rewrite a specific selected passage per an instruction, and
// return only the replacement text - no preamble, no explanation.
export async function editText(selectedText, instruction) {
  const prompt = `Rewrite the following passage according to this instruction: "${instruction}"

Passage:
"""
${selectedText}
"""

Return ONLY the rewritten passage. No quotes, no explanation, no preamble.`;

  return callGemini([{ text: prompt }]);
}

// Photo scan: transcribe a handwritten note, textbook page, or any photo of
// text into clean, structured plain text.
export async function transcribeImage(base64Image, mimeType) {
  const prompt = `Transcribe all text visible in this image exactly as written. If it's handwritten, do your best to read the handwriting. Preserve paragraph breaks and lists where obvious. Return ONLY the transcribed text, no commentary.`;

  return callGemini([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: base64Image } },
  ]);
}
