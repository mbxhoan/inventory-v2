#!/usr/bin/env bash
set -euo pipefail
cat <<'MSG'
Chạy lệnh này sau khi `supabase start`, sau đó copy thủ công URL/key từ `supabase status` vào:
- web/.env.local
- scanner/.env.local
MSG
supabase status
