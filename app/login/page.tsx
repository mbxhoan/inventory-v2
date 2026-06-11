'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { apiJson } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ttvn.vn');
  const [pin, setPin] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiJson('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, pin }) });
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card grid" onSubmit={submit}>
        <div className="page-title" style={{ textAlign: 'center' }}>
          <img src="/banner.png" alt="Inventory" className="login-banner" />
          <p>Đăng nhập web quản lý.</p>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <label className="label">Email
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="label">Mã PIN
          <input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
        <button className="btn" disabled={loading}><LogIn size={15} /> {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <div className="notice">Demo: admin@ttvn.vn / 123456</div>
      </form>
    </div>
  );
}
