import { PanelLeftClose, PanelLeftOpen, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Footer, iconBtn } from './ui.jsx';

function NewChatPill({ collapsed }) {
  const { newChat } = useApp();
  if (collapsed) {
    return (
      <button onClick={newChat} aria-label="New chat" title="New chat" className="h-11 w-11 rounded-full bg-field hover:bg-hover flex items-center justify-center mx-auto">
        <Plus size={22} />
      </button>
    );
  }
  return (
    <button onClick={newChat} className="h-12 w-full max-w-[200px] rounded-full bg-field hover:bg-hover px-4 flex items-center gap-3 text-[15px] font-medium transition-colors">
      <Plus size={20} />
      New chat
    </button>
  );
}

function ChatList() {
  const { chats, activeId, openChat, deleteChat } = useApp();
  return (
    <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-2" aria-label="Recent chats">
      <h2 className="px-3 py-2 text-sm font-medium">Recent</h2>
      {chats.length === 0 && <p className="px-3 text-sm text-muted">Your chats will show up here.</p>}
      <ul className="space-y-0.5">
        {chats.map((c) => (
          <li key={c.id} className="group relative">
            <button
              onClick={() => openChat(c.id)}
              className={`w-full text-left h-10 rounded-full pl-4 pr-10 text-sm truncate transition-colors ${
                c.id === activeId ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#1f3760] dark:text-[#d3e3fd]' : 'hover:bg-hover'
              }`}
            >
              {c.title}
            </button>
            <button
              onClick={() => deleteChat(c.id)}
              aria-label={`Delete chat ${c.title}`}
              className="absolute right-1 top-1 h-8 w-8 rounded-full flex items-center justify-center text-muted hover:bg-hover lg:opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Sidebar() {
  const { isDesktop, sidebarOpen, setSidebarOpen } = useApp();

  if (!isDesktop) {
    if (!sidebarOpen) return null;
    return (
      <div className="fixed inset-0 z-40 fade-in">
        <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
        <aside className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[86vw] bg-app flex flex-col slide-right shadow-sheet">
          <div className="h-14 flex items-center justify-between px-2 shrink-0">
            <span className="pl-3 text-lg font-semibold text-gradient-brand">Lumina AI</span>
            <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" className={iconBtn}><X size={20} /></button>
          </div>
          <div className="px-3 pb-3"><NewChatPill /></div>
          <ChatList />
          <Footer className="py-3" />
        </aside>
      </div>
    );
  }

  return (
    <aside className={`${sidebarOpen ? 'w-[288px]' : 'w-[68px]'} shrink-0 bg-app flex flex-col overflow-hidden transition-[width] duration-200`}>
      <div className={`flex ${sidebarOpen ? 'justify-end pr-2' : 'justify-center'} pb-2`}>
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={iconBtn}
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>
      <div className={sidebarOpen ? 'px-3 pb-3' : 'pb-3'}><NewChatPill collapsed={!sidebarOpen} /></div>
      {sidebarOpen ? <ChatList /> : <div className="flex-1" />}
      {sidebarOpen && <Footer className="py-3" />}
    </aside>
  );
}
