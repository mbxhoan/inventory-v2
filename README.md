# Inventory - Kiểm kê thời đại mới

Workspace Next.js + PostgreSQL Supabase cho phiên bản 2 của app kiểm kê theo mô hình SaaS đa công ty.

## Cấu trúc workspace

```txt
inventory-saas-v2/
├─ web/          # Web admin/quản lý: công ty, cửa hàng, phiếu, import, báo cáo
├─ scanner/      # App scan responsive PWA: login PDA, danh sách phiếu, scan, offline queue, sync
├─ supabase/     # Migration, seed, RPC nghiệp vụ, view báo cáo
├─ docs/         # Tài liệu triển khai, kiến trúc, QA
├─ agents/       # Agent pack cho Codex & Claude Code
├─ AGENTS.md     # Quy tắc chung cho coding agents
└─ CLAUDE.md     # Quy tắc riêng cho Claude Code
```

## Tài khoản demo seed sẵn

| Vai trò | Email | Mã PIN |
|---|---|---|
| Admin hệ thống | `admin@inventory.local` | `123456` |
| Quản lý công ty | `manager@inventory.local` | `123456` |
| Nhân viên PDA | `pda@inventory.local` | `123456` |

## Chạy local nhanh

### 1. Chuẩn bị

Cài Node.js 20+, pnpm, Docker và Supabase CLI.

```bash
corepack enable
npm i -g supabase
```

### 2. Khởi động Supabase local

```bash
cd inventory-saas-v2
supabase start
supabase db reset
```

Lấy `anon key` và `service_role key`:

```bash
supabase status
```

### 3. Cấu hình env

```bash
cp .env.example .env
cp web/.env.example web/.env.local
cp scanner/.env.example scanner/.env.local
```

Điền các giá trị từ `supabase status` vào `web/.env.local` và `scanner/.env.local`.

### 4. Cài package và chạy app

```bash
pnpm install
pnpm dev
```

Mặc định:

- Web admin: <http://localhost:3000>
- Scanner PWA: <http://localhost:3001>
- Supabase Studio: <http://127.0.0.1:54323>

## Luồng nghiệp vụ đã implement

### Web admin

- Đăng nhập theo user seed/demo.
- Dashboard thống kê số phiếu, trạng thái, dữ liệu sync.
- Quản lý cửa hàng và vị trí quét.
- Tạo phiếu kiểm kê theo công ty/cửa hàng/vị trí.
- Import danh mục tồn kho từ Excel/CSV bằng import wizard có mapping cột động.
- Xác nhận phiếu sang trạng thái `APPROVED`.
- Xem chi tiết phiếu, tồn sổ sách, tồn thực tế, chênh lệch.
- Hoàn tất phiếu, có chặn nếu còn batch PDA đang xử lý.
- Báo cáo chênh lệch theo phiếu.

### Scanner PWA

- Đăng nhập user loại `PDA`.
- Xem danh sách phiếu trạng thái `APPROVED`/`INPROCESS`.
- Mở phiếu kiểm kê.
- Quét barcode bằng input tối giản, ưu tiên máy PDA/hardware scanner.
- Cộng dồn offline queue theo barcode và timestamp mili giây.
- Đồng bộ lên server bằng RPC `rpc_pda_sync`.
- Có service worker, manifest, responsive mobile/PDA.

## Ghi chú bảo mật

Bản này là **MVP chạy được ngay** để team tiếp tục phát triển. Auth hiện dùng session cookie ký HMAC ở Next.js server và Supabase service role chỉ chạy ở server route. Khi lên production, nên nâng cấp:

1. Chuyển user sang Supabase Auth hoặc SSO doanh nghiệp.
2. Đưa `company_id`, `role`, `user_type` vào JWT claims.
3. Bật RLS strict theo `company_id`.
4. Tách worker queue cho import/sync lớn.
5. Bổ sung audit log chi tiết và rate limit.

## Lệnh hữu ích

```bash
pnpm dev:web
pnpm dev:scanner
pnpm lint
pnpm typecheck
```

## Triết lý giao diện

- Không dùng tên/branding cũ.
- Tối giản, dễ dùng, ưu tiên thao tác nhanh.
- Bảng lớn cần phân trang/server-side ở giai đoạn production.
- Scanner không rườm rà: login → chọn phiếu → scan → sync.
