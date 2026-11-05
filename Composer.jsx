import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArrowUp, Camera, FileText, Image as ImageIcon, Lock, Mic, Plus, Square, Upload, Video, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { checkFeature } from '../lib/models.js';
import { readAttachment } from '../lib/files.js';
import { sttSupported, startListening } from '../lib/speech.js';
import { useClickOutside } from '../lib/hooks.js';

const MAX_FILES = 4;
const ACCEPT = 'image/*,application/pdf,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.py,.html,.css,.java,.c,.cpp,.go,.rs,.rb,.php,.sql,.xml,.yml,.yaml,.sh';

const Composer = forwardRef(function Composer(
  { draft, setDraft, mode, onToggleMode, attachments, setAttachments, busy, onSend, onStop, voiceRef },
  ref
) {
  const { user, toast, upgradeNudge, setLiveOpen } = useApp();
  const textRef = useRef(null);
  const fileRef = useRef(null);
  const plusRef = useRef(null);
  const stopListenRef = useRef(null);
  const baseRef = useRef('');
  const [listening, setListening] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  useClickOutside(plusRef, () => setPlusOpen(false), plusOpen);

  useImperativeHandle(ref, () => ({ focus: () => textRef.current?.focus() }));

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [draft]);

  useEffect(() => () => stopListenRef.current?.(), []);

  function toggleMic() {
    if (listening) {
      stopListenRef.current?.();
      return;
    }
    if (!sttSupported()) {
      toast('Voice input is not supported in this browser. Try Chrome, Edge or Safari.', 'error');
      return;
    }
    baseRef.current = draft ? `${draft.trimEnd()} ` : '';
    setListening(true);
    stopListenRef.current = startListening({
      onResult: (text) => {
        voiceRef.current = true;
        setDraft(baseRef.current + text);
      },
      onEnd: () => setListening(false),
      onError: (code) => {
        if (code === 'not-allowed' || code === 'service-not-allowed') toast('Microphone permission is blocked. Allow it in your browser settings.', 'error');
        else if (code !== 'no-speech' && code !== 'aborted') toast(`Voice input stopped (${code}).`, 'error');
        setListening(false);
      },
    });
  }

  async function handleFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    const room = MAX_FILES - attachments.length;
    if (room <= 0) {
      toast(`You can attach up to ${MAX_FILES} files.`, 'info');
      return;
    }
    for (const file of files.slice(0, room)) {
      const needsVision = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (needsVision) {
        const check = checkFeature(user, 'vision');
        if (!check.ok) {
          upgradeNudge(check);
          return;
        }
      }
      try {
        const att = await readAttachment(file);
        setAttachments((prev) => [...prev, att]);
      } catch (e) {
        toast(e.message, 'error');
      }
    }
  }

  function openLive() {
    setPlusOpen(false);
    const check = checkFeature(user, 'live');
    if (!check.ok) return upgradeNudge(check);
    setLiveOpen(true);
    return undefined;
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault();
      onSend();
    }
  }

  const canSend = !!draft.trim() || attachments.length > 0;
  const placeholder = mode === 'image' ? 'Describe the image you want…' : mode === 'video' ? 'Describe the video you want…' : listening ? 'Listening…' : 'Ask Lumina AI';
  const toolBtn = (active) =>
    `h-10 w-10 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-[#d3e3fd] text-[#0b57d0] dark:bg-[#1f3760] dark:text-[#a8c7fa]' : 'text-ink hover:bg-hover'}`;

  return (
    <div className="w-full">
      {(mode || attachments.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {mode && (
            <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1.5 rounded-full bg-[#d3e3fd] text-[#0b57d0] dark:bg-[#1f3760] dark:text-[#a8c7fa] text-sm font-medium">
              {mode === 'image' ? <ImageIcon size={15} /> : <Video size={15} />}
              {mode === 'image' ? 'Create image' : 'Create video'}
              <button onClick={() => onToggleMode(mode)} aria-label="Turn off creation mode" className="h-5 w-5 rounded-full hover:bg-black/10 flex items-center justify-center"><X size={13} /></button>
            </span>
          )}
          {attachments.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-2 h-10 pl-1.5 pr-1.5 rounded-full bg-field text-sm max-w-[220px]">
              {a.preview ? <img src={a.preview} alt="" className="h-7 w-7 rounded-full object-cover" /> : <FileText size={16} className="ml-2 text-muted shrink-0" />}
              <span className="truncate">{a.name}</span>
              <button onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))} aria-label={`Remove ${a.name}`} className="h-6 w-6 rounded-full hover:bg-hover flex items-center justify-center shrink-0"><X size={14} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap sm:flex-nowrap items-end gap-x-1 rounded-[32px] min-h-[56px] bg-field shadow-pill px-2 py-1.5">
        <div className="order-2 sm:order-1 flex items-center gap-0.5 self-end">
          <div ref={plusRef} className="relative">
            <button onClick={() => setPlusOpen((o) => !o)} aria-label="Add" aria-expanded={plusOpen} className={toolBtn(plusOpen)}>
              <Plus size={22} className={`transition-transform ${plusOpen ? 'rotate-45' : ''}`} />
            </button>
            {plusOpen && (
              <div className="absolute bottom-12 left-0 z-30 w-60 rounded-2xl bg-surface border border-line shadow-sheet p-1.5 pop-in">
                <button onClick={() => { setPlusOpen(false); fileRef.current?.click(); }} className="w-full h-11 rounded-xl px-3 flex items-center gap-3 text-sm hover:bg-hover">
                  <Upload size={18} className="text-muted" /> Upload files
                </button>
                <button onClick={openLive} className="w-full h-11 rounded-xl px-3 flex items-center gap-3 text-sm hover:bg-hover">
                  <Camera size={18} className="text-muted" />
                  <span className="flex-1 text-left">Live Vision</span>
                  {!checkFeature(user, 'live').ok && <Lock size={14} className="text-muted" />}
                </button>
              </div>
            )}
          </div>
          <button onClick={() => onToggleMode('image')} aria-label="Generate image" aria-pressed={mode === 'image'} title="Generate image" className={toolBtn(mode === 'image')}>
            <ImageIcon size={20} />
          </button>
          <button onClick={() => onToggleMode('video')} aria-label="Generate video" aria-pressed={mode === 'video'} title="Generate video" className={toolBtn(mode === 'video')}>
            <Video size={20} />
          </button>
        </div>

        <textarea
          ref={textRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          aria-label="Message Lumina AI"
          className="order-1 sm:order-2 w-full sm:w-auto sm:flex-1 min-w-0 resize-none bg-transparent px-3 py-[13px] text-[16px] leading-[22px] placeholder:text-muted focus:outline-none max-h-[168px]"
        />

        <div className="order-3 flex items-center gap-0.5 ml-auto self-end">
          <button
            onClick={toggleMic}
            aria-label={listening ? 'Stop voice input' : 'Voice input'}
            aria-pressed={listening}
            className={`${toolBtn(false)} ${listening ? '!bg-[#d93025] !text-white pulse-ring' : ''}`}
          >
            <Mic size={20} />
          </button>
          {busy ? (
            <button onClick={onStop} aria-label="Stop" className="h-10 w-10 rounded-full bg-ink text-surface flex items-center justify-center">
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
              className="h-10 w-10 rounded-full bg-lumina-gradient-diag text-white flex items-center justify-center disabled:opacity-30 transition-opacity"
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
});

export default Composer;
