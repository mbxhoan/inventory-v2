'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import Drawer from '@/components/Drawer';
import { useToast } from '@/components/Toast';
import { apiJson } from '@/lib/api';

type Store = { id: string; code: string; name: string; address?: string; slots?: Array<{ id: string; code: string; name: string }> };

const emptyStore = { code: '', name: '', address: '' };
const emptySlot = { store_id: '', code: '', name: '' };

export default function StoresPage() {
  const toast = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [form, setForm] = useState(emptyStore);
  const [slot, setSlot] = useState(emptySlot);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await apiJson<{ stores: Store[] }>('/api/stores');
      setStores(data.stores);
    } catch (err: any) {
      toast.error(err.message);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openStore() {
    setForm(emptyStore);
    setErrors({});
    setStoreOpen(true);
  }
  function openSlot() {
    setSlot({ ...emptySlot, store_id: stores[0]?.id || '' });
    setErrors({});
    setSlotOpen(true);
  }

  async function createStore() {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Bắt buộc nhập mã cửa hàng.';
    if (!form.name.trim()) e.name = 'Bắt buộc nhập tên cửa hàng.';
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Vui lòng kiểm tra lại thông tin cửa hàng.'); return; }
    setSaving(true);
    try {
      await apiJson('/api/stores', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Đã thêm cửa hàng.');
      setStoreOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function createSlot() {
    const e: Record<string, string> = {};
    if (!slot.store_id) e.store_id = 'Chọn cửa hàng.';
    if (!slot.code.trim()) e.code = 'Bắt buộc nhập mã vị trí.';
    if (!slot.name.trim()) e.name = 'Bắt buộc nhập tên vị trí.';
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Vui lòng kiểm tra lại thông tin vị trí.'); return; }
    setSaving(true);
    try {
      await apiJson('/api/slots', { method: 'POST', body: JSON.stringify(slot) });
      toast.success('Đã thêm vị trí quét.');
      setSlotOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <PageHeader
        title="Cửa hàng & vị trí"
        description="Quản lý địa điểm kiểm kê và các vị trí/kệ quét."
        action={
          <div className="stack-mobile">
            <button className="btn secondary" onClick={openSlot} disabled={!stores.length}><Plus size={16} /> Thêm vị trí</button>
            <button className="btn" onClick={openStore}><Plus size={16} /> Thêm cửa hàng</button>
          </div>
        }
      />

      <div className="card">
        <h3>Danh sách cửa hàng</h3>
        <div className="record-list mobile-only" style={{ marginTop: 14 }}>
          {stores.map((s) => (
            <div key={s.id} className="record-card">
              <div className="record-header">
                <div className="record-title">
                  <strong>{s.code}</strong>
                  <span>{s.name}</span>
                </div>
              </div>
              <div className="data-list">
                <div className="data-item">
                  <span className="data-item-label">Địa chỉ</span>
                  <span className="data-item-value">{s.address || 'Chưa cập nhật'}</span>
                </div>
                <div className="data-item">
                  <span className="data-item-label">Vị trí quét</span>
                  <span className="data-item-value">
                    {s.slots?.length ? s.slots.map((x) => `${x.code} - ${x.name}`).join(', ') : 'Chưa có vị trí'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {!stores.length ? <div className="empty-state">Chưa có cửa hàng nào. Thêm cửa hàng đầu tiên để bắt đầu.</div> : null}
        </div>
        <div className="table-wrap desktop-only" style={{ marginTop: 14 }}>
          <table>
            <thead><tr><th>Mã</th><th>Tên</th><th>Địa chỉ</th><th>Vị trí</th></tr></thead>
            <tbody>
              {stores.length ? stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>{s.slots?.map((x) => `${x.code} - ${x.name}`).join(', ')}</td>
                </tr>
              )) : <tr><td colSpan={4} className="muted">Chưa có cửa hàng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
        title="Thêm cửa hàng"
        description="Tạo địa điểm kiểm kê mới."
        footer={
          <>
            <button className="btn secondary sm" onClick={() => setStoreOpen(false)} disabled={saving}><X size={14} /> Hủy</button>
            <button className="btn sm" onClick={createStore} disabled={saving}><Save size={14} /> {saving ? 'Đang lưu…' : 'Lưu cửa hàng'}</button>
          </>
        }
      >
        <label className="label">Mã cửa hàng
          <input className={`input ${errors.code ? 'invalid' : ''}`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          {errors.code ? <span className="field-error">{errors.code}</span> : null}
        </label>
        <label className="label">Tên cửa hàng
          <input className={`input ${errors.name ? 'invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label className="label">Địa chỉ
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
      </Drawer>

      <Drawer
        open={slotOpen}
        onClose={() => setSlotOpen(false)}
        title="Thêm vị trí quét"
        description="Kệ/vị trí trong cửa hàng để PDA quét."
        footer={
          <>
            <button className="btn secondary sm" onClick={() => setSlotOpen(false)} disabled={saving}><X size={14} /> Hủy</button>
            <button className="btn sm" onClick={createSlot} disabled={saving}><Save size={14} /> {saving ? 'Đang lưu…' : 'Lưu vị trí'}</button>
          </>
        }
      >
        <label className="label">Cửa hàng
          <select className={`select ${errors.store_id ? 'invalid' : ''}`} value={slot.store_id} onChange={(e) => setSlot({ ...slot, store_id: e.target.value })}>
            <option value="">Chọn cửa hàng</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
          </select>
          {errors.store_id ? <span className="field-error">{errors.store_id}</span> : null}
        </label>
        <label className="label">Mã vị trí
          <input className={`input ${errors.code ? 'invalid' : ''}`} value={slot.code} onChange={(e) => setSlot({ ...slot, code: e.target.value })} />
          {errors.code ? <span className="field-error">{errors.code}</span> : null}
        </label>
        <label className="label">Tên vị trí
          <input className={`input ${errors.name ? 'invalid' : ''}`} value={slot.name} onChange={(e) => setSlot({ ...slot, name: e.target.value })} />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
      </Drawer>
    </Shell>
  );
}
