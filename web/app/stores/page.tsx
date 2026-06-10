'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import { apiJson } from '@/lib/api';

type Store = { id: string; code: string; name: string; address?: string; slots?: Array<{ id: string; code: string; name: string }> };

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState({ code: '', name: '', address: '' });
  const [slot, setSlot] = useState({ store_id: '', code: '', name: '' });
  const [error, setError] = useState('');

  async function load() {
    const data = await apiJson<{ stores: Store[] }>('/api/stores');
    setStores(data.stores);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    await apiJson('/api/stores', { method: 'POST', body: JSON.stringify(form) });
    setForm({ code: '', name: '', address: '' });
    await load();
  }

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    await apiJson('/api/slots', { method: 'POST', body: JSON.stringify(slot) });
    setSlot({ store_id: '', code: '', name: '' });
    await load();
  }

  return (
    <Shell>
      <PageHeader title="Cửa hàng & vị trí" description="Quản lý địa điểm kiểm kê và các vị trí/kệ quét." />
      {error ? <div className="error">{error}</div> : null}
      <div className="grid grid-2">
        <form className="card grid" onSubmit={createStore}>
          <h3>Thêm cửa hàng</h3>
          <label className="label">Mã cửa hàng<input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label>
          <label className="label">Tên cửa hàng<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="label">Địa chỉ<input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <button className="btn">Lưu cửa hàng</button>
        </form>
        <form className="card grid" onSubmit={createSlot}>
          <h3>Thêm vị trí quét</h3>
          <label className="label">Cửa hàng
            <select className="select" value={slot.store_id} onChange={(e) => setSlot({ ...slot, store_id: e.target.value })} required>
              <option value="">Chọn cửa hàng</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
            </select>
          </label>
          <label className="label">Mã vị trí<input className="input" value={slot.code} onChange={(e) => setSlot({ ...slot, code: e.target.value })} required /></label>
          <label className="label">Tên vị trí<input className="input" value={slot.name} onChange={(e) => setSlot({ ...slot, name: e.target.value })} required /></label>
          <button className="btn">Lưu vị trí</button>
        </form>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Danh sách cửa hàng</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã</th><th>Tên</th><th>Địa chỉ</th><th>Vị trí</th></tr></thead>
            <tbody>{stores.map((s) => <tr key={s.id}><td>{s.code}</td><td>{s.name}</td><td>{s.address}</td><td>{s.slots?.map(x => `${x.code} - ${x.name}`).join(', ')}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
