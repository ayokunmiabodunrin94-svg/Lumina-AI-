import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const colors = { success: 'text-[#81c995]', error: 'text-[#f28b82]', info: 'text-[#8ab4f8]' };

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[120] flex flex-col items-center gap-2 w-[min(92vw,420px)] pointer-events-none" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <button
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto w-full flex items-start gap-3 text-left rounded-2xl bg-[#303134] text-white px-4 py-3 text-sm shadow-sheet pop-in"
          >
            <Icon size={18} className={`${colors[t.type]} mt-0.5 shrink-0`} />
            <span className="leading-snug">{t.message}</span>
          </button>
        );
      })}
    </div>
  );
}
