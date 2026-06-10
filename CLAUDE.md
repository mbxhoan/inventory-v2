# CLAUDE.md - Claude Code guide

## Context

Bạn đang làm việc trong workspace **Inventory - Kiểm kê thời đại mới**. Đây là bản V2 của hệ thống kiểm kê, chuyển từ Laravel/MySQL sang Next.js + Supabase/PostgreSQL.

## Ưu tiên khi code

1. Giữ đúng nghiệp vụ kiểm kê, trạng thái phiếu và luồng scanner.
2. Viết code nhỏ, rõ, dễ maintain.
3. Không thêm dependency nặng nếu CSS/components tự viết được.
4. Mọi API phải bảo vệ theo session và `company_id`.
5. Scanner phải chạy tốt trên màn hình PDA nhỏ.
6. Không dùng tên/branding cũ.

## Khi nhận task

Luôn kiểm tra trước:

- Task thuộc `web`, `scanner`, `supabase` hay docs/agents?
- Có ảnh hưởng schema/RPC không?
- Có làm sai trạng thái ticket không?
- Có làm lộ service role ra client không?
- Có ảnh hưởng offline queue scanner không?

## Commands

```bash
pnpm dev:web
pnpm dev:scanner
pnpm lint
pnpm typecheck
supabase db reset
```

## Không được làm

- Không bỏ qua fail-safe complete khi PDA đang sync.
- Không gọi service role trong client component.
- Không xóa dữ liệu hard delete nếu có thể soft delete.
- Không làm scanner thành UI phức tạp nhiều bước.
