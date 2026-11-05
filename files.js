import { uid } from './storage.js';

const MAX_BYTES = 10 * 1024 * 1024;
const TEXT_EXT = /\.(txt|md|json|csv|js|jsx|ts|tsx|py|html|css|java|c|cpp|h|go|rs|rb|php|sql|xml|yml|yaml|sh)$/i;

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsDataURL(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be opened.'));
    img.src = src;
  });
}

/** Downscales an image (data URL or object URL) and returns a JPEG data URL. */
export async function compressImage(src, maxSide = 1280, quality = 0.82) {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export const dataUrlToBase64 = (url) => url.split(',')[1] || '';

/** Reads a user-selected file into an attachment object. Throws a friendly Error if unsupported. */
export async function readAttachment(file) {
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
  const id = uid();
  if (file.type.startsWith('image/')) {
    const full = await compressImage(await fileToDataUrl(file), 1600, 0.85);
    const thumb = await compressImage(full, 420, 0.7);
    return { id, name: file.name, kind: 'image', mime: 'image/jpeg', base64: dataUrlToBase64(full), preview: thumb };
  }
  if (file.type === 'application/pdf') {
    return { id, name: file.name, kind: 'pdf', mime: 'application/pdf', base64: dataUrlToBase64(await fileToDataUrl(file)) };
  }
  if (file.type.startsWith('text/') || TEXT_EXT.test(file.name) || file.type === 'application/json') {
    const text = (await file.text()).slice(0, 40000);
    return { id, name: file.name, kind: 'text', text };
  }
  throw new Error(`${file.name} isn't supported. Try an image, PDF or text file.`);
}
