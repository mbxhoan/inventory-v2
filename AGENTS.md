# AGENTS.md - Inventory SaaS V2

## Product name

Tên sản phẩm chính thức: **Inventory - Kiểm kê thời đại mới**.

Không đổi về tên/branding cũ. Không dùng logo/tên cũ trong UI, metadata, README, seed data hoặc comment hiển thị.

## Mission

Xây dựng app kiểm kê SaaS đa công ty bằng:

- Next.js App Router.
- Supabase PostgreSQL.
- Web admin trong `web/`.
- Scanner responsive PWA trong `scanner/`.
- Database/RPC trong `supabase/`.

Ưu tiên: tối giản, dễ dùng, ổn định, không lỗi vận hành.

## Business invariants

1. Mọi dữ liệu nghiệp vụ phải có `company_id`.
2. `Ticket` chỉ được scanner tải khi status là `APPROVED` hoặc `INPROCESS`.
3. Không cho complete ticket khi còn `pda_syncs.status in ('NEW','PROCESSING')`.
4. Dedupe scan bằng `(ticket_id, user_id, barcode, scan_time)`.
5. Barcode scan không có trong sổ sách phải tạo inventory `NOTFOUND` với `ori_qty = 0`.
6. `real_qty` là tổng từ `inventory_details` theo ticket + barcode.
7. Scanner phải ưu tiên thao tác nhanh: focus input, queue offline, sync rõ trạng thái.

## Code rules

- Không hardcode company/user ngoài seed/demo.
- Không gọi Supabase service role ở browser.
- Không để secret trong `NEXT_PUBLIC_*`.
- API route phải đọc session và filter `company_id`.
- UI phải dùng tiếng Việt thân thiện, câu ngắn, rõ hành động.
- Tránh thư viện UI nặng nếu chưa cần.
- Bảng lớn phải chuẩn bị pagination/search.
- Khi sửa schema, thêm migration mới, không sửa migration đã chạy nếu repo đã public.

## Folder ownership

| Folder | Mục đích |
|---|---|
| `web/` | App quản trị web |
| `scanner/` | App scan/PWA |
| `supabase/` | DB schema, seed, RPC |
| `docs/` | Tài liệu kỹ thuật và QA |
| `agents/` | Prompt pack cho coding agent |

## Definition of done

- `pnpm lint` không lỗi.
- `pnpm typecheck` không lỗi.
- Luồng web: login → tạo ticket → import → approve → xem báo cáo chạy được.
- Luồng scanner: login PDA → chọn ticket → scan → sync chạy được.
- Không phá isolation `company_id`.
- Cập nhật docs/agent rules nếu đổi nghiệp vụ.
