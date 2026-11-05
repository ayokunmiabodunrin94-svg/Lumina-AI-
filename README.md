# Lumina AI — Light Up Your Ideas

A Gemini-style chat app built with React, Vite and Tailwind. Created by Lumina Studio.

## Run it

```bash
npm install
cp .env.example .env     # then fill it in
npm run dev
```

`.env`

| Variable | What it does |
| --- | --- |
| `VITE_GEMINI_API_KEY` | Your Gemini API key (text, image, vision and Veo video) |
| `VITE_MODEL_*`, `VITE_GEMINI_IMAGE_MODEL`, `VITE_GEMINI_LIVE_MODEL` | Optional model overrides |

`.env` is git-ignored. Add the same variables in your host's dashboard (Vercel, Netlify…) before deploying.

## Deploy

- **Vercel / Netlify**: import the GitHub repo, build command `npm run build`, output folder `dist`.
- **GitHub Pages (sub-path)**: build with `VITE_BASE=/your-repo/ npm run build`.
- The service worker only registers in production builds and needs https (localhost works for testing).

## Owner account

Only `ayokunmiabodunrin94@gmail.com` is admin: all features free, Payment Menu and Emails unlocked, no password prompt. Every other account must pay for Ultra, Opus or Opus Ultra. Change `OWNER_EMAIL` in `src/lib/constants.js` to use another email.

## Plans and what they unlock

| Model | Price | Unlocks |
| --- | --- | --- |
| Pro | Free | Text chat, voice, text/code files |
| Plus | Free | Stronger text model |
| Ultra | ₦500 | Image generation, Vision (image / PDF upload) |
| Opus | ₦950 | + Video generation (Veo 2) |
| Opus Ultra | ₦1500 | + Live Vision camera, offline app cache |

Gates live in `src/lib/models.js` (`FEATURES`) and are checked before every image / video / vision action.

## Project map

```
public/            sw.js, manifest, logo + PWA icons
src/lib/           storage.js (all localStorage), auth.js, gemini.js (incl. generateVideo), models.js, speech.js
src/context/       AppContext.jsx (user, chats, settings, navigation, toasts)
src/components/    TopBar, ModelSelector, Sidebar, MenuDrawer, ChatView, Composer, Message, LiveVision…
src/pages/         Auth, Settings, Models, Payment, AdminPayments, Emails
```

localStorage keys: `lumina_chats`, `lumina_users`, `lumina_payments`, `lumina_emails`, `lumina_session`, `lumina_settings`.

## Important limits of the localStorage version

- Data lives in each visitor's own browser. A payment submitted on a customer's phone is **not visible** to the admin on another device, so approvals only work on the same browser. Move `src/lib/storage.js` to Firebase/Firestore (users, payments, emails) before taking real payments.
- Every `VITE_*` variable is bundled into the public JavaScript, including the Gemini key. Restrict the Gemini key to your domain in Google AI Studio / Cloud Console, and the owner-email check is client-side, so it is a convenience, not real security. Real protection needs a backend.
- Generated videos are blob URLs and are not saved after the page closes; generated images are saved until browser storage fills up.
