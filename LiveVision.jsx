import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Mic, RefreshCw, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { LIVE_MODEL } from '../lib/models.js';
import { hasKey, streamChat } from '../lib/gemini.js';
import { speak, startListening, stopSpeaking, sttSupported } from '../lib/speech.js';
import { FOOTER_TEXT } from '../lib/constants.js';
import { Toggle } from './ui.jsx';

const SYSTEM =
  'You are Lumina Live Vision, the camera assistant inside Lumina AI (by Lumina Studio). ' +
  'Look at the camera frame and answer in one to three short, friendly sentences that are easy to hear aloud. No markdown. Keep it age-appropriate.';

export default function LiveVision() {
  const { setLiveOpen, toast } = useApp();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);
  const stopListenRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [listening, setListening] = useState(false);

  // camera
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setCamError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Camera is not available. Open Lumina AI over https (or localhost) in a browser that supports it.');
      return undefined;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
      })
      .catch((e) => setCamError(e?.name === 'NotAllowedError' ? 'Camera permission was blocked. Allow it in your browser settings and try again.' : 'Could not start the camera.'));
    return () => {
      cancelled = true;
    };
  }, [facing]);

  const close = useCallback(() => {
    stopSpeaking();
    stopListenRef.current?.();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setLiveOpen(false);
  }, [setLiveOpen]);

  useEffect(() => () => {
    stopSpeaking();
    stopListenRef.current?.();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const look = useCallback(
    async (q) => {
      const video = videoRef.current;
      if (busyRef.current || !video || !video.videoWidth) return;
      if (!hasKey()) {
        toast('Add VITE_GEMINI_API_KEY to .env first.', 'error');
        return;
      }
      busyRef.current = true;
      setBusy(true);
      try {
        const scale = Math.min(1, 768 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        const prompt = q?.trim() || 'What do you see? Describe it briefly.';
        const text = await streamChat({
          engine: LIVE_MODEL,
          system: SYSTEM,
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: prompt }] }],
          onToken: setAnswer,
        });
        speak(text);
      } catch (e) {
        setAnswer('');
        toast(e.message || 'Live Vision failed. Try again.', 'error');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [toast]
  );

  // auto-describe every few seconds
  useEffect(() => {
    if (!auto || !ready) return undefined;
    const t = setInterval(() => look(''), 9000);
    return () => clearInterval(t);
  }, [auto, ready, look]);

  function askByVoice() {
    if (listening) {
      stopListenRef.current?.();
      return;
    }
    if (!sttSupported()) {
      toast('Voice input is not supported in this browser.', 'error');
      return;
    }
    stopSpeaking();
    setListening(true);
    stopListenRef.current = startListening({
      onResult: (text, final) => {
        setQuestion(text);
        if (final) look(text);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col fade-in" role="dialog" aria-modal="true" aria-label="Live Vision">
      <div className="h-14 shrink-0 flex items-center justify-between px-3">
        <div className="flex items-center gap-2 font-medium">
          <Camera size={20} /> Live Vision
        </div>
        <button onClick={close} aria-label="Close Live Vision" className="h-10 w-10 rounded-full hover:bg-white/15 flex items-center justify-center"><X size={22} /></button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted autoPlay className="max-h-full max-w-full" style={{ borderRadius: 16 }} />
        {!ready && !camError && <p className="absolute text-sm text-white/70">Starting camera…</p>}
        {camError && <p className="absolute px-8 text-center text-sm text-white/80 max-w-md">{camError}</p>}
        {ready && (
          <button onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))} aria-label="Switch camera" className="absolute right-3 top-3 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70">
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      <div className="shrink-0 bg-[#1e1f20] rounded-t-[28px] px-4 pt-4 pb-[max(14px,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          <div className="min-h-[56px] max-h-[22dvh] overflow-y-auto text-[15px] leading-relaxed text-white/90 mb-3" aria-live="polite">
            {busy && !answer ? 'Looking…' : answer || 'Point the camera at something, then tap Look or ask a question.'}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') look(question); }}
              placeholder="Ask about what you see"
              aria-label="Question about the camera view"
              className="flex-1 min-w-0 h-12 rounded-full bg-[#282a2c] px-5 text-[15px] placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#8ab4f8]"
            />
            <button onClick={askByVoice} aria-label={listening ? 'Stop listening' : 'Ask by voice'} className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center ${listening ? 'bg-[#d93025] pulse-ring' : 'bg-[#282a2c] hover:bg-[#333537]'}`}>
              <Mic size={20} />
            </button>
            <button onClick={() => look(question)} disabled={!ready || busy} aria-label="Look" className="h-12 px-5 shrink-0 rounded-full bg-lumina-gradient-diag font-medium flex items-center gap-2 disabled:opacity-40">
              <Send size={17} /> Look
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-white/80">
            <label className="flex items-center gap-3">
              <Toggle checked={auto} onChange={setAuto} label="Describe automatically every few seconds" />
              Auto-describe
            </label>
            <span className="text-xs text-white/50">{FOOTER_TEXT}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
