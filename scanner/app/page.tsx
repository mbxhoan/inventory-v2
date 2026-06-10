'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('pda@inventory.local');
  const [pin, setPin] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiJson('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, pin }) });
      router.replace('/tickets');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <main className="wrap"><div className="top"><div className="brand">Inventory Scanner<span>Kiểm kê thời đại mới</span></div></div><form className="card grid" onSubmit={submit}>
    <h2>Đăng nhập PDA</h2>
    {error ? <div className="error">{error}</div> : null}
    <label className="label">Email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label className="label">Mã PIN<input className="input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></label>
    <button className="btn" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Vào scanner'}</button>
    <div className="notice">Demo: pda@inventory.local / 123456</div>
  </form></main>;
}
