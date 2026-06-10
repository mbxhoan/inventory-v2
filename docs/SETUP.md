# Setup chi tiết

## Local Supabase

```bash
supabase start
supabase db reset
supabase status
```

Copy URL/key vào:

- `web/.env.local`
- `scanner/.env.local`

## Web admin

```bash
pnpm dev:web
```

Mở <http://localhost:3000>.

## Scanner PWA

```bash
pnpm dev:scanner
```

Mở <http://localhost:3001>. Trên PDA Android, có thể mở Chrome và Add to Home Screen.

## Import mẫu

File Excel/CSV cần tối thiểu:

| barcode | product_name | ori_qty |
|---|---|---:|
| 8935001234567 | Sản phẩm A | 10 |
| 8935007654321 | Sản phẩm B | 5 |

Import wizard có thể map tên cột khác như `Mã vạch`, `Tên hàng`, `SL sổ sách`.
