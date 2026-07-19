-- 0004_rfid_meta — RFID-tags, scan-events, alternatieven-overrides, settings, profielen.

create table if not exists rfid_tags (
  id         uuid primary key default gen_random_uuid(),
  epc        text not null unique,
  product_id uuid references products (id) on delete set null,
  status     tag_status not null default 'active',
  linked_by  uuid references auth.users (id) on delete set null,
  linked_at  timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists rfid_tags_product_id_idx on rfid_tags (product_id);
create index if not exists rfid_tags_status_idx on rfid_tags (status);

create table if not exists scan_events (
  id          uuid primary key default gen_random_uuid(),
  epc         text,
  ean         text,
  input_type  scan_input_type not null,
  rfid_tag_id uuid references rfid_tags (id) on delete set null,
  product_id  uuid references products (id) on delete set null,
  scanned_by  uuid references auth.users (id) on delete set null,
  scanned_at  timestamptz not null default now(),
  result      scan_result not null,
  resolved_at timestamptz
);
create index if not exists scan_events_scanned_at_idx on scan_events (scanned_at desc);
create index if not exists scan_events_product_id_idx on scan_events (product_id);

-- Handmatige sturing op de alternatieven-engine.
create table if not exists alternative_overrides (
  id                     uuid primary key default gen_random_uuid(),
  product_id             uuid not null references products (id) on delete cascade,
  alternative_product_id uuid not null references products (id) on delete cascade,
  action                 override_action not null,
  created_by             uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  unique (product_id, alternative_product_id),
  check (product_id <> alternative_product_id)
);
create index if not exists alternative_overrides_product_id_idx
  on alternative_overrides (product_id);

create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();

create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       user_role not null default 'warehouse',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();
