import { CreditCard, Gem, LogOut, Mail, Plus, Search, Settings, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { roleLabel } from '../lib/models.js';
import { getEmails } from '../lib/storage.js';
import { Badge, Footer, UserAvatar, iconBtn } from './ui.jsx';
import { useEscape } from '../lib/hooks.js';

export default function MenuDrawer() {
  const { menuOpen, setMenuOpen, user, isAdmin, newChat, go, setSearchOpen, logout, view } = useApp();
  useEscape(() => setMenuOpen(false), menuOpen);
  if (!menuOpen || !user) return null;

  const unread = isAdmin ? getEmails().filter((e) => !e.read).length : 0;
  const items = [
    { icon: Plus, label: 'New Chat', onClick: newChat },
    { icon: Search, label: 'Search Chats', onClick: () => { setMenuOpen(false); setSearchOpen(true); } },
    { icon: Settings, label: 'Settings', onClick: () => go('settings'), active: view === 'settings' },
    isAdmin && { icon: Mail, label: 'Emails', onClick: () => go('emails'), active: view === 'emails', badge: unread },
    { icon: Gem, label: 'Lumina AI Models', onClick: () => go('models'), active: view === 'models' },
    isAdmin && { icon: CreditCard, label: 'Payment Menu', onClick: () => go('admin'), active: view === 'admin' },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[70] fade-in" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
      <aside className="absolute right-0 top-0 bottom-0 w-[320px] max-w-[88vw] bg-surface text-ink flex flex-col shadow-sheet slide-left">
        <div className="h-14 shrink-0 flex items-center justify-between px-4">
          <span className="text-lg font-semibold text-gradient-brand">Lumina AI</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className={`${iconBtn} -mr-2`}><X size={20} /></button>
        </div>

        <div className="mx-3 mb-3 rounded-2xl bg-field p-3 flex items-center gap-3">
          <UserAvatar name={user.name} size={40} />
          <div className="min-w-0">
            <div className="font-medium truncate">{user.name}</div>
            <div className="text-xs text-muted truncate">{user.email}</div>
          </div>
          <div className="ml-auto shrink-0"><Badge tone={isAdmin ? 'warn' : 'brand'}>{roleLabel(user.role)}</Badge></div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          {items.map(({ icon: Icon, label, onClick, active, badge }) => (
            <button
              key={label}
              onClick={onClick}
              className={`w-full h-12 rounded-full px-4 flex items-center gap-4 text-[15px] hover:bg-hover transition-colors ${active ? 'bg-field font-medium' : ''}`}
            >
              <Icon size={20} className="text-muted" />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#d93025] text-white text-xs flex items-center justify-center">{badge}</span>}
            </button>
          ))}
          <div className="my-2 mx-4 border-t border-line" />
          <button onClick={logout} className="w-full h-12 rounded-full px-4 flex items-center gap-4 text-[15px] hover:bg-hover transition-colors">
            <LogOut size={20} className="text-muted" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </nav>
        <Footer className="py-4" />
      </aside>
    </div>
  );
}
