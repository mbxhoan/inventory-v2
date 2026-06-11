// Định nghĩa cột chuẩn của file sổ sách import.
export type ImportColumn = {
  key: 'barcode' | 'sku' | 'product_name' | 'ori_qty';
  header: string;
  label: string;
  required: boolean;
  description: string;
  example: string;
};

export const IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'barcode', header: 'barcode', label: 'Mã vạch', required: true, description: 'Mã vạch sản phẩm. Bắt buộc, không được trống và không trùng nhau trong cùng file.', example: '8935001234567' },
  { key: 'sku', header: 'sku', label: 'Mã hàng (SKU)', required: false, description: 'Mã hàng nội bộ. Có thể để trống.', example: 'SP-A' },
  { key: 'product_name', header: 'product_name', label: 'Tên hàng', required: false, description: 'Tên sản phẩm hiển thị khi đối soát. Có thể để trống.', example: 'Giày pickleball' },
  { key: 'ori_qty', header: 'ori_qty', label: 'SL sổ sách', required: false, description: 'Số lượng theo sổ sách. Là số ≥ 0, để trống sẽ tính bằng 0.', example: '10' }
];

export type ParsedRow = {
  rowNumber: number; // số dòng trong file Excel (đã tính header = dòng 1)
  barcode: string;
  sku: string;
  product_name: string;
  ori_qty_raw: string;
};

export type ImportError = {
  row: number;
  column: string;
  value: string;
  error: string;
};

// Kiểm tra dữ liệu trước khi nạp; trả danh sách lỗi chi tiết theo dòng/cột.
export function validateImportRows(rows: ParsedRow[]): ImportError[] {
  const errors: ImportError[] = [];
  const seen = new Map<string, number>(); // barcode -> dòng đầu tiên

  for (const r of rows) {
    const barcode = r.barcode.trim();

    if (!barcode) {
      errors.push({ row: r.rowNumber, column: 'barcode', value: '', error: 'Thiếu barcode (bắt buộc).' });
    } else {
      const first = seen.get(barcode);
      if (first !== undefined) {
        errors.push({ row: r.rowNumber, column: 'barcode', value: barcode, error: `Trùng barcode với dòng ${first}.` });
      } else {
        seen.set(barcode, r.rowNumber);
      }
    }

    const qty = r.ori_qty_raw.trim();
    if (qty !== '') {
      const n = Number(qty.replace(/,/g, ''));
      if (!Number.isFinite(n)) {
        errors.push({ row: r.rowNumber, column: 'ori_qty', value: qty, error: 'Số lượng sổ sách không phải là số.' });
      } else if (n < 0) {
        errors.push({ row: r.rowNumber, column: 'ori_qty', value: qty, error: 'Số lượng sổ sách không được âm.' });
      }
    }
  }

  return errors;
}

// Tạo và tải file Excel mẫu (header chuẩn + 2 dòng ví dụ).
export async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const header = IMPORT_COLUMNS.map((c) => c.header);
  const samples = [
    ['8935001234567', 'SP-A', 'Giày pickleball', 10],
    ['8935007654321', 'SP-B', 'Vợt tennis', 5]
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...samples]);
  ws['!cols'] = IMPORT_COLUMNS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'so_sach');
  XLSX.writeFile(wb, 'mau_so_sach_kiem_ke.xlsx');
}
