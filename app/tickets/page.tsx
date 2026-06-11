'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import Drawer from '@/components/Drawer';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { apiJson, formatNumber } from '@/lib/api';

type Store = { id: string; code: string; name: string; slots?: Array<{ id: string; code: string; name: string }> };
type Ticket = { id: string; code: string; name: string; status: string; inventory_date: string; stores?: any; slots?: any; v_ticket_stats?: any[] };

function newForm() {
  return { code: `KK-${Date.now()}`, name: 'Phiếu kiểm kê mới', store_id: '', slot_id: '', has_book_data: true };
}

export default function TicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(newForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [t, s] = await Promise.all([apiJson<{ tickets: Ticket[] }>('/api/tickets'), apiJson<{ stores: Store[] }>('/api/stores')]);
      setTickets(t.tickets);
      setStores(s.stores);
    } catch (err: any) {
      toast.error(err.message);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(newForm());
    setErrors({});
    setOpen(true);
  }

  async function createTicket() {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Bắt buộc nhập mã phiếu.';
    if (!form.name.trim()) e.name = 'Bắt buộc nhập tên phiếu.';
    if (!form.store_id) e.store_id = 'Chọn cửa hàng.';
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Vui lòng kiểm tra lại thông tin phiếu.'); return; }
    setSaving(true);
    try {
      const data = await apiJson<{ ticket: Ticket }>('/api/tickets', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Đã tạo phiếu kiểm kê.');
      location.href = `/tickets/${data.ticket.id}`;
    } catch (err: any) {
      toast.error(err.message);
      setSaving(false);
    }
  }

  const selectedStore = stores.find((s) => s.id === form.store_id);

  return (
    <Shell>
      <PageHeader
        title="Phiếu kiểm kê"
        description="Tạo phiếu, import sổ sách, xác nhận cho PDA kiểm kê."
        action={<button className="btn" onClick={openCreate} disabled={!stores.length}><Plus size={16} /> Tạo phiếu</button>}
      />

      <div className="card">
        <h3>Danh sách phiếu</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Tên</th><th>Cửa hàng</th><th>Trạng thái</th><th>Dòng hàng</th><th>Chênh lệch</th><th></th></tr></thead>
            <tbody>
              {tickets.length ? tickets.map((t) => {
                const stats = Array.isArray(t.v_ticket_stats) ? t.v_ticket_stats[0] : null;
                return (
                  <tr key={t.id}>
                    <td>{t.code}</td>
                    <td>{t.name}</td>
                    <td>{t.stores?.name}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{formatNumber(stats?.total_items)}</td>
                    <td>{formatNumber(stats?.discrepancy_items)}</td>
                    <td><Link className="btn secondary sm" href={`/tickets/${t.id}`}>Mở</Link></td>
                  </tr>
                );
              }) : <tr><td colSpan={7} className="muted">Chưa có phiếu nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Tạo phiếu kiểm kê"
        description="Khởi tạo phiếu mới cho cửa hàng/vị trí."
        footer={
          <>
            <button className="btn secondary" onClick={() => setOpen(false)} disabled={saving}>Hủy</button>
            <button className="btn" onClick={createTicket} disabled={saving}>{saving ? 'Đang tạo…' : 'Tạo phiếu'}</button>
          </>
        }
      >
        <label className="label">Mã phiếu
          <input className={`input ${errors.code ? 'invalid' : ''}`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          {errors.code ? <span className="field-error">{errors.code}</span> : null}
        </label>
        <label className="label">Tên phiếu
          <input className={`input ${errors.name ? 'invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label className="label">Cửa hàng
          <select className={`select ${errors.store_id ? 'invalid' : ''}`} value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value, slot_id: '' })}>
            <option value="">Chọn</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
          </select>
          {errors.store_id ? <span className="field-error">{errors.store_id}</span> : null}
        </label>
        <label className="label">Vị trí
          <select className="select" value={form.slot_id} onChange={(e) => setForm({ ...form, slot_id: e.target.value })}>
            <option value="">Toàn cửa hàng</option>
            {selectedStore?.slots?.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
          </select>
        </label>
        <label className="label">Có dữ liệu sổ sách?
          <select className="select" value={String(form.has_book_data)} onChange={(e) => setForm({ ...form, has_book_data: e.target.value === 'true' })}>
            <option value="true">Có, cần import</option>
            <option value="false">Không, cho PDA scan ngay</option>
          </select>
        </label>
      </Drawer>
    </Shell>
  );
}
