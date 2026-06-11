'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import Drawer from '@/components/Drawer';
import { useToast } from '@/components/Toast';
import { apiJson } from '@/lib/api';
import { ROLES_BY_TYPE, USER_TYPES, ROLE_LABELS, validateUserPayload, type AppUser, type UserType } from '@/lib/users';

type Me = { id: string; role: string } | null;

function blankForm() {
  return { id: '', email: '', full_name: '', user_type: 'WEB' as UserType, role: 'manager', pin: '', is_active: true };
}

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [me, setMe] = useState<Me>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [u, m] = await Promise.all([
        apiJson<{ users: AppUser[] }>('/api/users'),
        apiJson<{ user: Me }>('/api/me')
      ]);
      setUsers(u.users);
      setMe(m.user);
    } catch (err: any) {
      toast.error(err.message);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(blankForm());
    setErrors({});
    setEditing(false);
    setOpen(true);
  }

  function openEdit(u: AppUser) {
    setForm({ id: u.id, email: u.email, full_name: u.full_name, user_type: u.user_type, role: u.role, pin: '', is_active: u.is_active });
    setErrors({});
    setEditing(true);
    setOpen(true);
  }

  function changeType(user_type: UserType) {
    const roles = ROLES_BY_TYPE[user_type];
    setForm((f) => ({ ...f, user_type, role: roles.some((r) => r.value === f.role) ? f.role : roles[0].value }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Bắt buộc nhập họ tên.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ.';
    const needPin = !editing;
    if (needPin || form.pin) {
      if (form.pin.trim().length < 4) e.pin = 'Mã PIN tối thiểu 4 ký tự.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) { toast.error('Vui lòng kiểm tra lại thông tin người dùng.'); return; }
    setSaving(true);
    try {
      const payload: any = {
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        user_type: form.user_type,
        is_active: form.is_active
      };
      if (form.pin) payload.pin = form.pin;

      if (editing) {
        await apiJson(`/api/users/${form.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success('Đã cập nhật người dùng.');
      } else {
        await apiJson('/api/users', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Đã thêm người dùng.');
      }
      setOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: AppUser) {
    try {
      await apiJson(`/api/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !u.is_active }) });
      toast.success(u.is_active ? 'Đã vô hiệu hóa tài khoản.' : 'Đã kích hoạt tài khoản.');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function remove(u: AppUser) {
    if (!confirm(`Vô hiệu hóa (xóa mềm) tài khoản ${u.email}?`)) return;
    try {
      await apiJson(`/api/users/${u.id}`, { method: 'DELETE' });
      toast.success('Đã xóa mềm tài khoản.');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const roleOptions = ROLES_BY_TYPE[form.user_type];

  return (
    <Shell>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản web quản lý và scanner PDA, phân quyền cơ bản."
        action={<button className="btn" onClick={openCreate}><Plus size={16} /> Thêm người dùng</button>}
      />

      <div className="card">
        <h3>Danh sách người dùng</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Họ tên</th><th>Email</th><th>Loại</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {users.length ? users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}{me?.id === u.id ? <span className="muted"> (bạn)</span> : null}</td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.user_type}</span></td>
                  <td>{ROLE_LABELS[u.role] || u.role}</td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={u.is_active} disabled={me?.id === u.id} onChange={() => toggleActive(u)} />
                      <span className="track" />
                      {u.is_active ? 'Hoạt động' : 'Vô hiệu'}
                    </label>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn secondary sm" onClick={() => openEdit(u)}><Pencil size={14} /> Sửa</button>
                      <button className="btn danger sm" onClick={() => remove(u)} disabled={me?.id === u.id}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={6} className="muted">Chưa có người dùng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Sửa người dùng' : 'Thêm người dùng'}
        description={editing ? 'Cập nhật hồ sơ, vai trò, mã PIN.' : 'Tạo tài khoản web hoặc scanner PDA.'}
        footer={
          <>
            <button className="btn secondary sm" onClick={() => setOpen(false)} disabled={saving}><X size={14} /> Hủy</button>
            <button className="btn sm" onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Đang lưu…' : 'Lưu'}</button>
          </>
        }
      >
        <label className="label">Họ tên
          <input className={`input ${errors.full_name ? 'invalid' : ''}`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          {errors.full_name ? <span className="field-error">{errors.full_name}</span> : null}
        </label>
        <label className="label">Email
          <input className={`input ${errors.email ? 'invalid' : ''}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>
        <label className="label">Loại tài khoản
          <select className="select" value={form.user_type} onChange={(e) => changeType(e.target.value as UserType)}>
            {USER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="label">Vai trò
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <label className="label">Mã PIN {editing ? <span className="muted">(để trống nếu không đổi)</span> : null}
          <input className={`input ${errors.pin ? 'invalid' : ''}`} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder={editing ? '••••••' : 'Tối thiểu 4 ký tự'} />
          {errors.pin ? <span className="field-error">{errors.pin}</span> : null}
        </label>
        <label className="switch">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          <span className="track" />
          Kích hoạt tài khoản
        </label>
      </Drawer>
    </Shell>
  );
}
