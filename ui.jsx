import { useEffect } from 'react';
import { X } from 'lucide-react';
import { FOOTER_TEXT, LOGO_TILE } from '../lib/constants.js';
import { useApp } from '../context/AppContext.jsx';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-medium bg-[#0b57d0] text-white hover:bg-[#0a4cb8] dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#c2d7fb] disabled:opacity-50 transition-colors';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-medium bg-field text-ink border border-line hover:bg-hover disabled:opacity-50 transition-colors';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-medium bg-[#d93025] text-white hover:bg-[#b3261e] disabled:opacity-50 transition-colors';
export const inputCls =
  'w-full h-12 rounded-xl bg-field border border-transparent px-4 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-accent';
export const iconBtn =
  'inline-flex items-center justify-center h-10 w-10 rounded-full text-ink hover:bg-hover transition-colors disabled:opacity-40';

export function Footer({ className = '' }) {
  return <p className={`text-center text-xs text-muted ${className}`}>{FOOTER_TEXT}</p>;
}

export function LogoTile({ size = 32, className = '' }) {
  return (
    <img
      src={LOGO_TILE}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.24) }}
      className={`shrink-0 ${className}`}
    />
  );
}

/** The four-point Lumina star in the brand gradient — used as the AI avatar. */
export function SparkIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="luminaStar" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8ab4f8" />
          <stop offset="1" stopColor="#c58af9" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5c.7 5.9 4.6 9.8 10.5 10.5-5.9.7-9.8 4.6-10.5 10.5C11.3 16.6 7.4 12.7 1.5 12 7.4 11.3 11.3 7.4 12 1.5z"
        fill="url(#luminaStar)"
      />
    </svg>
  );
}

export function UserAvatar({ name = '?', size = 30 }) {
  const initial = (name.trim()[0] || '?').toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="shrink-0 rounded-full bg-lumina-gradient-diag text-white font-semibold flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-field text-muted',
    brand: 'bg-[#e8f0fe] text-[#1a56c4] dark:bg-[#1f3760] dark:text-[#a8c7fa]',
    good: 'bg-[#e6f4ea] text-[#137333] dark:bg-[#10341d] dark:text-[#81c995]',
    warn: 'bg-[#fef7e0] text-[#8a5a00] dark:bg-[#3b2f0b] dark:text-[#fdd663]',
    bad: 'bg-[#fce8e6] text-[#b3261e] dark:bg-[#3c1512] dark:text-[#f28b82]',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center fade-in" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[88dvh] overflow-y-auto bg-surface text-ink rounded-t-[28px] sm:rounded-[28px] shadow-sheet p-5 sm:p-6 pop-in`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold leading-snug">{title}</h2>
          <button onClick={onClose} aria-label="Close" className={`${iconBtn} -mt-1 -mr-2 shrink-0`}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Wrapper for full-page views (Settings, Models, Payment…). */
export function PageShell({ title, subtitle, children }) {
  const { newChat } = useApp();
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-10 min-h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="text-muted mt-1 text-[15px]">{subtitle}</p>}
          </div>
          <button onClick={newChat} aria-label="Back to chat" className={`${iconBtn} shrink-0`}>
            <X size={22} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
        <Footer className="mt-10" />
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#0b57d0] dark:bg-[#a8c7fa]' : 'bg-[#c4c7c5] dark:bg-[#444746]'}`}
    >
      <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}
