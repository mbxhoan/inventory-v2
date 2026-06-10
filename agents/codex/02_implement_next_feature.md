# Codex prompt - Implement feature safely

Nhiệm vụ: triển khai feature mới cho Inventory SaaS V2.

Quy trình bắt buộc:

1. Đọc `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`.
2. Xác định feature thuộc `web`, `scanner`, `supabase` hay nhiều module.
3. Nếu đổi database, tạo migration mới.
4. Không để secret ở client.
5. Bảo toàn `company_id` isolation.
6. Viết UI tiếng Việt tối giản, rõ hành động.
7. Cập nhật docs và QA checklist.
8. Chạy typecheck/lint nếu môi trường cho phép.

Output cuối: tóm tắt file đã sửa, cách test, rủi ro còn lại.
