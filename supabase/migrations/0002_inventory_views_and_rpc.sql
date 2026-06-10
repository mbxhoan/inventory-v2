create or replace view public.v_ticket_stats as
select
  t.id as ticket_id,
  t.company_id,
  t.store_id,
  t.slot_id,
  t.code,
  t.name,
  t.status,
  count(i.id)::integer as total_items,
  coalesce(sum(i.ori_qty), 0)::numeric(18,3) as total_ori_qty,
  coalesce(sum(i.real_qty), 0)::numeric(18,3) as total_real_qty,
  coalesce(sum(i.diff_qty), 0)::numeric(18,3) as total_diff_qty,
  count(i.id) filter (where i.diff_qty <> 0)::integer as discrepancy_items,
  count(i.id) filter (where i.status = 'NOTFOUND')::integer as notfound_items,
  count(ps.id) filter (where ps.status in ('NEW','PROCESSING'))::integer as pending_sync_batches
from public.tickets t
left join public.inventories i on i.ticket_id = t.id and i.status <> 'DELETED'
left join public.pda_syncs ps on ps.ticket_id = t.id
group by t.id;

create or replace view public.v_company_usage as
select
  c.id as company_id,
  c.name,
  c.data_limit_per_inventory,
  c.data_limit_total,
  count(i.id)::integer as total_inventory_rows,
  count(d.id)::integer as total_scan_rows
from public.companies c
left join public.inventories i on i.company_id = c.id and i.status <> 'DELETED'
left join public.inventory_details d on d.company_id = c.id and d.status <> 'DELETED'
group by c.id;

create or replace function public.login_app_user(p_email text, p_pin text)
returns table (
  id uuid,
  company_id uuid,
  email text,
  full_name text,
  role text,
  user_type text,
  company_name text
)
language sql
security definer
set search_path = public
as $$
  select u.id, u.company_id, u.email, u.full_name, u.role, u.user_type, c.name as company_name
  from public.app_users u
  left join public.companies c on c.id = u.company_id
  where lower(u.email) = lower(p_email)
    and u.pin = p_pin
    and u.is_active = true
    and coalesce(c.is_active, true) = true
  limit 1;
$$;

create or replace function public.rpc_import_inventory(
  p_actor_user_id uuid,
  p_ticket_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_ticket public.tickets%rowtype;
  v_limit integer;
  v_row jsonb;
  v_barcode text;
  v_name text;
  v_sku text;
  v_qty numeric;
  v_count integer := 0;
begin
  select * into v_user from public.app_users where id = p_actor_user_id and is_active = true;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id and company_id = v_user.company_id;
  if not found then
    raise exception 'TICKET_NOT_FOUND';
  end if;

  if v_ticket.status not in ('NEW','IMPORTED','APPROVED') then
    raise exception 'TICKET_STATUS_NOT_IMPORTABLE:%', v_ticket.status;
  end if;

  select data_limit_per_inventory into v_limit from public.companies where id = v_ticket.company_id;
  if jsonb_array_length(p_rows) > v_limit then
    raise exception 'DATA_LIMIT_PER_INVENTORY_EXCEEDED:%', v_limit;
  end if;

  update public.tickets set status = 'IMPORTING' where id = p_ticket_id;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_barcode := nullif(trim(coalesce(v_row->>'barcode', v_row->>'item', '')), '');
    if v_barcode is null then
      continue;
    end if;

    v_name := nullif(trim(coalesce(v_row->>'product_name', v_row->>'name', v_row->>'ten_hang', '')), '');
    v_sku := nullif(trim(coalesce(v_row->>'sku', v_row->>'ma_hang', '')), '');
    v_qty := coalesce(nullif(v_row->>'ori_qty', '')::numeric, nullif(v_row->>'qty', '')::numeric, 0);

    insert into public.inventories(company_id, ticket_id, barcode, sku, product_name, ori_qty, real_qty, status)
    values(v_ticket.company_id, p_ticket_id, v_barcode, v_sku, v_name, v_qty, 0, 'NEW')
    on conflict(ticket_id, barcode)
    do update set
      sku = excluded.sku,
      product_name = excluded.product_name,
      ori_qty = excluded.ori_qty,
      updated_at = now();

    v_count := v_count + 1;
  end loop;

  update public.tickets
  set status = case when v_count > 0 then 'IMPORTED' else 'APPROVED' end
  where id = p_ticket_id;

  insert into public.audit_logs(company_id, actor_user_id, entity_type, entity_id, action, metadata)
  values(v_ticket.company_id, p_actor_user_id, 'ticket', p_ticket_id, 'import_inventory', jsonb_build_object('rows', v_count));

  return jsonb_build_object('ok', true, 'imported_rows', v_count, 'ticket_status', case when v_count > 0 then 'IMPORTED' else 'APPROVED' end);
end;
$$;

create or replace function public.rpc_approve_ticket(p_actor_user_id uuid, p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_ticket public.tickets%rowtype;
begin
  select * into v_user from public.app_users where id = p_actor_user_id and is_active = true;
  if not found then raise exception 'USER_NOT_FOUND'; end if;

  select * into v_ticket from public.tickets where id = p_ticket_id and company_id = v_user.company_id;
  if not found then raise exception 'TICKET_NOT_FOUND'; end if;

  if v_ticket.status not in ('NEW','IMPORTED','REOPEN') then
    raise exception 'TICKET_STATUS_NOT_APPROVABLE:%', v_ticket.status;
  end if;

  update public.tickets set status = 'APPROVED', approved_at = now() where id = p_ticket_id;

  insert into public.audit_logs(company_id, actor_user_id, entity_type, entity_id, action)
  values(v_ticket.company_id, p_actor_user_id, 'ticket', p_ticket_id, 'approve');

  return jsonb_build_object('ok', true, 'status', 'APPROVED');
end;
$$;

create or replace function public.rpc_complete_ticket(p_actor_user_id uuid, p_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_ticket public.tickets%rowtype;
  v_pending integer;
begin
  select * into v_user from public.app_users where id = p_actor_user_id and is_active = true;
  if not found then raise exception 'USER_NOT_FOUND'; end if;

  select * into v_ticket from public.tickets where id = p_ticket_id and company_id = v_user.company_id;
  if not found then raise exception 'TICKET_NOT_FOUND'; end if;

  select count(*) into v_pending from public.pda_syncs where ticket_id = p_ticket_id and status in ('NEW','PROCESSING');
  if v_pending > 0 then
    raise exception 'PDA_SYNC_PENDING:%', v_pending;
  end if;

  if v_ticket.status not in ('APPROVED','INPROCESS','REOPEN') then
    raise exception 'TICKET_STATUS_NOT_COMPLETABLE:%', v_ticket.status;
  end if;

  update public.tickets set status = 'COMPLETED', completed_at = now() where id = p_ticket_id;

  insert into public.audit_logs(company_id, actor_user_id, entity_type, entity_id, action)
  values(v_ticket.company_id, p_actor_user_id, 'ticket', p_ticket_id, 'complete');

  return jsonb_build_object('ok', true, 'status', 'COMPLETED');
end;
$$;

create or replace function public.rpc_pda_sync(
  p_user_id uuid,
  p_ticket_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_ticket public.tickets%rowtype;
  v_sync_id uuid;
  v_row jsonb;
  v_barcode text;
  v_name text;
  v_note text;
  v_qty numeric;
  v_scan_time timestamptz;
  v_inserted integer := 0;
  v_total integer := 0;
begin
  select * into v_user from public.app_users where id = p_user_id and is_active = true and user_type = 'PDA';
  if not found then raise exception 'PDA_USER_NOT_FOUND'; end if;

  select * into v_ticket from public.tickets where id = p_ticket_id and company_id = v_user.company_id;
  if not found then raise exception 'TICKET_NOT_FOUND'; end if;

  if v_ticket.status not in ('APPROVED','INPROCESS') then
    raise exception 'TICKET_NOT_SYNCABLE:%', v_ticket.status;
  end if;

  v_total := coalesce(jsonb_array_length(p_rows), 0);

  insert into public.pda_syncs(company_id, ticket_id, user_id, status, payload, total_records)
  values(v_ticket.company_id, p_ticket_id, p_user_id, 'PROCESSING', p_rows, v_total)
  returning id into v_sync_id;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_barcode := nullif(trim(coalesce(v_row->>'barcode', v_row->>'item', '')), '');
    if v_barcode is null then
      continue;
    end if;

    v_name := nullif(trim(coalesce(v_row->>'product_name', v_row->>'name', '')), '');
    v_note := nullif(trim(coalesce(v_row->>'note', '')), '');
    v_qty := coalesce(nullif(v_row->>'real_qty', '')::numeric, 1);
    v_scan_time := coalesce(nullif(v_row->>'scan_time', '')::timestamptz, now());

    insert into public.inventory_details(
      company_id, ticket_id, store_id, slot_id, user_id, sync_batch_id,
      barcode, product_name, real_qty, scan_time, note, status
    )
    values(
      v_ticket.company_id, p_ticket_id, v_ticket.store_id, v_ticket.slot_id, p_user_id, v_sync_id,
      v_barcode, v_name, v_qty, v_scan_time, v_note, 'NEW'
    )
    on conflict(ticket_id, user_id, barcode, scan_time) do nothing;

    if found then
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  insert into public.inventories(company_id, ticket_id, barcode, product_name, ori_qty, real_qty, status)
  select distinct v_ticket.company_id, d.ticket_id, d.barcode, coalesce(d.product_name, 'Chưa có tên'), 0, 0, 'NOTFOUND'
  from public.inventory_details d
  where d.ticket_id = p_ticket_id
    and d.sync_batch_id = v_sync_id
    and not exists (
      select 1 from public.inventories i where i.ticket_id = d.ticket_id and i.barcode = d.barcode
    );

  update public.inventories i
  set real_qty = coalesce(x.total_qty, 0),
      status = case when i.ori_qty = 0 then 'NOTFOUND' else 'CALCED' end,
      updated_at = now()
  from (
    select ticket_id, barcode, sum(real_qty) as total_qty
    from public.inventory_details
    where ticket_id = p_ticket_id and status <> 'DELETED'
    group by ticket_id, barcode
  ) x
  where i.ticket_id = x.ticket_id and i.barcode = x.barcode;

  update public.inventory_details set status = 'SYNCED' where sync_batch_id = v_sync_id and status = 'NEW';

  update public.pda_syncs
  set status = case when v_inserted = 0 then 'DUPLICATE' else 'IMPORTED' end,
      imported_records = v_inserted,
      duplicate_records = greatest(v_total - v_inserted, 0),
      imported_at = now()
  where id = v_sync_id;

  update public.tickets set status = 'INPROCESS' where id = p_ticket_id and status = 'APPROVED';

  insert into public.audit_logs(company_id, actor_user_id, entity_type, entity_id, action, metadata)
  values(v_ticket.company_id, p_user_id, 'ticket', p_ticket_id, 'pda_sync', jsonb_build_object('sync_id', v_sync_id, 'total', v_total, 'inserted', v_inserted));

  return jsonb_build_object(
    'ok', true,
    'sync_id', v_sync_id,
    'total_records', v_total,
    'imported_records', v_inserted,
    'duplicate_records', greatest(v_total - v_inserted, 0)
  );
exception when others then
  if v_sync_id is not null then
    update public.pda_syncs set status = 'FAILED', error_message = SQLERRM where id = v_sync_id;
  end if;
  raise;
end;
$$;
