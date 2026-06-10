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
      <div className="card grid" style={{ marginBottom: 16 }}>
        <label className="label">Chọn phiếu
          <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Chọn phiếu kiểm kê</option>
            {tickets.map((t) => <option key={t.id} value={t.id}>{t.code} - {t.name} ({t.status})</option>)}
          </select>
        </label>
      </div>
      {detail ? <div className="card">
        <h3>{detail.ticket.code} - {detail.ticket.name} <StatusBadge status={detail.ticket.status} /></h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Barcode</th><th>Tên hàng</th><th>Sổ sách</th><th>Thực tế</th><th>Lệch</th><th>Trạng thái</th></tr></thead>
            <tbody>{rows.map((r: any) => <tr key={r.id}><td>{r.barcode}</td><td>{r.product_name}</td><td>{formatNumber(r.ori_qty)}</td><td>{formatNumber(r.real_qty)}</td><td>{formatNumber(r.diff_qty)}</td><td><StatusBadge status={r.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div> : null}
    </Shell>
  );
}
