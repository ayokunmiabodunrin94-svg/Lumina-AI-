import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ImagePlus, Loader2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Badge, PageShell, btnPrimary, inputCls } from '../components/ui.jsx';
import { PAID_MODELS, ROLE_RANK, modelById, roleRank } from '../lib/models.js';
import { OPAY, naira } from '../lib/constants.js';
import { compressImage, fileToDataUrl } from '../lib/files.js';
import { getPayments, pushEmail, savePayments, uid } from '../lib/storage.js';
import { timeAgo } from '../lib/hooks.js';

const STATUS = {
  pending: { tone: 'warn', label: 'Waiting for admin' },
  approved: { tone: 'good', label: 'Approved' },
  rejected: { tone: 'bad', label: 'Rejected' },
};

export default function PaymentPage() {
  const { user, viewParams, toast, refreshUser } = useApp();
  const [plan, setPlan] = useState(viewParams?.plan && modelById(viewParams.plan).price ? viewParams.plan : 'ultra');
  const [sender, setSender] = useState(user.name);
  const [shot, setShot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mine, setMine] = useState(() => getPayments().filter((p) => p.userId === user.id));
  const fileRef = useRef(null);

  const model = modelById(plan);

  // refresh status while this page is open (an admin may approve in another tab)
  useEffect(() => {
    const t = setInterval(() => {
      setMine(getPayments().filter((p) => p.userId === user.id));
      refreshUser();
    }, 4000);
    return () => clearInterval(t);
  }, [user.id, refreshUser]);

  async function pickShot(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Choose a screenshot image.', 'error');
    try {
      setShot(await compressImage(await fileToDataUrl(file), 1000, 0.7));
    } catch (e) {
      toast(e.message, 'error');
    }
    return undefined;
  }

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(OPAY.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(`Account number: ${OPAY.accountNumber}`, 'info');
    }
  }

  function submit(e) {
    e.preventDefault();
    if (sender.trim().length < 2) return toast('Enter the sender name on your Opay transfer.', 'error');
    if (!shot) return toast('Upload your payment screenshot.', 'error');
    setSaving(true);
    const payment = {
      id: uid(),
      userId: user.id,
      email: user.email,
      model: model.id,
      amount: model.price,
      screenshot: shot,
      sender: sender.trim(),
      date: new Date().toISOString(),
      status: 'pending',
    };
    const all = [payment, ...getPayments()];
    if (!savePayments(all)) {
      setSaving(false);
      return toast('Could not save — your device storage is full.', 'error');
    }
    pushEmail({
      type: 'payment',
      from: user.email,
      subject: `Payment: ${model.name} ${naira(model.price)}`,
      body: `${payment.sender} says they sent ${naira(model.price)} for ${model.name}. Open the Payment Menu to review.`,
    });
    setMine(all.filter((p) => p.userId === user.id));
    setShot(null);
    setSaving(false);
    toast('Submitted! Admin will verify within 10 minutes', 'success');
    return undefined;
  }

  const rank = roleRank(user);
  const already = rank >= ROLE_RANK[model.role];

  return (
    <PageShell title="Upgrade with Opay" subtitle="Send the exact amount, then upload your screenshot. An admin activates your plan after checking it.">
      <div className="grid grid-cols-3 gap-2 mb-5" role="radiogroup" aria-label="Choose a plan">
        {PAID_MODELS.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={plan === m.id}
            onClick={() => setPlan(m.id)}
            className={`rounded-2xl px-2 py-3 text-center transition-colors ${plan === m.id ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#1f3760] dark:text-[#d3e3fd] ring-2 ring-[#8ab4f8]' : 'bg-field hover:bg-hover'}`}
          >
            <span className="block text-sm font-semibold">{m.name}</span>
            <span className="block text-sm text-muted mt-0.5">{naira(m.price)}</span>
          </button>
        ))}
      </div>

      {already && (
        <p className="mb-4 rounded-2xl bg-[#e6f4ea] text-[#137333] dark:bg-[#10341d] dark:text-[#81c995] px-4 py-3 text-sm">
          Your account already includes {model.name}. You only need to pay if you want a higher plan.
        </p>
      )}

      <section className="rounded-3xl bg-field p-5 mb-5">
        <h2 className="text-sm font-medium text-muted">Send {naira(model.price)} to</h2>
        <dl className="mt-3 space-y-3">
          <div className="flex justify-between gap-3"><dt className="text-muted text-sm">Bank</dt><dd className="font-medium">{OPAY.bank}</dd></div>
          <div className="flex justify-between items-center gap-3">
            <dt className="text-muted text-sm">Account number</dt>
            <dd className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-wide">{OPAY.accountNumber}</span>
              <button onClick={copyAccount} aria-label="Copy account number" className="h-9 w-9 rounded-full bg-surface hover:bg-hover flex items-center justify-center">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </dd>
          </div>
          <div className="flex justify-between gap-3"><dt className="text-muted text-sm">Account name</dt><dd className="font-medium text-right">{OPAY.accountName}</dd></div>
        </dl>
      </section>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="sender" className="block text-sm font-medium mb-1.5">Sender name</label>
          <input id="sender" className={inputCls} value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Name on your Opay account" />
        </div>

        <div>
          <span className="block text-sm font-medium mb-1.5">Upload screenshot</span>
          {shot ? (
            <div className="relative inline-block">
              <img src={shot} alt="Payment screenshot preview" style={{ borderRadius: 16 }} className="max-h-64 w-auto max-w-full" />
              <button type="button" onClick={() => setShot(null)} aria-label="Remove screenshot" className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center"><X size={16} /></button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-32 rounded-2xl border-2 border-dashed border-line bg-field hover:bg-hover flex flex-col items-center justify-center gap-2 text-muted">
              <ImagePlus size={26} />
              <span className="text-sm">Tap to choose your payment screenshot</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pickShot(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        <button type="submit" disabled={saving} className={`${btnPrimary} w-full h-12 text-[15px]`}>
          {saving && <Loader2 size={18} className="animate-spin" />}
          I Have Paid
        </button>
      </form>

      {mine.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted mb-2 px-1">Your payments</h2>
          <ul className="space-y-2">
            {mine.map((p) => (
              <li key={p.id} className="rounded-2xl bg-field px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{modelById(p.model).name} · {naira(p.amount)}</div>
                  <div className="text-xs text-muted">{timeAgo(p.date)}</div>
                </div>
                <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
