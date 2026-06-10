'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiJson, formatNumber } from '@/lib/api';

type Store = { id: string; code: string; name: string; slots?: Array<{ id: string; code: string; name: string }> };
type Ticket = { id: string; code: string; name: string; status: string; inventory_date: string; stores?: any; slots?: any; v_ticket_stats?: any[] };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState({ code: `KK-${Date.now()}`, name: 'Phiếu kiểm kê mới', store_id: '', slot_id: '', has_book_data: true });
  const [error, setError] = useState('');

  async function load() {
    const [t, s] = await Promise.all([apiJson<{ tickets: Ticket[] }>('/api/tickets'), apiJson<{ stores: Store[] }>('/api/stores')]);
    setTickets(t.tickets);
    setStores(s.stores);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    const data = await apiJson<{ ticket: Ticket }>('/api/tickets', { method: 'POST', body: JSON.stringify(form) });
    location.href = `/tickets/${data.ticket.id}`;
  }

  const selectedStore = stores.find((s) => s.id === form.store_id);

  return (
    <Shell>
      <PageHeader title="Phiếu kiểm kê" description="Tạo phiếu, import sổ sách, xác nhận cho PDA kiểm kê." />
      {error ? <div className="error">{error}</div> : null}
      <form className="card grid grid-4" onSubmit={createTicket}>
        <label className="label">Mã phiếu<input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
        <label className="label">Tên phiếu<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="label">Cửa hàng<select className="select" value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value, slot_id: '' })} required><option value="">Chọn</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}</select></label>
        <label className="label">Vị trí<select className="select" value={form.slot_id} onChange={(e) => setForm({ ...form, slot_id: e.target.value })}><option value="">Toàn cửa hàng</option>{selectedStore?.slots?.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}</select></label>
        <label className="label"><span>Có dữ liệu sổ sách?</span><select className="select" value={String(form.has_book_data)} onChange={(e) => setForm({ ...form, has_book_data: e.target.value === 'true' })}><option value="true">Có, cần import</option><option value="false">Không, cho PDA scan ngay</option></select></label>
        <button className="btn" style={{ alignSelf: 'end' }}>Tạo phiếu</button>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Danh sách phiếu</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Tên</th><th>Cửa hàng</th><th>Trạng thái</th><th>Dòng hàng</th><th>Chênh lệch</th><th></th></tr></thead>
            <tbody>{tickets.map((t) => {
              const stats = Array.isArray(t.v_ticket_stats) ? t.v_ticket_stats[0] : null;
              return <tr key={t.id}><td>{t.code}</td><td>{t.name}</td><td>{t.stores?.name}</td><td><StatusBadge status={t.status} /></td><td>{formatNumber(stats?.total_items)}</td><td>{formatNumber(stats?.discrepancy_items)}</td><td><Link className="btn secondary" href={`/tickets/${t.id}`}>Mở</Link></td></tr>;
            })}</tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
