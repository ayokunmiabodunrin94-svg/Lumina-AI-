/*
 * Storage layer — localStorage for now.
 * Every read/write in the app goes through this file, so moving to Firebase
 * (Firestore) later only means re-implementing these functions.
 */
import { KEYS } from './constants.js';

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// Users
export const getUsers = () => read(KEYS.users, []);
export const saveUsers = (users) => write(KEYS.users, users);

// Session
export const getSessionId = () => read(KEYS.session, null);
export const setSessionId = (id) => write(KEYS.session, id);
export const clearSession = () => localStorage.removeItem(KEYS.session);

// Settings
export const getSettings = () => read(KEYS.settings, {});
export const saveSettings = (s) => write(KEYS.settings, s);

// Payments
export const getPayments = () => read(KEYS.payments, []);
export const savePayments = (p) => write(KEYS.payments, p);

// Emails (admin inbox)
export const getEmails = () => read(KEYS.emails, []);
export const saveEmails = (e) => write(KEYS.emails, e);
export function pushEmail({ type, from, subject, body }) {
  const list = getEmails();
  list.unshift({ id: uid(), type, from, subject, body, date: new Date().toISOString(), read: false });
  saveEmails(list.slice(0, 300));
}

// Chats — generated videos are blob: URLs that die with the page, so we never persist their src.
function serializeChats(chats, { keepMediaFor = Infinity } = {}) {
  return chats.map((chat, idx) => ({
    ...chat,
    messages: chat.messages.map((m) => {
      if (!m.media?.length) return m;
      const media = m.media.map((x) => {
        if (x.type === 'video') return { type: 'video', src: null, expired: true };
        if (idx >= keepMediaFor) return { type: x.type, src: null, expired: true };
        return x;
      });
      return { ...m, media };
    }),
  }));
}

export const getChats = () => read(KEYS.chats, []);

/** Saves chats; if the browser quota is hit, progressively drops stored images. */
export function saveChats(chats) {
  if (write(KEYS.chats, serializeChats(chats))) return { ok: true, trimmed: false };
  // newest chats are first in the array
  for (const keep of [5, 2, 0]) {
    if (write(KEYS.chats, serializeChats(chats, { keepMediaFor: keep }))) return { ok: true, trimmed: true };
  }
  return { ok: false, trimmed: true };
}
