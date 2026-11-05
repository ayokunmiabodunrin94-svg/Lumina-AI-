import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { KEYS } from '../lib/constants.js';
import { clearSession, getChats, getSessionId, getSettings, saveChats, saveSettings, uid } from '../lib/storage.js';
import { findUserById, login as doLoginApi, signup as doSignupApi } from '../lib/auth.js';
import { FEATURES, canUseModel, modelById, roleRank } from '../lib/models.js';
import { stopSpeaking } from '../lib/speech.js';
import { useMedia } from '../lib/hooks.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const isDesktop = useMedia('(min-width: 1024px)');

  const [user, setUser] = useState(() => {
    const id = getSessionId();
    return id ? findUserById(id) : null;
  });
  const [settings, setSettingsState] = useState(() => ({ theme: 'light', model: 'plus', speakReplies: false, ...getSettings() }));

  const [chats, setChats] = useState(() => getChats());
  const chatsRef = useRef(chats);
  const [activeId, setActiveId] = useState(null);

  const [view, setView] = useState('chat');
  const [viewParams, setViewParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [installEvt, setInstallEvt] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);

  /* ---------- toasts ---------- */
  const toast = useCallback((message, type = 'info') => {
    const id = uid();
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  /* ---------- settings / theme ---------- */
  const updateSettings = useCallback((patch) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'dark' ? '#131314' : '#f8f9fa');
  }, [settings.theme]);

  /* ---------- user / auth ---------- */
  const refreshUser = useCallback(() => {
    const id = getSessionId();
    setUser(id ? findUserById(id) : null);
  }, []);

  const signup = useCallback(async (data) => {
    const u = await doSignupApi(data);
    setUser(u);
    setActiveId(null);
    setView('chat');
    return u;
  }, []);

  const login = useCallback(async (data) => {
    const u = await doLoginApi(data);
    setUser(u);
    setActiveId(null);
    setView('chat');
    return u;
  }, []);

  const logout = useCallback(() => {
    stopSpeaking();
    clearSession();
    setUser(null);
    setActiveId(null);
    setView('chat');
    setMenuOpen(false);
    setSearchOpen(false);
    setLiveOpen(false);
  }, []);

  // pick up changes made in other tabs (e.g. admin approving a payment)
  useEffect(() => {
    const onStorage = () => {
      refreshUser();
      const fresh = getChats();
      chatsRef.current = fresh;
      setChats(fresh);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUser]);

  // keep the selected model within what the account owns
  useEffect(() => {
    if (user && !canUseModel(user, modelById(settings.model))) updateSettings({ model: 'plus' });
  }, [user, settings.model, updateSettings]);

  const isAdmin = user?.role === 'admin';

  /* ---------- online / install / offline cache ---------- */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const beforeInstall = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const installed = () => {
      setInstallEvt(null);
      toast('Lumina AI installed.', 'success');
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, [toast]);

  const installApp = useCallback(async () => {
    if (installEvt) {
      installEvt.prompt();
      await installEvt.userChoice.catch(() => {});
      setInstallEvt(null);
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
      toast('Lumina AI is already installed.', 'info');
    } else {
      toast('Use your browser menu → "Add to Home Screen" or "Install app".', 'info');
    }
  }, [installEvt, toast]);

  // Offline cache is enabled for Opus Ultra (and admin) accounts only. AI APIs are never cached.
  const offlineEnabled = !!user && roleRank(user) >= FEATURES.offline.minRank;
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        const urls = offlineEnabled
          ? performance.getEntriesByType('resource').map((r) => r.name).concat(window.location.href)
          : [];
        reg.active?.postMessage({ type: 'LUMINA_OFFLINE', enabled: offlineEnabled, urls });
      })
      .catch(() => {});
  }, [offlineEnabled, user?.id]);

  /* ---------- chats ---------- */
  const commit = useCallback(
    (updater) => {
      const next = updater(chatsRef.current);
      chatsRef.current = next;
      setChats(next);
      const r = saveChats(next);
      if (!r.ok) toast('Your device storage is full. Clear some chats in Settings.', 'error');
      else if (r.trimmed) toast('Storage is nearly full — older generated images were removed from saved chats.', 'info');
    },
    [toast]
  );

  const myChats = useMemo(
    () => chats.filter((c) => c.ownerId === user?.id).sort((a, b) => b.updatedAt - a.updatedAt),
    [chats, user?.id]
  );
  const activeChat = useMemo(() => myChats.find((c) => c.id === activeId) || null, [myChats, activeId]);

  const createChat = useCallback(
    (title, model) => {
      const chat = { id: uid(), ownerId: user.id, title: title.slice(0, 48) || 'New chat', model, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
      commit((prev) => [chat, ...prev]);
      setActiveId(chat.id);
      return chat.id;
    },
    [commit, user]
  );

  const patchChat = useCallback(
    (id, fn) => commit((prev) => prev.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c))),
    [commit]
  );

  const deleteChat = useCallback(
    (id) => {
      commit((prev) => prev.filter((c) => c.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
    },
    [commit]
  );

  const clearMyChats = useCallback(() => {
    commit((prev) => prev.filter((c) => c.ownerId !== user?.id));
    setActiveId(null);
    stopSpeaking();
  }, [commit, user?.id]);

  /* ---------- navigation ---------- */
  const closeSidebarIfMobile = useCallback(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) setSidebarOpen(false);
  }, []);

  const go = useCallback(
    (v, params = {}) => {
      setView(v);
      setViewParams(params);
      setMenuOpen(false);
      closeSidebarIfMobile();
    },
    [closeSidebarIfMobile]
  );

  const newChat = useCallback(() => {
    stopSpeaking();
    setActiveId(null);
    setView('chat');
    setMenuOpen(false);
    closeSidebarIfMobile();
  }, [closeSidebarIfMobile]);

  const openChat = useCallback(
    (id) => {
      stopSpeaking();
      setActiveId(id);
      setView('chat');
      setSearchOpen(false);
      setMenuOpen(false);
      closeSidebarIfMobile();
    },
    [closeSidebarIfMobile]
  );

  const upgradeNudge = useCallback(
    (check) => {
      toast(check.message, 'info');
      go('payment', { plan: check.plan });
    },
    [toast, go]
  );

  const value = {
    isDesktop,
    user, refreshUser, signup, login, logout, isAdmin,
    settings, updateSettings,
    model: modelById(settings.model),
    chats: myChats, activeChat, activeId, setActiveId,
    createChat, patchChat, deleteChat, clearMyChats,
    view, viewParams, go, newChat, openChat,
    sidebarOpen, setSidebarOpen, menuOpen, setMenuOpen, searchOpen, setSearchOpen, liveOpen, setLiveOpen,
    toasts, toast, dismissToast,
    installApp, canInstall: !!installEvt, online,
    upgradeNudge,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
