'use client';

import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiJson, formatNumber } from '@/lib/api';

type Props = { params: { id: string } };

type Row = { barcode: string; sku?: string; product_name?: string; ori_qty: number; real_qty?: number; diff_qty?: number; status?: string };

function guessIndex(headers: string[], keywords: string[]) {
  const lower = headers.map((h) => h.toLowerCase());
  return lower.findIndex((h) => keywords.some((k) => h.includes(k)));
}

export default function TicketDetailPage({ params }: Props) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState({ barcode: -1, product_name: -1, sku: -1, ori_qty: -1 });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await apiJson<any>(`/api/tickets/${params.id}`);
    setData(res);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  async function readFile(file: File) {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    const h = (rows[0] || []).map(String);
    setHeaders(h);
    setRawRows(rows.slice(1));
    setMapping({
      barcode: guessIndex(h, ['barcode', 'mã vạch', 'ma vach', 'item']),
      product_name: guessIndex(h, ['product', 'tên', 'ten', 'name', 'hàng', 'hang']),
      sku: guessIndex(h, ['sku', 'mã hàng', 'ma hang']),
      ori_qty: guessIndex(h, ['ori', 'sổ sách', 'so sach', 'qty', 'sl', 'quantity'])
    });
  }

  const importRows: Row[] = useMemo(() => {
    return rawRows.map((r) => ({
      barcode: String(r[mapping.barcode] || '').trim(),
      product_name: mapping.product_name >= 0 ? String(r[mapping.product_name] || '').trim() : '',
      sku: mapping.sku >= 0 ? String(r[mapping.sku] || '').trim() : '',
      ori_qty: Number(r[mapping.ori_qty] || 0)
    })).filter((r) => r.barcode);
  }, [rawRows, mapping]);

  async function doImport() {
    setLoading(true);
    try {
      await apiJson(`/api/tickets/${params.id}/import`, { method: 'POST', body: JSON.stringify({ rows: importRows }) });
      setHeaders([]); setRawRows([]);
      await load();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function action(name: 'approve' | 'complete') {
    setLoading(true);
    setError('');
    try {
      await apiJson(`/api/tickets/${params.id}/${name}`, { method: 'POST' });
      await load();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (!data) return <Shell><div className="card">Đang tải phiếu...</div></Shell>;
  const ticket = data.ticket;
  const pendingSync = Number(data.stats?.pending_sync_batches || 0) > 0;

  return (
    <Shell>
      <PageHeader title={ticket.name} description={`${ticket.code} • ${ticket.stores?.name || ''} ${ticket.slots?.name ? '• ' + ticket.slots.name : ''}`} action={<StatusBadge status={ticket.status} />} />
      {error ? <div className="error" style={{ marginBottom: 12 }}>{error}</div> : null}
      <div className="card toolbar" style={{ marginBottom: 16 }}>
        <button className="btn secondary" onClick={() => location.href = '/tickets'}>Quay lại</button>
        <button className="btn" disabled={loading || !['NEW','IMPORTED','REOPEN'].includes(ticket.status)} onClick={() => action('approve')}>Xác nhận cho PDA scan</button>
        <button className="btn success" disabled={loading || pendingSync || !['APPROVED','INPROCESS','REOPEN'].includes(ticket.status)} onClick={() => action('complete')}>Hoàn tất kiểm kê</button>
        {pendingSync ? <span className="notice">Còn batch PDA đang xử lý, tạm khóa hoàn tất.</span> : null}
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card stat"><span>Dòng hàng</span><strong>{formatNumber(data.stats?.total_items)}</strong></div>
        <div className="card stat"><span>SL sổ sách</span><strong>{formatNumber(data.stats?.total_ori_qty)}</strong></div>
        <div className="card stat"><span>SL thực tế</span><strong>{formatNumber(data.stats?.total_real_qty)}</strong></div>
        <div className="card stat"><span>Dòng lệch</span><strong>{formatNumber(data.stats?.discrepancy_items)}</strong></div>
      </div>

      <div className="card grid" style={{ marginBottom: 16 }}>
        <h3>Import sổ sách Excel/CSV</h3>
        <input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        {headers.length ? <div className="grid grid-4">
          {(['barcode','product_name','sku','ori_qty'] as const).map((key) => <label key={key} className="label">{key}
            <select className="select" value={(mapping as any)[key]} onChange={(e) => setMapping({ ...mapping, [key]: Number(e.target.value) })}>
              <option value={-1}>Không map</option>
              {headers.map((h, idx) => <option key={idx} value={idx}>{h}</option>)}
            </select>
          </label>)}
          <button className="btn" disabled={!importRows.length || mapping.barcode < 0 || loading} onClick={doImport}>Nạp {formatNumber(importRows.length)} dòng</button>
        </div> : <div className="notice">Chọn file để hệ thống tự đọc cột và preview dữ liệu.</div>}
      </div>

      <div className="card">
        <h3>Hàng hóa đối soát</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Barcode</th><th>SKU</th><th>Tên hàng</th><th>Sổ sách</th><th>Thực tế</th><th>Lệch</th><th>Trạng thái</th></tr></thead>
            <tbody>{data.inventories.map((r: any) => <tr key={r.id}><td>{r.barcode}</td><td>{r.sku}</td><td>{r.product_name}</td><td>{formatNumber(r.ori_qty)}</td><td>{formatNumber(r.real_qty)}</td><td>{formatNumber(r.diff_qty)}</td><td><StatusBadge status={r.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
