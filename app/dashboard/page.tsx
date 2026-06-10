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
          <div className="grid grid-3">
            <div className="card stat"><span>Tổng phiếu</span><strong>{formatNumber(data.tickets)}</strong></div>
            <div className="card stat"><span>Dòng sổ sách</span><strong>{formatNumber(data.items)}</strong></div>
            <div className="card stat"><span>Lượt scan</span><strong>{formatNumber(data.scans)}</strong></div>
          </div>
          <div className="card">
            <h3>Trạng thái phiếu</h3>
            <div className="table-wrap">
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
