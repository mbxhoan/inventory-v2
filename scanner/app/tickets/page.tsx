'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiJson, formatNumber } from '@/lib/api';

type Ticket = { id: string; code: string; name: string; status: string; stores?: any; slots?: any; v_ticket_stats?: any[] };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { apiJson<{ tickets: Ticket[] }>('/api/tickets').then((d) => setTickets(d.tickets)).catch((e) => setError(e.message)); }, []);
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/'; }

  return <main className="wrap">
    <div className="top"><div className="brand">Chọn phiếu<span>Chỉ hiện phiếu đã duyệt cho PDA</span></div></div>
    <div className="grid">
      <button className="btn secondary" onClick={logout}>Đăng xuất</button>
      {error ? <div className="error">{error}</div> : null}
      <div className="list">
        {tickets.map((t) => { const st = Array.isArray(t.v_ticket_stats) ? t.v_ticket_stats[0] : null; return <Link className="card ticket" href={`/tickets/${t.id}`} key={t.id}>
          <h3>{t.code}</h3><div>{t.name}</div><div className="muted">{t.stores?.name} {t.slots?.name ? '• ' + t.slots.name : ''}</div><div><span className={`badge ${t.status}`}>{t.status}</span></div><div className="muted">Dòng hàng: {formatNumber(st?.total_items)} • Đã scan: {formatNumber(st?.total_real_qty)}</div>
        </Link>; })}
        {tickets.length === 0 ? <div className="card">Chưa có phiếu nào sẵn sàng để scan.</div> : null}
      </div>
    </div>
  </main>;
}
