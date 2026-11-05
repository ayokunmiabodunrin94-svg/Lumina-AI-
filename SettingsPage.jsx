import { useState } from 'react';
import { ChevronRight, Download, Moon, Search, Send, Sun, Trash2, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Badge, Modal, PageShell, Toggle, UserAvatar, btnDanger, btnPrimary, btnSecondary, inputCls } from '../components/ui.jsx';
import { updateUser } from '../lib/auth.js';
import { pushEmail } from '../lib/storage.js';
import { roleLabel } from '../lib/models.js';
import { ttsSupported } from '../lib/speech.js';

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-medium text-muted mb-2 px-1">{title}</h2>
      <div className="rounded-3xl bg-field p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, hint, onClick, right }) {
  const body = (
    <>
      <Icon size={20} className="text-muted shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      {right ?? <ChevronRight size={18} className="text-muted shrink-0" />}
    </>
  );
  // rows that hold their own control (like a switch) must not be wrapped in a button
  if (right) return <div className="w-full flex items-center gap-4 min-h-[48px]">{body}</div>;
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 text-left min-h-[48px]">
      {body}
    </button>
  );
}

export default function SettingsPage() {
  const { user, refreshUser, settings, updateSettings, setSearchOpen, installApp, clearMyChats, toast, go, chats } = useApp();
  const [name, setName] = useState(user.name);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState('');

  function saveName() {
    const clean = name.trim();
    if (clean.length < 2) return toast('Enter your full name.', 'error');
    updateUser(user.id, { name: clean });
    refreshUser();
    toast('Profile saved.', 'success');
  }

  function sendMessage() {
    if (message.trim().length < 3) return toast('Write a short message first.', 'info');
    pushEmail({ type: 'contact', from: user.email, subject: `Message from ${user.name}`, body: message.trim() });
    setMessage('');
    toast('Message sent to Lumina Studio.', 'success');
  }

  return (
    <PageShell title="Settings">
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <UserAvatar name={user.name} size={48} />
          <div className="min-w-0">
            <div className="text-sm text-muted truncate">{user.email}</div>
            <div className="mt-1"><Badge tone={user.role === 'admin' ? 'warn' : 'brand'}>{roleLabel(user.role)} plan</Badge></div>
          </div>
        </div>
        <label htmlFor="pname" className="block text-sm font-medium mb-1.5">Full name</label>
        <div className="flex gap-2">
          <input id="pname" className={`${inputCls} bg-surface`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <button onClick={saveName} disabled={name.trim() === user.name} className={btnPrimary}>Save</button>
        </div>
        {user.role === 'free' && (
          <button onClick={() => go('models')} className={`${btnSecondary} mt-4 w-full`}>See upgrade options</button>
        )}
      </Section>

      <Section title="Appearance">
        <div className="flex p-1 rounded-full bg-surface" role="radiogroup" aria-label="Theme">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="radio"
              aria-checked={settings.theme === id}
              onClick={() => updateSettings({ theme: id })}
              className={`flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-colors ${settings.theme === id ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#1f3760] dark:text-[#d3e3fd]' : 'text-muted hover:text-ink'}`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Chats and voice">
        <div className="space-y-2">
          <Row icon={Search} label="Search chats" hint={`${chats.length} saved on this device`} onClick={() => setSearchOpen(true)} />
          {ttsSupported() && (
            <Row
              icon={Volume2}
              label="Read replies aloud"
              hint="Lumina speaks every answer. Voice questions are always spoken back."
              onClick={() => updateSettings({ speakReplies: !settings.speakReplies })}
              right={<Toggle checked={settings.speakReplies} onChange={(v) => updateSettings({ speakReplies: v })} label="Read replies aloud" />}
            />
          )}
          <Row icon={Download} label="Install Lumina AI" hint="Add the app to your home screen or desktop." onClick={installApp} />
          <Row
            icon={Trash2}
            label="Clear chats"
            hint="Delete all your saved chats from this device."
            onClick={() => (chats.length ? setConfirmClear(true) : toast('You have no chats to clear.', 'info'))}
          />
        </div>
      </Section>

      <Section title="Contact Lumina Studio">
        <label htmlFor="msg" className="block text-sm font-medium mb-1.5">Questions about a payment or your plan?</label>
        <textarea id="msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message" className="w-full rounded-2xl bg-surface px-4 py-3 text-[15px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#8ab4f8] resize-none" />
        <button onClick={sendMessage} className={`${btnSecondary} mt-3`}><Send size={16} /> Send message</button>
      </Section>

      {confirmClear && (
        <Modal title="Clear all chats?" onClose={() => setConfirmClear(false)}>
          <p className="text-muted text-[15px]">This removes {chats.length} chat{chats.length === 1 ? '' : 's'} from this device. It can't be undone.</p>
          <div className="mt-5 flex gap-2 justify-end">
            <button onClick={() => setConfirmClear(false)} className={btnSecondary}>Cancel</button>
            <button onClick={() => { clearMyChats(); setConfirmClear(false); toast('Chats cleared.', 'success'); }} className={btnDanger}>Clear chats</button>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
