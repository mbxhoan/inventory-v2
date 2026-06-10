# Codex prompt - Supabase hardening

Hãy rà soát Supabase schema/RPC để nâng cấp production:

- Bật RLS strict theo `company_id`.
- Đề xuất custom claims cho Supabase Auth.
- Kiểm tra RPC security definer/search_path.
- Kiểm tra index cho ticket/inventory/detail/sync.
- Đề xuất rate limit/API guard ở Next.js.
- Không phá local MVP.

Trả về plan theo phase và patch nếu an toàn.
