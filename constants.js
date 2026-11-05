export const APP_NAME = 'Lumina AI';
export const TAGLINE = 'Light Up Your Ideas';
export const STUDIO = 'Lumina Studio';
export const FOOTER_TEXT = `Created by ${STUDIO}`;

// Opay account that receives plan payments.
export const OPAY = {
  bank: 'Opay',
  accountNumber: '8155922604',
  accountName: 'Abisola modupe',
};

export const KEYS = {
  chats: 'lumina_chats',
  users: 'lumina_users',
  payments: 'lumina_payments',
  emails: 'lumina_emails',
  session: 'lumina_session',
  settings: 'lumina_settings',
  adminUnlock: 'lumina_admin_unlocked',
};

// The ONLY account that is admin and never pays. Everyone else must upgrade.
export const OWNER_EMAIL = 'ayokunmiabodunrin94@gmail.com';
export const ADMIN_EMAILS = [OWNER_EMAIL];

export const BASE_URL = import.meta.env.BASE_URL || '/';
export const LOGO_TILE = `${BASE_URL}icons/logo-tile.png`;
export const LOGO_WORDMARK = `${BASE_URL}icons/logo-wordmark.png`;

export const naira = (n) => (n ? `₦${Number(n).toLocaleString('en-NG')}` : 'Free');
