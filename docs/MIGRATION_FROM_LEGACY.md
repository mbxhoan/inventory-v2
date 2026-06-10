# Migration notes từ hệ thống kiểm kê cũ sang V2

## Những phần giữ lại

- Company là tenant.
- Store/Slot/Ticket là lõi nghiệp vụ.
- Inventory là dữ liệu sổ sách/tổng hợp.
- InventoryDetail là lịch sử scan thực tế.
- PdaSync là batch đồng bộ PDA.
- Ticket statuses: `NEW`, `IMPORTING`, `IMPORTED`, `APPROVED`, `INPROCESS`, `COMPLETED`, `REOPEN`, `CLOSED`, `DELETED`.
- Dynamic import mapping cho file Excel.
- Fail-safe không cho complete khi PDA sync chưa xử lý xong.

## Những phần thay đổi

| Cũ | V2 |
|---|---|
| Laravel/MySQL | Next.js + Supabase PostgreSQL |
| Blade/AdminLTE | App Router + CSS tối giản |
| Sanctum/PDA API | Scanner PWA + Next API route + RPC |
| Queue Laravel | RPC transaction cho MVP; production tách worker sau |
| Domain web/api/admin | Workspace `web` + `scanner` + `supabase` |

## Nguyên tắc chuyển đổi

- Không đổi logic đối soát: `diff_qty = real_qty - ori_qty`.
- Không mất dữ liệu scan khi offline.
- Không cho scanner ghi ngoài `company_id` của user.
- Không dùng lại tên/branding cũ trong giao diện mới.
