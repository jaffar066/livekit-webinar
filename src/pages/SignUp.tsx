import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const BASE = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

type Props = {
  onSignUp: (user: object) => void;
  onGoLogin: () => void;
};

export function SignUp({ onSignUp, onGoLogin }: Props) {
  const [form, setForm] = useState({
    fName: '', lName: '', email: '', password: '', phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      localStorage.setItem('token', data.token);
      onSignUp(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-logo">LiveKit Studio</h1>
        <p className="auth-sub">Create your studio account</p>
        <form onSubmit={handleSubmit}>
          <div className="auth-row">
            <input type="text" placeholder="First name" value={form.fName} onChange={set('fName')} required autoFocus />
            <input type="text" placeholder="Last name" value={form.lName} onChange={set('lName')} required />
          </div>
          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
          <div style={{ position: 'relative', width: '100%' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required style={{ width: '100%', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </button>
          </div>
          <input type="tel" placeholder="Phone number" value={form.phoneNumber} onChange={set('phoneNumber')} required />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" onClick={onGoLogin}>Log In</button>
        </p>
      </div>
    </div>
  );
}
