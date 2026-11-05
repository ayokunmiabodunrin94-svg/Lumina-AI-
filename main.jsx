import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hold the Lumina AI splash for a moment, then fade it out to reveal the app.
const boot = document.getElementById('boot');
if (boot) {
  const MIN_VISIBLE_MS = 1700;
  const wait = Math.max(0, MIN_VISIBLE_MS - performance.now());
  setTimeout(() => {
    boot.classList.add('boot-hide');
    setTimeout(() => boot.remove(), 500);
  }, wait);
}

// Service worker (installable PWA; offline cache only switches on for Opus Ultra).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
