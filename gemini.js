import { IMAGE_MODEL } from './models.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const getKey = () => import.meta.env.VITE_GEMINI_API_KEY;
export const hasKey = () => Boolean(getKey());

export const SYSTEM_PROMPT =
  'You are Lumina AI, a friendly assistant made by Lumina Studio. Your motto is "Light Up Your Ideas". ' +
  'People of all ages use you, so keep every answer safe, kind and age-appropriate. ' +
  'Reply in the language the person writes in. Use clear Markdown: short paragraphs, lists when helpful, and fenced code blocks with a language tag for code.';

export class GeminiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function toError(res) {
  let detail = '';
  try {
    const j = await res.json();
    detail = j?.error?.message || '';
  } catch { /* ignore */ }
  if (res.status === 400 && /api key/i.test(detail)) return new GeminiError('key', 'The Gemini API key is not valid. Check VITE_GEMINI_API_KEY.');
  if (res.status === 401 || res.status === 403) return new GeminiError('auth', 'Gemini refused the request. Check that your API key is allowed to use this model.');
  if (res.status === 404) return new GeminiError('model', 'That Gemini model is not available for your key. Try a different model in Settings or .env.');
  if (res.status === 429) return new GeminiError('quota', 'Gemini rate limit or quota reached. Wait a moment and try again.');
  return new GeminiError('http', detail || `Gemini request failed (${res.status}).`);
}

/** Converts saved chat messages into Gemini "contents" (text only, last 20 turns). */
export function toGeminiHistory(messages) {
  return messages
    .filter((m) => (m.text || '').trim())
    .slice(-20)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
}

/** Builds the parts for a new user turn, including image / pdf / text attachments. */
export function userParts(text, attachments = []) {
  const parts = [];
  for (const a of attachments) {
    if (a.kind === 'image' || a.kind === 'pdf') {
      parts.push({ inlineData: { mimeType: a.mime, data: a.base64 } });
    } else if (a.kind === 'text') {
      parts.push({ text: `File "${a.name}":\n\`\`\`\n${a.text}\n\`\`\`` });
    }
  }
  parts.push({ text: text || 'Please look at the attached file(s) and help me.' });
  return parts;
}

/** Streams a text reply. onToken receives the full text so far. */
export async function streamChat({ engine, contents, system = SYSTEM_PROMPT, signal, onToken }) {
  const key = getKey();
  if (!key) throw new GeminiError('nokey', 'Add your Gemini key as VITE_GEMINI_API_KEY in .env, then restart the dev server.');
  const res = await fetch(`${BASE}/models/${engine}:streamGenerateContent?alt=sse&key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.8 },
    }),
  });
  if (!res.ok) throw await toError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let blocked = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const j = JSON.parse(data);
        const t = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
        if (t) {
          full += t;
          onToken?.(full);
        }
        if (j.promptFeedback?.blockReason) blocked = j.promptFeedback.blockReason;
      } catch { /* partial JSON chunk, ignore */ }
    }
  }
  if (!full) {
    throw new GeminiError('empty', blocked ? 'That request was blocked by Gemini safety filters. Try rephrasing it.' : 'Gemini returned an empty reply. Please try again.');
  }
  return full;
}

/** Generates an image with Gemini. Returns { text, images: [dataUrl] }. */
export async function generateImage(prompt, signal) {
  const key = getKey();
  if (!key) throw new GeminiError('nokey', 'Add your Gemini key as VITE_GEMINI_API_KEY in .env, then restart the dev server.');
  const res = await fetch(`${BASE}/models/${IMAGE_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  if (!res.ok) throw await toError(res);
  const j = await res.json();
  const parts = j.candidates?.[0]?.content?.parts || [];
  const images = [];
  let text = '';
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    if (inline?.data) images.push(`data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${inline.data}`);
    else if (p.text) text += p.text;
  }
  if (!images.length) {
    throw new GeminiError('empty', text || 'No image came back. Try describing it a different way.');
  }
  return { text, images };
}

/* ------------------------------------------------------------------ */
/* VIDEO — exact function (Veo 2 long-running operation, fetched as a  */
/* blob so there is no XML / raw-URL playback bug).                    */
/* ------------------------------------------------------------------ */
export async function generateVideo(prompt){
 const key=import.meta.env.VITE_GEMINI_API_KEY;
 const start=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({instances:[{prompt}],parameters:{aspectRatio:"16:9"}})});
 const s=await start.json(); let op=s.name; let uri=null; for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,10000)); let p=await fetch(`https://generativelanguage.googleapis.com/v1beta/${op}?key=${key}`); let d=await p.json(); if(d.done){uri=d.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri; break;}}
 let final=uri+(uri.includes('?')?'&':'?')+`key=${key}`; let res=await fetch(final); let blob=await res.blob(); return URL.createObjectURL(new Blob([blob],{type:'video/mp4'}));
}
