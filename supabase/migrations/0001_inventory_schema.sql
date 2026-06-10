create extension if not exists pgcrypto;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter',
  data_limit_per_inventory integer not null default 100000,
  data_limit_total integer not null default 1000000,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, code)
);

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  email text not null unique,
  full_name text not null,
  role text not null default 'manager' check (role in ('system_admin','tenant_admin','manager','operator','viewer')),
  user_type text not null default 'WEB' check (user_type in ('ADMIN','WEB','PDA')),
  pin text not null default '123456',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete restrict,
  slot_id uuid references public.slots(id) on delete set null,
  code text not null,
  name text not null,
  inventory_date date not null default current_date,
  status text not null default 'NEW' check (status in ('NEW','IMPORTING','IMPORTED','APPROVED','INPROCESS','COMPLETED','REOPEN','CLOSED','DELETED')),
  has_book_data boolean not null default true,
  note text,
  parent_ticket_id uuid references public.tickets(id) on delete set null,
  created_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, code)
);

create table public.inventories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  barcode text not null,
  sku text,
  product_name text,
  ori_qty numeric(18,3) not null default 0,
  real_qty numeric(18,3) not null default 0,
  diff_qty numeric(18,3) generated always as (real_qty - ori_qty) stored,
  status text not null default 'NEW' check (status in ('NEW','CALCED','NOTFOUND','DELETED')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(ticket_id, barcode)
);

create table public.pda_syncs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  status text not null default 'NEW' check (status in ('NEW','PROCESSING','IMPORTED','FAILED','DUPLICATE')),
  payload jsonb not null default '[]'::jsonb,
  total_records integer not null default 0,
  imported_records integer not null default 0,
  duplicate_records integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  imported_at timestamptz
);

create table public.inventory_details (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  slot_id uuid references public.slots(id) on delete set null,
  user_id uuid references public.app_users(id) on delete set null,
  sync_batch_id uuid references public.pda_syncs(id) on delete set null,
  barcode text not null,
  product_name text,
  real_qty numeric(18,3) not null default 1,
  scan_time timestamptz not null,
  note text,
  status text not null default 'NEW' check (status in ('NEW','SYNCED','DELETED')),
  created_at timestamptz not null default now(),
  unique(ticket_id, user_id, barcode, scan_time)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_user_id uuid references public.app_users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_stores_company on public.stores(company_id);
create index idx_slots_company_store on public.slots(company_id, store_id);
create index idx_tickets_company_status on public.tickets(company_id, status);
create index idx_tickets_store on public.tickets(store_id);
create index idx_inventories_ticket_barcode on public.inventories(ticket_id, barcode);
create index idx_inventories_company_ticket on public.inventories(company_id, ticket_id);
create index idx_inventory_details_ticket_barcode on public.inventory_details(ticket_id, barcode);
create index idx_inventory_details_company_ticket on public.inventory_details(company_id, ticket_id);
create index idx_pda_syncs_ticket_status on public.pda_syncs(ticket_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger trg_stores_updated_at before update on public.stores for each row execute function public.set_updated_at();
create trigger trg_slots_updated_at before update on public.slots for each row execute function public.set_updated_at();
create trigger trg_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();
create trigger trg_tickets_updated_at before update on public.tickets for each row execute function public.set_updated_at();
create trigger trg_inventories_updated_at before update on public.inventories for each row execute function public.set_updated_at();
