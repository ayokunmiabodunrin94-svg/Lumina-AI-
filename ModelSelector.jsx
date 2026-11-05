import { useRef, useState } from 'react';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { MODELS, canUseModel } from '../lib/models.js';
import { naira } from '../lib/constants.js';
import { useClickOutside, useEscape } from '../lib/hooks.js';

export default function ModelSelector() {
  const { user, model, updateSettings, go, toast } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  useEscape(() => setOpen(false), open);

  function pick(m) {
    if (!canUseModel(user, m)) {
      setOpen(false);
      toast(`${m.name} costs ${naira(m.price)}. Upgrade to use it.`, 'info');
      go('payment', { plan: m.id });
      return;
    }
    updateSettings({ model: m.id });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-10 inline-flex items-center gap-1.5 rounded-full px-4 text-[15px] font-medium bg-field hover:bg-hover transition-colors whitespace-nowrap"
      >
        {model.name}
        <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-[min(92vw,340px)] rounded-3xl bg-surface border border-line shadow-sheet p-2 pop-in"
        >
          {MODELS.map((m) => {
            const owned = canUseModel(user, m);
            const selected = m.id === model.id;
            return (
              <button
                key={m.id}
                role="option"
                aria-selected={selected}
                onClick={() => pick(m)}
                className={`w-full text-left rounded-2xl px-3.5 py-2.5 flex items-center gap-3 hover:bg-hover ${selected ? 'bg-field' : ''}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{m.name}</span>
                  <span className="block text-xs text-muted truncate">{m.blurb}</span>
                </span>
                {owned ? (
                  selected ? <Check size={18} className="text-accent shrink-0" /> : <span className="text-xs text-muted shrink-0">{m.price ? 'Unlocked' : 'Free'}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted shrink-0">
                    <Lock size={13} /> {naira(m.price)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
