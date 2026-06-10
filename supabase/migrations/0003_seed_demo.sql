do $$
declare
  v_company uuid;
  v_store uuid;
  v_slot uuid;
  v_manager uuid;
  v_pda uuid;
  v_ticket uuid;
begin
  insert into public.companies(name, slug, plan, data_limit_per_inventory, data_limit_total)
  values('Công ty Demo', 'demo-company', 'starter', 100000, 1000000)
  on conflict(slug) do update set name = excluded.name
  returning id into v_company;

  insert into public.stores(company_id, code, name, address)
  values(v_company, 'STORE-HCM-01', 'Cửa hàng HCM 01', 'Quận 1, TP.HCM')
  on conflict(company_id, code) do update set name = excluded.name
  returning id into v_store;

  insert into public.slots(company_id, store_id, code, name)
  values(v_company, v_store, 'A1', 'Kệ A1')
  on conflict(store_id, code) do update set name = excluded.name
  returning id into v_slot;

  insert into public.app_users(company_id, email, full_name, role, user_type, pin)
  values(null, 'admin@inventory.local', 'System Admin', 'system_admin', 'ADMIN', '123456')
  on conflict(email) do update set pin = excluded.pin;

  insert into public.app_users(company_id, email, full_name, role, user_type, pin)
  values(v_company, 'manager@inventory.local', 'Quản lý Demo', 'tenant_admin', 'WEB', '123456')
  on conflict(email) do update set company_id = excluded.company_id, pin = excluded.pin
  returning id into v_manager;

  insert into public.app_users(company_id, email, full_name, role, user_type, pin)
  values(v_company, 'pda@inventory.local', 'Nhân viên PDA Demo', 'operator', 'PDA', '123456')
  on conflict(email) do update set company_id = excluded.company_id, pin = excluded.pin
  returning id into v_pda;

  insert into public.tickets(company_id, store_id, slot_id, code, name, inventory_date, status, has_book_data, created_by)
  values(v_company, v_store, v_slot, 'KK-DEMO-001', 'Phiếu kiểm kê demo', current_date, 'APPROVED', true, v_manager)
  on conflict(company_id, code) do update set status = excluded.status
  returning id into v_ticket;

  insert into public.inventories(company_id, ticket_id, barcode, sku, product_name, ori_qty, real_qty, status)
  values
    (v_company, v_ticket, '8935001234567', 'SP-A', 'Sản phẩm A', 10, 0, 'NEW'),
    (v_company, v_ticket, '8935007654321', 'SP-B', 'Sản phẩm B', 5, 0, 'NEW'),
    (v_company, v_ticket, '8935011111111', 'SP-C', 'Sản phẩm C', 20, 0, 'NEW')
  on conflict(ticket_id, barcode) do update set product_name = excluded.product_name, ori_qty = excluded.ori_qty;
end $$;
