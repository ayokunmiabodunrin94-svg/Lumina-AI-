import { ADMIN_EMAILS } from './constants.js';
import { getUsers, saveUsers, setSessionId, uid, pushEmail } from './storage.js';

const isAdminEmail = (email) => ADMIN_EMAILS.includes(email.toLowerCase());

// Only the owner email can ever be admin; anyone else marked admin is treated as free.
function normalize(user) {
  if (!user) return user;
  if (isAdminEmail(user.email)) return user.role === 'admin' ? user : { ...user, role: 'admin' };
  return user.role === 'admin' ? { ...user, role: 'free' } : user;
}

async function sha256(text) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-secure contexts (plain http on a LAN) — not cryptographic.
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `weak-${h >>> 0}`;
}

export async function signup({ name, email, password }) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error('Enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email address.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  const users = getUsers();
  if (users.some((u) => u.email === cleanEmail)) throw new Error('An account with this email already exists. Log in instead.');

  const salt = uid();
  const user = {
    id: uid(),
    name: cleanName,
    email: cleanEmail,
    salt,
    hash: await sha256(salt + password),
    role: isAdminEmail(cleanEmail) ? 'admin' : 'free',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  setSessionId(user.id);
  pushEmail({
    type: 'signup',
    from: cleanEmail,
    subject: 'New signup',
    body: `${cleanName} (${cleanEmail}) created a Lumina AI account.`,
  });
  return user;
}

export async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === cleanEmail);
  if (idx === -1) throw new Error('No account found with that email.');
  const user = users[idx];
  if ((await sha256(user.salt + password)) !== user.hash) throw new Error('Incorrect password.');
  users[idx] = normalize(user);
  saveUsers(users);
  setSessionId(users[idx].id);
  return users[idx];
}

export function updateUser(id, patch) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return users[idx];
}

export const findUserById = (id) => normalize(getUsers().find((u) => u.id === id) || null);
