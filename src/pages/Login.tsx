import { useState } from 'react';

const BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

type Props = { onLogin: (user: object) => void; onGoSignUp: () => void };
type Step = 'login' | 'fp-email' | 'fp-verify' | 'fp-reset';

export function Login({ onLogin, onGoSignUp }: Props) {
  const [step, setStep] = useState<Step>('login');

  // login
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // forgot password
  const [fpEmail, setFpEmail]     = useState('');
  const [fpOtp, setFpOtp]         = useState('');
  const [fpNewPw, setFpNewPw]     = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpError, setFpError]     = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  const goStep = (s: Step) => { setFpError(''); setStep(s); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoading(false); }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError(''); setFpLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      goStep('fp-verify');
    } catch (err: unknown) {
      setFpError(err instanceof Error ? err.message : 'Failed to send code');
    } finally { setFpLoading(false); }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fpOtp.length !== 6) { setFpError('Enter the 6-digit code'); return; }
    setFpError(''); setFpLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, otp: fpOtp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      goStep('fp-reset');
    } catch (err: unknown) {
      setFpError(err instanceof Error ? err.message : 'Invalid code');
    } finally { setFpLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fpNewPw !== fpConfirm) { setFpError('Passwords do not match'); return; }
    setFpError(''); setFpLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail, otp: fpOtp, newPassword: fpNewPw }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setEmail(fpEmail); setPassword('');
      goStep('login');
    } catch (err: unknown) {
      setFpError(err instanceof Error ? err.message : 'Reset failed');
    } finally { setFpLoading(false); }
  };

  if (step === 'fp-email') return (
    <div className="auth-screen"><div className="auth-card">
      <button className="fp-back" onClick={() => goStep('login')}>← Back</button>
      <h1 className="auth-logo">Reset Password</h1>
      <p className="auth-sub">Enter your email to receive a reset code.</p>
      <form onSubmit={handleSendCode}>
        <input type="email" placeholder="Email address" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required autoFocus />
        {fpError && <p className="auth-error">{fpError}</p>}
        <button type="submit" disabled={fpLoading}>{fpLoading ? 'Sending…' : 'Send Code →'}</button>
      </form>
    </div></div>
  );

  if (step === 'fp-verify') return (
    <div className="auth-screen"><div className="auth-card">
      <button className="fp-back" onClick={() => goStep('fp-email')}>← Back</button>
      <h1 className="auth-logo">Enter Code</h1>
      <p className="auth-sub">We sent a 6-digit code to <strong>{fpEmail}</strong></p>
      <form onSubmit={handleVerifyCode}>
        <input className="fp-otp" type="text" placeholder="000000" value={fpOtp} inputMode="numeric" maxLength={6} autoFocus
          onChange={e => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        {fpError && <p className="auth-error">{fpError}</p>}
        <button type="submit" disabled={fpLoading}>{fpLoading ? 'Verifying…' : 'Verify Code →'}</button>
      </form>
      <p className="auth-switch">Didn't get it? <button type="button" onClick={() => { setFpOtp(''); goStep('fp-email'); }}>Resend</button></p>
    </div></div>
  );

  if (step === 'fp-reset') return (
    <div className="auth-screen"><div className="auth-card">
      <button className="fp-back" onClick={() => goStep('fp-verify')}>← Back</button>
      <h1 className="auth-logo">New Password</h1>
      <p className="auth-sub">Choose a new password for your account.</p>
      <form onSubmit={handleResetPassword}>
        <input type="password" placeholder="New password" value={fpNewPw} onChange={e => setFpNewPw(e.target.value)} required autoFocus />
        <input type="password" placeholder="Confirm new password" value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} required />
        {fpError && <p className="auth-error">{fpError}</p>}
        <button type="submit" disabled={fpLoading}>{fpLoading ? 'Saving…' : 'Reset Password →'}</button>
      </form>
    </div></div>
  );

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-logo">LiveKit Studio</h1>
        <p className="auth-sub">Sign in to your account</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Log In →'}</button>
        </form>
        <button className="fp-link" onClick={() => { setFpEmail(email); goStep('fp-email'); }}>Forgot password?</button>
        <p className="auth-switch">Don't have an account? <button type="button" onClick={onGoSignUp}>Sign Up</button></p>
      </div>
    </div>
  );
}
