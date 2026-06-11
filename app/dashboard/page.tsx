'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiJson, formatNumber } from '@/lib/api';

type Dashboard = { tickets: number; items: number; scans: number; statuses: Array<{ status: string; count: number }>; user?: any; companies?: number; mode: string };

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<Dashboard>('/api/dashboard').then(setData).catch((err) => setError(err.message));
  }, []);

  return (
    <Shell>
      <PageHeader title="Dashboard" description="Tổng quan vận hành kiểm kê theo công ty." />
      {error ? <div className="error">{error}</div> : null}
      {!data ? <div className="card">Đang tải...</div> : (
        <div className="grid">
          <div className="kpi-grid">
            <div className="card stat"><span>Tổng phiếu</span><strong>{formatNumber(data.tickets)}</strong></div>
            <div className="card stat"><span>Dòng sổ sách</span><strong>{formatNumber(data.items)}</strong></div>
            <div className="card stat"><span>Lượt scan</span><strong>{formatNumber(data.scans)}</strong></div>
          </div>
          <div className="card">
            <h3>Trạng thái phiếu</h3>
            <div className="record-list mobile-only" style={{ marginTop: 14 }}>
              {data.statuses.map((s) => (
                <div key={s.status} className="record-card">
                  <div className="record-header">
                    <div className="record-title">
                      <strong>{s.status}</strong>
                      <span>Trạng thái phiếu hiện tại</span>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="data-list">
                    <div className="data-item">
                      <span className="data-item-label">Số lượng</span>
                      <span className="data-item-value">{formatNumber(s.count)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.statuses.length === 0 ? <div className="empty-state">Chưa có dữ liệu.</div> : null}
            </div>
            <div className="table-wrap desktop-only" style={{ marginTop: 14 }}>
              <table>
                <thead><tr><th>Trạng thái</th><th>Số lượng</th></tr></thead>
                <tbody>
                  {data.statuses.map((s) => <tr key={s.status}><td><StatusBadge status={s.status} /></td><td>{s.count}</td></tr>)}
                  {data.statuses.length === 0 ? <tr><td colSpan={2}>Chưa có dữ liệu.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
