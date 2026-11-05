import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Modal } from './ui.jsx';
import { timeAgo } from '../lib/hooks.js';

function snippet(text, q) {
  const i = text.toLowerCase().indexOf(q);
  if (i === -1) return '';
  const start = Math.max(0, i - 28);
  return `${start > 0 ? '…' : ''}${text.slice(start, i + q.length + 56).replace(/\s+/g, ' ')}…`;
}

export default function SearchModal() {
  const { searchOpen, setSearchOpen, chats, openChat } = useApp();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return chats.slice(0, 12).map((c) => ({ chat: c, hint: '' }));
    const out = [];
    for (const c of chats) {
      const titleHit = c.title.toLowerCase().includes(query);
      const msg = c.messages.find((m) => (m.text || '').toLowerCase().includes(query));
      if (titleHit || msg) out.push({ chat: c, hint: msg ? snippet(msg.text, query) : '' });
    }
    return out;
  }, [q, chats]);

  if (!searchOpen) return null;
  return (
    <Modal title="Search chats" onClose={() => setSearchOpen(false)}>
      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles and messages"
          className="w-full h-12 rounded-full bg-field pl-11 pr-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
        />
      </div>
      <ul className="space-y-1 max-h-[50dvh] overflow-y-auto">
        {results.map(({ chat, hint }) => (
          <li key={chat.id}>
            <button onClick={() => openChat(chat.id)} className="w-full text-left rounded-2xl px-3 py-2.5 hover:bg-hover flex gap-3">
              <MessageSquare size={18} className="text-muted mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[15px] truncate">{chat.title}</span>
                <span className="block text-xs text-muted truncate">{hint || timeAgo(new Date(chat.updatedAt).toISOString())}</span>
              </span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{q ? `No chats match "${q}".` : 'No chats yet.'}</li>}
      </ul>
    </Modal>
  );
}
