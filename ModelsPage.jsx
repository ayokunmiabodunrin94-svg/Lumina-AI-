import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Badge, PageShell, btnPrimary, btnSecondary } from '../components/ui.jsx';
import { MODELS, canUseModel } from '../lib/models.js';
import { naira } from '../lib/constants.js';

export default function ModelsPage() {
  const { user, model: current, updateSettings, go, toast, newChat } = useApp();

  function use(m) {
    updateSettings({ model: m.id });
    toast(`Switched to ${m.name}.`, 'success');
    newChat();
  }

  return (
    <PageShell title="Lumina AI Models" subtitle="Five models, powered by Gemini. Pick the one that fits what you're making.">
      <div className="grid gap-4 md:grid-cols-2">
        {MODELS.map((m) => {
          const owned = canUseModel(user, m);
          const selected = m.id === current.id;
          return (
            <article key={m.id} className={`rounded-3xl p-5 flex flex-col bg-field ${selected ? 'ring-2 ring-[#8ab4f8]' : ''} ${m.id === 'opus_ultra' ? 'md:col-span-2' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{m.name}</h2>
                  <p className="text-xs text-muted mt-0.5">Powered by {m.engine}</p>
                </div>
                <Badge tone={m.price ? 'brand' : 'good'}>{naira(m.price)}</Badge>
              </div>
              <p className="mt-3 text-[15px]">{m.blurb}</p>
              <ul className="mt-3 space-y-1.5 flex-1">
                {m.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-[#1e8e3e] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {selected ? (
                  <button disabled className={`${btnSecondary} w-full`}>Selected</button>
                ) : owned ? (
                  <button onClick={() => use(m)} className={`${btnSecondary} w-full`}>Use {m.name}</button>
                ) : (
                  <button onClick={() => go('payment', { plan: m.id })} className={`${btnPrimary} w-full`}>Upgrade for {naira(m.price)}</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
