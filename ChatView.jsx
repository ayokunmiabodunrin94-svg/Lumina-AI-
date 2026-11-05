import { useEffect, useRef, useState } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { GeminiError, generateImage, generateVideo, hasKey, streamChat, toGeminiHistory, userParts } from '../lib/gemini.js';
import { checkFeature } from '../lib/models.js';
import { speak, stopSpeaking } from '../lib/speech.js';
import { uid } from '../lib/storage.js';
import { FOOTER_TEXT } from '../lib/constants.js';
import EmptyState from './EmptyState.jsx';
import Composer from './Composer.jsx';
import Message from './Message.jsx';
import Markdown from './Markdown.jsx';
import { SparkIcon } from './ui.jsx';

const titleFrom = (t) => t.replace(/\s+/g, ' ').trim().slice(0, 40);

function friendly(e, mode) {
  if (e instanceof GeminiError) return e.message;
  if (e?.name === 'TypeError' && /fetch|network/i.test(e.message)) return "Can't reach Gemini. Check your internet connection and try again.";
  if (mode === 'video') return 'The video did not finish. Veo needs a Gemini API key with billing enabled — check your key and try again.';
  return e?.message || 'Something went wrong. Please try again.';
}

function Pending({ kind, startedAt }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  if (kind === 'video') {
    return (
      <div className="mt-2 max-w-[640px]">
        <div className="shimmer w-full aspect-video" style={{ borderRadius: 16 }} />
        <p className="mt-2 text-sm text-muted">Creating your video… {secs}s. This usually takes 1–3 minutes — keep this tab open.</p>
      </div>
    );
  }
  if (kind === 'image') {
    return (
      <div className="mt-2">
        <div className="shimmer w-full max-w-sm aspect-square" style={{ borderRadius: 16 }} />
        <p className="mt-2 text-sm text-muted">Creating your image…</p>
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2.5 max-w-xl" aria-label="Lumina is thinking">
      <div className="shimmer h-4 w-full" />
      <div className="shimmer h-4 w-[88%]" />
      <div className="shimmer h-4 w-[62%]" />
    </div>
  );
}

export default function ChatView() {
  const app = useApp();
  const { user, activeChat, model, settings, toast, createChat, patchChat, upgradeNudge, online } = app;

  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState(null); // null | 'image' | 'video'
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState(null); // { kind, startedAt }
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState(null);

  const composerRef = useRef(null);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const reqRef = useRef(null);
  const voiceRef = useRef(false);
  const stickRef = useRef(true);

  const messages = activeChat?.messages || [];

  // switching chats detaches any running request (its result is still saved to its own chat)
  useEffect(() => {
    abortRef.current?.abort();
    reqRef.current = null;
    setBusy(null);
    setStreamText('');
    setError(null);
    stickRef.current = true;
  }, [activeChat?.id]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, streamText, busy, error]);

  function onScroll() {
    const el = scrollRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  }

  function toggleMode(kind) {
    if (mode === kind) {
      setMode(null);
      return;
    }
    const check = checkFeature(user, kind);
    if (!check.ok) {
      upgradeNudge(check);
      return;
    }
    setMode(kind);
    composerRef.current?.focus();
  }

  function pickCard(id) {
    if (id === 'image' || id === 'video') return toggleModeOn(id);
    setDraft(id === 'write' ? 'Help me write ' : 'Plan with me: ');
    setTimeout(() => composerRef.current?.focus(), 0);
    return undefined;
  }
  function toggleModeOn(kind) {
    const check = checkFeature(user, kind);
    if (!check.ok) return upgradeNudge(check);
    setMode(kind);
    setTimeout(() => composerRef.current?.focus(), 0);
    return undefined;
  }

  async function generate(req) {
    const reqId = uid();
    reqRef.current = reqId;
    const live = () => reqRef.current === reqId;
    const ac = new AbortController();
    abortRef.current = ac;
    let partial = '';
    setError(null);
    setStreamText('');
    setBusy({ kind: req.mode || 'text', startedAt: Date.now() });
    stickRef.current = true;

    const addModelMessage = (msg) =>
      patchChat(req.chatId, (c) => ({ ...c, messages: [...c.messages, { id: uid(), role: 'model', createdAt: Date.now(), ...msg }] }));

    try {
      if (req.mode === 'image') {
        const r = await generateImage(req.text, ac.signal);
        addModelMessage({ text: r.text, media: r.images.map((src) => ({ type: 'image', src })) });
      } else if (req.mode === 'video') {
        const src = await generateVideo(req.text);
        addModelMessage({ text: '', media: [{ type: 'video', src }] });
      } else {
        const contents = [...req.history, { role: 'user', parts: userParts(req.text, req.attachments) }];
        const text = await streamChat({
          engine: req.engine,
          contents,
          signal: ac.signal,
          onToken: (t) => {
            partial = t;
            if (live()) setStreamText(t);
          },
        });
        addModelMessage({ text });
        if (live() && (voiceRef.current || settings.speakReplies)) speak(text);
      }
    } catch (e) {
      if (e?.name === 'AbortError') {
        if (partial) addModelMessage({ text: partial });
      } else if (live()) {
        const message = friendly(e, req.mode);
        setError({ message, req });
        toast(message, 'error');
      }
    } finally {
      if (live()) {
        setBusy(null);
        setStreamText('');
        abortRef.current = null;
        voiceRef.current = false;
      }
    }
  }

  function send() {
    const text = draft.trim();
    if (busy || (!text && attachments.length === 0)) return;
    if (!online) return toast("You're offline. Connect to the internet to chat with Lumina.", 'error');
    if (!hasKey()) return toast('Add your Gemini key as VITE_GEMINI_API_KEY in .env, then restart the app.', 'error');

    // role checks before any vision / image / video work
    if (attachments.some((a) => a.kind === 'image' || a.kind === 'pdf')) {
      const c = checkFeature(user, 'vision');
      if (!c.ok) return upgradeNudge(c);
    }
    if (mode) {
      const c = checkFeature(user, mode);
      if (!c.ok) return upgradeNudge(c);
      if (!text) return toast(`Describe the ${mode} you want first.`, 'info');
    }

    stopSpeaking();
    const history = toGeminiHistory(messages);
    const chatId = activeChat?.id || createChat(titleFrom(text || attachments[0]?.name || 'New chat'), model.id);
    const sent = attachments;
    const userMsg = {
      id: uid(),
      role: 'user',
      text,
      mode,
      attachments: sent.map((a) => ({ name: a.name, kind: a.kind, preview: a.preview || null })),
      createdAt: Date.now(),
    };
    patchChat(chatId, (c) => ({ ...c, messages: [...c.messages, userMsg] }));
    setDraft('');
    setAttachments([]);
    setMode(null);
    return generate({ chatId, mode, text, attachments: sent, history, engine: model.engine });
  }

  function stop() {
    abortRef.current?.abort();
    if (busy?.kind === 'video') {
      reqRef.current = null;
      setBusy(null);
      toast("Stopped waiting. If the video finishes, it will be added to this chat.", 'info');
    }
  }

  const empty = messages.length === 0 && !busy;

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto">
        {empty ? (
          <EmptyState onPick={pickCard} />
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
            {messages.map((m) => <Message key={m.id} message={m} userName={user.name} />)}

            {busy && (
              <article className="flex gap-3 sm:gap-4 py-4">
                <div className="shrink-0 mt-0.5"><SparkIcon size={30} /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted mb-1">Lumina AI</div>
                  {streamText ? <Markdown text={streamText} /> : <Pending kind={busy.kind} startedAt={busy.startedAt} />}
                </div>
              </article>
            )}

            {error && !busy && (
              <div className="my-3 rounded-2xl bg-[#fce8e6] text-[#b3261e] dark:bg-[#3c1512] dark:text-[#f28b82] px-4 py-3 flex items-start gap-3 text-sm">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="flex-1">{error.message}</span>
                <button
                  onClick={() => generate(error.req)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-8 font-medium bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20"
                >
                  <RotateCw size={14} /> Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 sm:px-6 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] bg-surface">
        <div className="max-w-3xl mx-auto w-full">
          <Composer
            ref={composerRef}
            draft={draft}
            setDraft={setDraft}
            mode={mode}
            onToggleMode={toggleMode}
            attachments={attachments}
            setAttachments={setAttachments}
            busy={!!busy}
            onSend={send}
            onStop={stop}
            voiceRef={voiceRef}
          />
          <p className="text-center text-[11px] text-muted mt-2">Lumina AI can make mistakes. · {FOOTER_TEXT}</p>
        </div>
      </div>
    </div>
  );
}
