'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiJson, formatNumber } from '@/lib/api';
import { clearQueue, loadQueue, saveQueue, type ScanRow } from '@/lib/offline-queue';

type Props = { params: { id: string } };

export default function ScanPage({ params }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [inventories, setInventories] = useState<any[]>([]);
  const [queue, setQueue] = useState<ScanRow[]>([]);
  const [barcode, setBarcode] = useState('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [blockKeyboard, setBlockKeyboard] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { setQueue(loadQueue(params.id)); apiJson<any>(`/api/tickets/${params.id}`).then((d) => { setTicket(d.ticket); setInventories(d.inventories); }).catch((e) => setError(e.message)); }, [params.id]);
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 100); return () => clearTimeout(t); }, [queue.length, message]);

  const totalQty = useMemo(() => queue.reduce((sum, r) => sum + Number(r.real_qty || 0), 0), [queue]);
  const known = useMemo(() => new Map(inventories.map((i) => [i.barcode, i])), [inventories]);

  function addScan(code = barcode) {
    const clean = code.trim();
    if (!clean) return;
    const row: ScanRow = { id: `${Date.now()}-${Math.random()}`, barcode: clean, real_qty: Number(qty || 1), scan_time: new Date().toISOString(), note };
    const next = [row, ...queue];
    setQueue(next); saveQueue(params.id, next);
    setBarcode(''); setNote(''); setMessage(`Đã quét ${clean}`); setError('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      addScan();
    }
  }

  async function sync() {
    if (queue.length === 0) return;
    setSyncing(true); setError(''); setMessage('');
    try {
      const res: any = await apiJson('/api/sync', { method: 'POST', body: JSON.stringify({ ticket_id: params.id, rows: queue }) });
      clearQueue(params.id); setQueue([]); setMessage(`Đồng bộ xong: ${res.imported_records}/${res.total_records} dòng mới.`);
      const fresh = await apiJson<any>(`/api/tickets/${params.id}`); setInventories(fresh.inventories); setTicket(fresh.ticket);
    } catch (err: any) { setError(err.message); }
    finally { setSyncing(false); }
  }

  if (!ticket) return <main className="wrap"><div className="card">Đang mở phiếu...</div>{error ? <div className="error">{error}</div> : null}</main>;

  return <main className="wrap">
    <div className="top"><div className="brand">{ticket.code}<span>{ticket.name}</span></div></div>
    <div className="grid">
      <div className="counter">
        <div className="card"><span className="muted">Dòng chờ</span><strong>{formatNumber(queue.length)}</strong></div>
        <div className="card"><span className="muted">SL chờ</span><strong>{formatNumber(totalQty)}</strong></div>
        <div className="card"><span className={`badge ${ticket.status}`}>{ticket.status}</span></div>
      </div>
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="error">{error}</div> : null}
      <div className="card grid">
        <label className="label">Barcode
          <input ref={inputRef} className="input scan-input" value={barcode} inputMode={blockKeyboard ? 'none' : 'text'} autoFocus onChange={(e) => setBarcode(e.target.value)} onKeyDown={onKeyDown} placeholder="Quét mã" />
        </label>
        <label className="label">Số lượng<input className="input" type="number" min="0.001" step="0.001" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <label className="label">Ghi chú nhanh<input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: móp vỏ" /></label>
        <label className="label"><span>Chặn bàn phím ảo</span><select className="select" value={String(blockKeyboard)} onChange={(e) => setBlockKeyboard(e.target.value === 'true')}><option value="true">Bật</option><option value="false">Tắt</option></select></label>
        <button className="btn" onClick={() => addScan()}>Thêm lượt quét</button>
        <button className="btn success" disabled={syncing || queue.length === 0} onClick={sync}>{syncing ? 'Đang sync...' : 'Đồng bộ'}</button>
        <button className="btn secondary" onClick={() => location.href = '/tickets'}>Về danh sách phiếu</button>
      </div>
      <div className="card">
        <strong>Queue gần nhất</strong>
        {queue.slice(0, 8).map((r) => <div className="row" key={r.id}><div><b>{r.barcode}</b><div className="muted">{known.get(r.barcode)?.product_name || 'Ngoài danh mục / chưa tải tên'}</div></div><div>SL {formatNumber(r.real_qty)}</div></div>)}
        {queue.length === 0 ? <p className="muted">Chưa có dòng chờ đồng bộ.</p> : null}
      </div>
    </div>
  </main>;
}
