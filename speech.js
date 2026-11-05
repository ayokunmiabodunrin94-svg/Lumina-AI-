/* Voice input (Web Speech API) and voice output (speechSynthesis). */

export const sttSupported = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Starts dictation. Returns a stop() function. */
export function startListening({ onResult, onEnd, onError, lang }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.('unsupported');
    return () => {};
  }
  const rec = new SR();
  rec.lang = lang || navigator.language || 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    onResult?.(text.trim(), e.results[e.results.length - 1].isFinal);
  };
  rec.onerror = (e) => onError?.(e.error);
  rec.onend = () => onEnd?.();
  try {
    rec.start();
  } catch {
    onError?.('start-failed');
  }
  return () => {
    try { rec.stop(); } catch { /* ignore */ }
  };
}

export function plainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' (code block) ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[*_~>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/** Speaks text in sentence-sized chunks (long utterances get cut off in some browsers). */
export function speak(text, { onEnd } = {}) {
  if (!ttsSupported()) return;
  stopSpeaking();
  const clean = plainText(text);
  if (!clean) return;
  const chunks = clean.match(/[^.!?\n]+[.!?]*\s*/g) || [clean];
  const merged = [];
  let cur = '';
  for (const c of chunks) {
    if ((cur + c).length > 180 && cur) {
      merged.push(cur);
      cur = c;
    } else cur += c;
  }
  if (cur) merged.push(cur);
  merged.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = navigator.language || 'en-US';
    if (i === merged.length - 1) u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  });
}
