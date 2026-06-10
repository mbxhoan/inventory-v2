export type ScanRow = {
  id: string;
  barcode: string;
  real_qty: number;
  scan_time: string;
  note?: string;
};

export function queueKey(ticketId: string) {
  return `inventory_scanner_queue_${ticketId}`;
}

export function loadQueue(ticketId: string): ScanRow[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(queueKey(ticketId)) || '[]'); }
  catch { return []; }
}

export function saveQueue(ticketId: string, rows: ScanRow[]) {
  localStorage.setItem(queueKey(ticketId), JSON.stringify(rows));
}

export function clearQueue(ticketId: string) {
  localStorage.removeItem(queueKey(ticketId));
}
