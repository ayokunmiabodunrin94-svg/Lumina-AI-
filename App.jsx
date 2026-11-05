import { WifiOff } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import MenuDrawer from './components/MenuDrawer.jsx';
import SearchModal from './components/SearchModal.jsx';
import Toasts from './components/Toasts.jsx';
import LiveVision from './components/LiveVision.jsx';
import ChatView from './components/ChatView.jsx';
import AuthPage from './pages/AuthPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ModelsPage from './pages/ModelsPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import AdminPaymentsPage from './pages/AdminPaymentsPage.jsx';
import EmailsPage from './pages/EmailsPage.jsx';

const PAGES = {
  chat: ChatView,
  settings: SettingsPage,
  models: ModelsPage,
  payment: PaymentPage,
  admin: AdminPaymentsPage,
  emails: EmailsPage,
};

function Shell() {
  const { user, view, online, liveOpen } = useApp();

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toasts />
      </>
    );
  }

  const Page = PAGES[view] || ChatView;
  return (
    <div className="app-h flex flex-col bg-app text-ink">
      {!online && (
        <div className="shrink-0 flex items-center justify-center gap-2 bg-[#fef7e0] text-[#7a5200] text-sm py-1.5 px-3" role="status">
          <WifiOff size={15} /> You're offline. Saved chats still open, but Lumina needs internet to reply.
        </div>
      )}
      <TopBar />
      <div className="flex-1 min-h-0 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-surface rounded-t-[24px] overflow-hidden">
          <Page />
        </main>
      </div>
      <MenuDrawer />
      <SearchModal />
      {liveOpen && <LiveVision />}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
