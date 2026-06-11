'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Flag, Download, Upload, FileSpreadsheet, Info } from 'lucide-react';
import Shell from '@/components/Shell';
import PageHeader from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { apiJson, formatNumber } from '@/lib/api';
import { IMPORT_COLUMNS, validateImportRows, downloadTemplate, type ParsedRow } from '@/lib/import-template';

function guessIndex(headers: string[], keywords: string[]) {
  const lower = headers.map((h) => h.toLowerCase());
  return lower.findIndex((h) => keywords.some((k) => h.includes(k)));
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState({ barcode: -1, product_name: -1, sku: -1, ori_qty: -1 });
  const [showGuide, setShowGuide] = useState(true);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await apiJson<any>(`/api/tickets/${id}`);
      setData(res);
    } catch (err: any) {
      toast.error(err.message);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function readFile(file: File) {
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
      const h = (rows[0] || []).map(String);
      setHeaders(h);
      setRawRows(rows.slice(1));
      setFileName(file.name);
      setMapping({
        barcode: guessIndex(h, ['barcode', 'mã vạch', 'ma vach', 'item']),
        product_name: guessIndex(h, ['product_name', 'product', 'tên', 'ten', 'name', 'hàng', 'hang']),
        sku: guessIndex(h, ['sku', 'mã hàng', 'ma hang']),
        ori_qty: guessIndex(h, ['ori_qty', 'ori', 'sổ sách', 'so sach', 'qty', 'sl', 'quantity'])
      });
    } catch {
      toast.error('Không đọc được file. Kiểm tra định dạng .xlsx/.csv.');
    }
  }

  // Dòng đã map kèm số dòng thực trong file (header = dòng 1).
  const parsedRows: ParsedRow[] = useMemo(() => {
    return rawRows
      .map((r, idx) => ({
        rowNumber: idx + 2,
        barcode: mapping.barcode >= 0 ? String(r[mapping.barcode] ?? '').trim() : '',
        product_name: mapping.product_name >= 0 ? String(r[mapping.product_name] ?? '').trim() : '',
        sku: mapping.sku >= 0 ? String(r[mapping.sku] ?? '').trim() : '',
        ori_qty_raw: mapping.ori_qty >= 0 ? String(r[mapping.ori_qty] ?? '').trim() : ''
      }))
      .filter((r) => r.barcode || r.product_name || r.sku || r.ori_qty_raw);
  }, [rawRows, mapping]);

  const errors = useMemo(() => (mapping.barcode < 0 ? [] : validateImportRows(parsedRows)), [parsedRows, mapping.barcode]);

  const importRows = useMemo(
    () => parsedRows.filter((r) => r.barcode).map((r) => ({
      barcode: r.barcode,
      sku: r.sku,
      product_name: r.product_name,
      ori_qty: r.ori_qty_raw === '' ? 0 : Number(r.ori_qty_raw.replace(/,/g, ''))
    })),
    [parsedRows]
  );

  function resetImport() {
    setHeaders([]); setRawRows([]); setFileName('');
  }

  async function doImport() {
    if (mapping.barcode < 0) { toast.error('Cần map cột barcode trước khi nạp.'); return; }
    if (errors.length) { toast.error(`Còn ${errors.length} lỗi trong file. Sửa file rồi nạp lại.`); return; }
    setLoading(true);
    try {
      const res = await apiJson<any>(`/api/tickets/${id}/import`, { method: 'POST', body: JSON.stringify({ rows: importRows }) });
      toast.success(`Đã nạp ${formatNumber(res.imported_rows ?? importRows.length)} dòng vào hệ thống.`);
      resetImport();
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function action(name: 'approve' | 'complete') {
    setLoading(true);
    try {
      await apiJson(`/api/tickets/${id}/${name}`, { method: 'POST' });
      toast.success(name === 'approve' ? 'Đã xác nhận, PDA có thể quét.' : 'Đã hoàn tất kiểm kê.');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!data) return <Shell><div className="card">Đang tải phiếu…</div></Shell>;
  const ticket = data.ticket;
  const pendingSync = Number(data.stats?.pending_sync_batches || 0) > 0;

  return (
    <Shell>
      <PageHeader
        title={ticket.name}
        description={`${ticket.code} • ${ticket.stores?.name || ''} ${ticket.slots?.name ? '• ' + ticket.slots.name : ''}`}
        action={<StatusBadge status={ticket.status} />}
      />

      <div className="card toolbar" style={{ marginBottom: 14 }}>
        <button className="btn secondary sm" onClick={() => (location.href = '/tickets')}><ArrowLeft size={14} /> Quay lại</button>
        <button className="btn sm" disabled={loading || !['NEW', 'IMPORTED', 'REOPEN'].includes(ticket.status)} onClick={() => action('approve')}><CheckCircle2 size={14} /> Xác nhận cho PDA scan</button>
        <button className="btn success sm" disabled={loading || pendingSync || !['APPROVED', 'INPROCESS', 'REOPEN'].includes(ticket.status)} onClick={() => action('complete')}><Flag size={14} /> Hoàn tất kiểm kê</button>
        {pendingSync ? <span className="notice">Còn batch PDA đang xử lý, tạm khóa hoàn tất.</span> : null}
      </div>

      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <div className="card stat"><span>Dòng hàng</span><strong>{formatNumber(data.stats?.total_items)}</strong></div>
        <div className="card stat"><span>SL sổ sách</span><strong>{formatNumber(data.stats?.total_ori_qty)}</strong></div>
        <div className="card stat"><span>SL thực tế</span><strong>{formatNumber(data.stats?.total_real_qty)}</strong></div>
        <div className="card stat"><span>Dòng lệch</span><strong>{formatNumber(data.stats?.discrepancy_items)}</strong></div>
      </div>

      <div className="card grid" style={{ marginBottom: 14 }}>
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Import sổ sách Excel/CSV</h3>
          <div className="toolbar">
            <button className="btn secondary sm" onClick={() => setShowGuide((v) => !v)}><Info size={14} /> {showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}</button>
            <button className="btn secondary sm" onClick={() => downloadTemplate()}><Download size={14} /> Tải template</button>
          </div>
        </div>

        {showGuide ? (
          <div className="notice" style={{ display: 'grid', gap: 8 }}>
            <strong>Cách chuẩn bị file</strong>
            <div>Dòng 1 là tiêu đề cột. Mỗi dòng tiếp theo là một sản phẩm. Tải template để dùng đúng cấu trúc.</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Cột</th><th>Tên cột</th><th>Bắt buộc</th><th>Ý nghĩa &amp; giá trị</th><th>Ví dụ</th></tr></thead>
                <tbody>
                  {IMPORT_COLUMNS.map((c) => (
                    <tr key={c.key}>
                      <td><code>{c.header}</code></td>
                      <td>{c.label}</td>
                      <td>{c.required ? <span className="badge NOTFOUND">Bắt buộc</span> : <span className="badge">Tùy chọn</span>}</td>
                      <td>{c.description}</td>
                      <td>{c.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <label className="label">Chọn file sổ sách
          <input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        </label>

        {headers.length ? (
          <>
            <div className="toolbar muted"><FileSpreadsheet size={15} /> {fileName} • {formatNumber(parsedRows.length)} dòng dữ liệu</div>
            <div className="grid grid-4">
              {IMPORT_COLUMNS.map((c) => (
                <label key={c.key} className="label">{c.label}{c.required ? ' *' : ''}
                  <select className={`select ${c.required && (mapping as any)[c.key] < 0 ? 'invalid' : ''}`} value={(mapping as any)[c.key]} onChange={(e) => setMapping({ ...mapping, [c.key]: Number(e.target.value) })}>
                    <option value={-1}>Không map</option>
                    {headers.map((h, idx) => <option key={idx} value={idx}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>

            {mapping.barcode < 0 ? (
              <div className="error">Chưa map cột <strong>barcode</strong> (bắt buộc).</div>
            ) : errors.length ? (
              <div className="grid" style={{ gap: 8 }}>
                <div className="error">Phát hiện {errors.length} lỗi. Vui lòng sửa file và nạp lại trước khi import.</div>
                <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  <table>
                    <thead><tr><th>Dòng</th><th>Cột</th><th>Giá trị</th><th>Lỗi</th></tr></thead>
                    <tbody>
                      {errors.slice(0, 200).map((er, i) => (
                        <tr key={i}>
                          <td>{er.row}</td>
                          <td><code>{er.column}</code></td>
                          <td>{er.value || <span className="muted">(trống)</span>}</td>
                          <td style={{ color: 'var(--danger)' }}>{er.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {errors.length > 200 ? <div className="muted">… và {errors.length - 200} lỗi khác.</div> : null}
              </div>
            ) : (
              <div className="notice">File hợp lệ. Sẵn sàng nạp {formatNumber(importRows.length)} dòng.</div>
            )}

            <div className="toolbar">
              <button className="btn secondary sm" onClick={resetImport} disabled={loading}>Hủy file</button>
              <button className="btn sm" disabled={loading || mapping.barcode < 0 || errors.length > 0 || !importRows.length} onClick={doImport}>
                <Upload size={14} /> Nạp {formatNumber(importRows.length)} dòng
              </button>
            </div>
          </>
        ) : (
          <div className="notice">Chọn file để hệ thống tự đọc cột, kiểm tra lỗi và preview trước khi nạp.</div>
        )}
      </div>

      <div className="card">
        <h3>Hàng hóa đối soát</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Barcode</th><th>SKU</th><th>Tên hàng</th><th>Sổ sách</th><th>Thực tế</th><th>Lệch</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {data.inventories.length ? data.inventories.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.barcode}</td>
                  <td>{r.sku}</td>
                  <td>{r.product_name}</td>
                  <td>{formatNumber(r.ori_qty)}</td>
                  <td>{formatNumber(r.real_qty)}</td>
                  <td>{formatNumber(r.diff_qty)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              )) : <tr><td colSpan={7} className="muted">Chưa có dữ liệu hàng hóa.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
