import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Footer, LogoTile, Modal, btnPrimary, inputCls } from '../components/ui.jsx';
import { TAGLINE } from '../lib/constants.js';

export default function AuthPage() {
  const { signup, login, toast } = useApp();
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const isSignup = mode === 'signup';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (isSignup && !agree) {
      setError('Please accept the Terms to create your account.');
      return;
    }
    setLoading(true);
    try {
      const u = isSignup ? await signup({ name, email, password }) : await login({ email, password });
      toast(`${isSignup ? 'Welcome' : 'Welcome back'}, ${u.name.split(' ')[0]}!`, 'success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const tab = (active) =>
    `flex-1 h-10 rounded-full text-sm font-medium transition-colors ${active ? 'bg-surface shadow-sm text-ink' : 'text-muted hover:text-ink'}`;

  return (
    <div className="app-h overflow-y-auto bg-app">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-center text-center mb-7">
            <LogoTile size={68} />
            <h1 className="mt-4 text-[34px] leading-none font-semibold tracking-tight text-gradient-brand">Lumina AI</h1>
            <p className="mt-2 text-muted">{TAGLINE}</p>
          </div>

          <div className="bg-surface rounded-[28px] shadow-pill p-5 sm:p-6">
            <div className="flex p-1 rounded-full bg-field mb-5" role="tablist">
              <button role="tab" aria-selected={isSignup} onClick={() => { setMode('signup'); setError(''); }} className={tab(isSignup)}>Sign up</button>
              <button role="tab" aria-selected={!isSignup} onClick={() => { setMode('login'); setError(''); }} className={tab(!isSignup)}>Log in</button>
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {isSignup && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1.5">Full name</label>
                  <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your full name" />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                <input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className={`${inputCls} pr-12`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full flex items-center justify-center text-muted hover:bg-hover">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 rounded accent-[#0b57d0]" />
                  <span>
                    I agree to the{' '}
                    <button type="button" onClick={() => setTermsOpen(true)} className="text-accent underline underline-offset-2">Terms</button>
                  </span>
                </label>
              )}

              {error && <p role="alert" className="text-sm text-[#d93025] dark:text-[#f28b82]">{error}</p>}

              <button type="submit" disabled={loading} className={`${btnPrimary} w-full h-12 text-[15px]`}>
                {loading && <Loader2 size={18} className="animate-spin" />}
                {isSignup ? 'Create account' : 'Log in'}
              </button>
            </form>
          </div>
          <Footer className="mt-6" />
        </div>
      </div>

      {termsOpen && (
        <Modal title="Terms of use" onClose={() => setTermsOpen(false)}>
          <div className="space-y-3 text-[15px] leading-relaxed text-muted">
            <p>Lumina AI is open to everyone. Younger users should use it with a parent or guardian.</p>
            <p>AI answers can be wrong. Check important information, and don't rely on Lumina AI for medical, legal or financial decisions.</p>
            <p>Please don't use Lumina AI to harm, harass or deceive anyone, or to create unsafe content.</p>
            <p>Paid plans are paid by bank transfer and activated after an admin confirms your payment. Fees are not refundable once a plan is activated.</p>
            <p>Your chats are stored on your own device. Clearing your browser data removes them.</p>
          </div>
          <button onClick={() => { setAgree(true); setTermsOpen(false); }} className={`${btnPrimary} w-full mt-5`}>I agree</button>
        </Modal>
      )}
    </div>
  );
}
