// Thin wrapper around Groq's API (OpenAI-compatible chat completions).
// Groq is used instead of Gemini here because getting a key is a single
// click at https://console.groq.com/keys - no OAuth-style setup needed.
// Docs: https://console.groq.com/docs/overview

const BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

async function callGroq(messages, model) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set on the server.");
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

// Chat: the user asks a question or gives an instruction about their document.
// documentText is the current plain-text content, so the AI has context.
export async function chatAboutDocument(message, documentText) {
  const systemPrompt = `You are Flawr's writing assistant, built into a document editor. The user is chief in command - you help with their writing but never take over unasked. Reply conversationally and helpfully, in plain text, no markdown formatting symbols like ** or #. If they asked you to change the document, describe what you would change - actual edits are applied separately via the edit feature.`;

  const userPrompt = `Current document content:\n"""\n${documentText || "(empty document)"}\n"""\n\nThe user says: "${message}"`;

  return callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    TEXT_MODEL
  );
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

  return callGroq([{ role: "user", content: prompt }], TEXT_MODEL);
}

// Photo scan: transcribe a handwritten note, textbook page, or any photo of
// text into clean, structured plain text.
export async function transcribeImage(base64Image, mimeType) {
  const prompt = `Transcribe all text visible in this image exactly as written. If it's handwritten, do your best to read the handwriting. Preserve paragraph breaks and lists where obvious. Return ONLY the transcribed text, no commentary.`;

  return callGroq(
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ],
    VISION_MODEL
  );
}
