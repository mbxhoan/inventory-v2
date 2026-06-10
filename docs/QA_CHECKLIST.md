# QA checklist

## Web admin

- [ ] Login manager thành công.
- [ ] Dashboard hiển thị đúng số phiếu và trạng thái.
- [ ] Tạo store mới.
- [ ] Tạo slot mới theo store.
- [ ] Tạo ticket có dữ liệu sổ sách → status `NEW`.
- [ ] Import Excel/CSV → status `IMPORTED`.
- [ ] Approve ticket → status `APPROVED`.
- [ ] Không complete được khi có batch sync `NEW`/`PROCESSING`.
- [ ] Complete thành công khi không còn batch đang xử lý.

## Scanner

- [ ] Login bằng user PDA.
- [ ] Chỉ thấy ticket `APPROVED`/`INPROCESS` cùng công ty.
- [ ] Scan barcode liên tục không mất focus.
- [ ] Offline queue giữ dữ liệu sau refresh.
- [ ] Sync batch thành công.
- [ ] Barcode không có trong sổ sách được tạo `NOTFOUND`.
- [ ] Scan trùng timestamp không insert lặp.

## Data isolation

- [ ] User công ty A không thấy store/ticket công ty B.
- [ ] PDA user chỉ sync được ticket cùng `company_id`.
