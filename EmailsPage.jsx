import { useMemo, useState } from 'react';
import { CheckCheck, CreditCard, Mail, MessageSquare, Search, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PageShell, btnSecondary } from '../components/ui.jsx';
import { getEmails, saveEmails } from '../lib/storage.js';
import { timeAgo } from '../lib/hooks.js';

const ICONS = { signup: UserPlus, payment: CreditCard, contact: MessageSquare };

export default function EmailsPage() {
  const { isAdmin } = useApp();
  const [emails, setEmails] = useState(() => getEmails());
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return emails.filter((e) => !query || [e.subject, e.from, e.body].some((v) => v.toLowerCase().includes(query)));
  }, [emails, q]);

  if (!isAdmin) {
    return (
      <PageShell title="Emails">
        <p className="rounded-3xl bg-field p-6 text-center text-muted">The inbox is for admins only.</p>
      </PageShell>
    );
  }

  const persist = (next) => {
    saveEmails(next);
    setEmails(next);
  };
  const open = (id) => {
    setOpenId((cur) => (cur === id ? null : id));
    persist(emails.map((e) => (e.id === id ? { ...e, read: true } : e)));
  };
  const unread = emails.filter((e) => !e.read).length;

  return (
    <PageShell title="Emails" subtitle={unread ? `${unread} unread` : 'Signups, payments and messages from users.'}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search emails" aria-label="Search emails" className="w-full h-12 rounded-full bg-field pl-11 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]" />
        </div>
        <button onClick={() => persist(emails.map((e) => ({ ...e, read: true })))} disabled={!unread} aria-label="Mark all as read" title="Mark all as read" className={`${btnSecondary} px-4`}>
          <CheckCheck size={18} />
        </button>
      </div>

      {list.length === 0 && (
        <div className="rounded-3xl bg-field p-8 text-center text-muted">
          <Mail className="mx-auto mb-2" size={26} />
          {q ? `No emails match "${q}".` : 'Your inbox is empty.'}
        </div>
      )}

      <ul className="space-y-2">
        {list.map((e) => {
          const Icon = ICONS[e.type] || Mail;
          const expanded = openId === e.id;
          return (
            <li key={e.id} className="rounded-2xl bg-field">
              <button onClick={() => open(e.id)} aria-expanded={expanded} className="w-full text-left px-4 py-3 flex items-start gap-3">
                <span className="relative mt-0.5 shrink-0">
                  <Icon size={20} className="text-muted" />
                  {!e.read && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#1a73e8]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${e.read ? '' : 'font-semibold'}`}>{e.subject}</span>
                  <span className="block text-sm text-muted truncate">{e.from}</span>
                </span>
                <span className="text-xs text-muted shrink-0">{timeAgo(e.date)}</span>
              </button>
              {expanded && (
                <div className="px-4 pb-4 pl-[3.25rem]">
                  <p className="text-[15px] whitespace-pre-wrap break-words">{e.body}</p>
                  <button onClick={() => persist(emails.filter((x) => x.id !== e.id))} className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#d93025] dark:text-[#f28b82] hover:underline">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
