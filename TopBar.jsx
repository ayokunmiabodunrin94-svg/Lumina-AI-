import { Menu } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { LogoTile, iconBtn } from './ui.jsx';
import ModelSelector from './ModelSelector.jsx';

export default function TopBar() {
  const { setSidebarOpen, setMenuOpen } = useApp();
  return (
    <header className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-4 bg-app">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle chat sidebar"
          className="inline-flex items-center gap-2 h-10 rounded-full pl-1 pr-2 sm:pr-3 hover:bg-hover transition-colors"
        >
          <LogoTile size={30} />
          <span className="hidden min-[430px]:inline text-[20px] font-semibold tracking-tight text-gradient-brand">Lumina AI</span>
        </button>
      </div>
      <ModelSelector />
      <div className="flex justify-end">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className={iconBtn}>
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}
