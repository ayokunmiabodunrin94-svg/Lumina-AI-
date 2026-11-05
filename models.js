import { naira } from './constants.js';

const env = import.meta.env;

/**
 * Five Lumina tiers. Pro and Plus are free; the other three are paid and
 * unlock features by account role (see FEATURES below).
 */
export const MODELS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 0,
    rank: 0,
    engine: env.VITE_MODEL_PRO || 'gemini-2.5-flash-lite',
    blurb: 'Fast answers for everyday questions.',
    features: ['Quick text chat', 'Voice input and spoken replies', 'Code blocks with copy', 'Text and code file uploads'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 0,
    rank: 0,
    engine: env.VITE_MODEL_PLUS || 'gemini-2.5-flash',
    blurb: 'A stronger all-round model for writing and planning.',
    features: ['Everything in Pro', 'Longer, more detailed answers', 'Better reasoning for homework and plans', 'Chat history saved on this device'],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 500,
    rank: 1,
    role: 'ultra',
    engine: env.VITE_MODEL_ULTRA || 'gemini-2.5-flash',
    blurb: 'Create images and understand the pictures you upload.',
    features: ['Everything in Plus', 'Image generation', 'Vision: upload photos and PDFs to analyze', 'Priority replies'],
  },
  {
    id: 'opus',
    name: 'Opus',
    price: 950,
    rank: 2,
    role: 'opus',
    engine: env.VITE_MODEL_OPUS || 'gemini-2.5-pro',
    blurb: 'Our deepest thinking model, plus video creation.',
    features: ['Everything in Ultra', 'Video generation (Veo)', 'Advanced reasoning and coding', 'Long documents'],
  },
  {
    id: 'opus_ultra',
    name: 'Opus Ultra',
    price: 1500,
    rank: 3,
    role: 'opus_ultra',
    engine: env.VITE_MODEL_OPUS_ULTRA || 'gemini-2.5-pro',
    blurb: 'Everything in Lumina, including live camera help and offline use.',
    features: ['Everything in Opus', 'Live Vision camera', 'Offline app cache (AI replies still need internet)', 'Early access to new features'],
  },
];

export const modelById = (id) => MODELS.find((m) => m.id === id) || MODELS[1];
export const PAID_MODELS = MODELS.filter((m) => m.price > 0);
export const IMAGE_MODEL = env.VITE_GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
export const LIVE_MODEL = env.VITE_GEMINI_LIVE_MODEL || 'gemini-2.5-flash';

export const ROLE_RANK = { free: 0, ultra: 1, opus: 2, opus_ultra: 3, admin: 99 };
export const roleRank = (user) => ROLE_RANK[user?.role] ?? 0;
export const roleLabel = (role) =>
  ({ free: 'Free', ultra: 'Ultra', opus: 'Opus', opus_ultra: 'Opus Ultra', admin: 'Admin' }[role] || 'Free');

export const canUseModel = (user, model) => model.rank <= roleRank(user);

/** Feature gates. Checked against the account role before any image / video / vision action. */
export const FEATURES = {
  vision: { minRank: 1, plan: 'ultra', label: 'Vision (analyzing images and PDFs)' },
  image: { minRank: 1, plan: 'ultra', label: 'Image generation' },
  video: { minRank: 2, plan: 'opus', label: 'Video generation' },
  live: { minRank: 3, plan: 'opus_ultra', label: 'Live Vision' },
  offline: { minRank: 3, plan: 'opus_ultra', label: 'Offline mode' },
};

export function checkFeature(user, feature) {
  const f = FEATURES[feature];
  if (roleRank(user) >= f.minRank) return { ok: true };
  const plan = modelById(f.plan);
  return {
    ok: false,
    plan: plan.id,
    message: `${f.label} is part of ${plan.name} (${naira(plan.price)}). Upgrade to unlock it.`,
  };
}
