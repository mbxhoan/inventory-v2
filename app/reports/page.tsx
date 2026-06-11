'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiJson, formatNumber } from '@/lib/api';

type Ticket = { id: string; code: string; name: string; status: string; stores?: any; v_ticket_stats?: any[] };

export default function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => { apiJson<{ tickets: Ticket[] }>('/api/tickets').then((d) => setTickets(d.tickets)); }, []);
  useEffect(() => { if (selected) apiJson(`/api/tickets/${selected}`).then(setDetail); }, [selected]);

  const rows = (detail?.inventories || []).filter((x: any) => Number(x.diff_qty) !== 0 || x.status === 'NOTFOUND');

  return (
    <Shell>
      <PageHeader title="Báo cáo chênh lệch" description="Xem nhanh hàng lệch, thiếu, dư hoặc ngoài danh mục." />
      <div className="card grid">
        <label className="label">Chọn phiếu
          <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Chọn phiếu kiểm kê</option>
            {tickets.map((t) => <option key={t.id} value={t.id}>{t.code} - {t.name} ({t.status})</option>)}
          </select>
        </label>
      </div>
      {detail ? (
        <div className="card grid">
          <div className="record-header">
            <div className="record-title">
              <strong>{detail.ticket.code}</strong>
              <span>{detail.ticket.name}</span>
            </div>
            <StatusBadge status={detail.ticket.status} />
          </div>
          <div className="notice">Tổng {formatNumber(rows.length)} dòng có chênh lệch hoặc ngoài danh mục.</div>
          <div className="record-list mobile-only">
            {rows.map((r: any) => (
              <div key={r.id} className="record-card">
                <div className="record-header">
                  <div className="record-title">
                    <strong>{r.barcode}</strong>
                    <span>{r.product_name || 'Chưa có tên hàng'}</span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="data-list">
                  <div className="data-item">
                    <span className="data-item-label">Sổ sách</span>
                    <span className="data-item-value">{formatNumber(r.ori_qty)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-item-label">Thực tế</span>
                    <span className="data-item-value">{formatNumber(r.real_qty)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-item-label">Lệch</span>
                    <span className="data-item-value">{formatNumber(r.diff_qty)}</span>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 ? <div className="empty-state">Không có chênh lệch nào trong phiếu này.</div> : null}
          </div>
          <div className="table-wrap desktop-only">
            <table>
              <thead><tr><th>Barcode</th><th>Tên hàng</th><th>Sổ sách</th><th>Thực tế</th><th>Lệch</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {rows.map((r: any) => <tr key={r.id}><td>{r.barcode}</td><td>{r.product_name}</td><td>{formatNumber(r.ori_qty)}</td><td>{formatNumber(r.real_qty)}</td><td>{formatNumber(r.diff_qty)}</td><td><StatusBadge status={r.status} /></td></tr>)}
                {rows.length === 0 ? <tr><td colSpan={6} className="muted">Không có chênh lệch nào trong phiếu này.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
