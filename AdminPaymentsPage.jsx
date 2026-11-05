import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Badge, Modal, PageShell, btnPrimary, btnSecondary } from '../components/ui.jsx';
import { ROLE_RANK, modelById } from '../lib/models.js';
import { naira } from '../lib/constants.js';
import { getPayments, getUsers, pushEmail, savePayments, saveUsers } from '../lib/storage.js';

const TONE = { pending: 'warn', approved: 'good', rejected: 'bad' };

export default function AdminPaymentsPage() {
  const { isAdmin, refreshUser, toast } = useApp();
  const [payments, setPayments] = useState(() => getPayments());
  const [filter, setFilter] = useState('pending');
  const [q, setQ] = useState('');
  const [zoom, setZoom] = useState(null);

  const counts = useMemo(() => ({
    all: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    approved: payments.filter((p) => p.status === 'approved').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  }), [payments]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return payments
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => !query || [p.email, p.sender, modelById(p.model).name].some((v) => v.toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payments, filter, q]);

  if (!isAdmin) {
    return (
      <PageShell title="Payment Menu">
        <p className="rounded-3xl bg-field p-6 text-center text-muted">This menu is for admins only.</p>
      </PageShell>
    );
  }
  function decide(p, status) {
    const all = getPayments();
    const idx = all.findIndex((x) => x.id === p.id);
    if (idx === -1) return;

    if (status === 'approved') {
      const users = getUsers();
      const ui = users.findIndex((u) => u.id === p.userId || u.email === p.email);
      if (ui === -1) return toast('That account no longer exists on this device.', 'error');
      const target = modelById(p.model);
      if (users[ui].role !== 'admin' && (ROLE_RANK[target.role] ?? 0) > (ROLE_RANK[users[ui].role] ?? 0)) {
        users[ui] = { ...users[ui], role: target.role };
        saveUsers(users);
      }
    }
    all[idx] = { ...all[idx], status, reviewedAt: new Date().toISOString() };
    savePayments(all);
    setPayments(all);
    pushEmail({
      type: 'payment',
      from: p.email,
      subject: `Payment ${status}: ${modelById(p.model).name}`,
      body: `${p.email} — ${modelById(p.model).name} (${naira(p.amount)}) was ${status}.`,
    });
    refreshUser();
    toast(status === 'approved' ? `Approved. ${p.email} now has ${modelById(p.model).name}.` : 'Payment rejected.', status === 'approved' ? 'success' : 'info');
    return undefined;
  }

  const chips = [
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
    ['all', 'All'],
  ];

  return (
    <PageShell title="Payment Menu" subtitle="Check the screenshot against your Opay balance, then approve or reject.">
      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, sender or model" aria-label="Search payments" className="w-full h-12 rounded-full bg-field pl-11 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]" />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
        {chips.map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`shrink-0 h-9 rounded-full px-4 text-sm font-medium transition-colors ${filter === id ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#1f3760] dark:text-[#d3e3fd]' : 'bg-field hover:bg-hover'}`}>
            {label} <span className="text-muted">{counts[id]}</span>
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="rounded-3xl bg-field p-6 text-center text-muted">No payments here yet.</p>}

      <ul className="space-y-3">
        {list.map((p) => (
          <li key={p.id} className="rounded-3xl bg-field p-4 flex gap-4">
            <button onClick={() => setZoom(p)} aria-label="View screenshot" className="shrink-0 h-24 w-20 rounded-2xl overflow-hidden bg-surface">
              <img src={p.screenshot} alt="Payment screenshot" className="h-full w-full object-cover" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium truncate">{p.email}</div>
                <Badge tone={TONE[p.status]}>{p.status[0].toUpperCase() + p.status.slice(1)}</Badge>
              </div>
              <dl className="mt-1 text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                <dt className="text-muted">Model</dt><dd>{modelById(p.model).name}</dd>
                <dt className="text-muted">Amount</dt><dd>{naira(p.amount)}</dd>
                <dt className="text-muted">Sender</dt><dd className="truncate">{p.sender}</dd>
                <dt className="text-muted">Date</dt><dd>{new Date(p.date).toLocaleString()}</dd>
              </dl>
              {p.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => decide(p, 'approved')} className={`${btnPrimary} h-10 px-4`}><Check size={16} /> Approve</button>
                  <button onClick={() => decide(p, 'rejected')} className={`${btnSecondary} h-10 px-4`}><X size={16} /> Reject</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {zoom && (
        <Modal title={`${zoom.sender} · ${naira(zoom.amount)}`} onClose={() => setZoom(null)} wide>
          <img src={zoom.screenshot} alt="Payment screenshot" style={{ borderRadius: 16 }} className="w-full h-auto max-h-[70dvh] object-contain bg-field" />
        </Modal>
      )}
    </PageShell>
  );
}
