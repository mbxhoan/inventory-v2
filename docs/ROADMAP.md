# Roadmap nâng cấp sau MVP

## Phase 1 - Hardening

- Supabase Auth + custom claims `company_id`, `role`, `user_type`.
- RLS strict toàn bộ table.
- Audit log đầy đủ cho status transition/import/sync.
- Server-side pagination cho inventory/detail lớn.
- Export Excel report.

## Phase 2 - Queue & Import lớn

- Worker xử lý import Excel lớn.
- `pda_syncs` lưu payload vào Supabase Storage.
- Retry/failure dashboard.
- Job lock theo `ticket_id` để chống race condition.

## Phase 3 - SaaS billing/license

- Gói dịch vụ theo `data_limit_per_inventory` và `data_limit_total`.
- Quản lý số PDA/user theo công ty.
- Device binding/license cho scanner.

## Phase 4 - Native PDA

- Bọc PWA trong Android WebView hoặc build native Kotlin.
- Tích hợp SDK máy quét theo hãng.
- Block soft keyboard chuẩn thiết bị.
