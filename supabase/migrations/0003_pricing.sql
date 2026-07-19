-- 0003_pricing — prijzen (met GENERATED marge), historie, quarantaine, voorraad, sync-runs.

-- Sync-runs eerst: price_history/quarantine verwijzen ernaar.
create table if not exists sync_runs (
  id             uuid primary key default gen_random_uuid(),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  status         sync_status not null default 'running',
  items_seen     integer not null default 0,
  prices_changed integer not null default 0,
  stock_changed  integer not null default 0,
  quarantined    integer not null default 0,
  unmatched      integer not null default 0,
  error_text     text
);
create index if not exists sync_runs_started_at_idx on sync_runs (started_at desc);

-- Eén actuele prijsrij per product. margin_* zijn GENERATED en NULL zodra sale of purchase
-- ontbreekt (voldoet aan "bereken marge niet zonder verkoopprijs").
create table if not exists prices (
  id                     uuid primary key default gen_random_uuid(),
  product_id             uuid not null unique references products (id) on delete cascade,
  purchase_price_cents   integer check (purchase_price_cents is null or purchase_price_cents >= 0),
  sale_price_cents       integer check (sale_price_cents is null or sale_price_cents >= 0),
  sale_price_includes_vat boolean not null default true,
  vat_pct                integer not null default 21 check (vat_pct between 0 and 100),
  currency               text not null default 'EUR',
  valid_from             timestamptz,
  last_synced_at         timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  margin_cents integer generated always as (
    case
      when sale_price_cents is null or purchase_price_cents is null then null
      else calc_sale_excl_cents(sale_price_cents, sale_price_includes_vat, vat_pct) - purchase_price_cents
    end
  ) stored,
  margin_pct numeric(6, 2) generated always as (
    case
      when sale_price_cents is null or purchase_price_cents is null then null
      when calc_sale_excl_cents(sale_price_cents, sale_price_includes_vat, vat_pct) <= 0 then null
      else round(
        ((calc_sale_excl_cents(sale_price_cents, sale_price_includes_vat, vat_pct) - purchase_price_cents)::numeric
          / calc_sale_excl_cents(sale_price_cents, sale_price_includes_vat, vat_pct)) * 100, 2)
    end
  ) stored
);
create index if not exists prices_last_synced_at_idx on prices (last_synced_at);
create index if not exists prices_margin_pct_idx on prices (margin_pct);

drop trigger if exists prices_set_updated_at on prices;
create trigger prices_set_updated_at before update on prices
  for each row execute function set_updated_at();

-- Append-only prijshistorie.
create table if not exists price_history (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products (id) on delete cascade,
  field       price_field not null,
  old_cents   integer,
  new_cents   integer,
  changed_at  timestamptz not null default now(),
  sync_run_id uuid references sync_runs (id) on delete set null
);
create index if not exists price_history_product_changed_idx
  on price_history (product_id, changed_at desc);
create index if not exists price_history_changed_at_idx on price_history (changed_at desc);

-- Geparkeerde prijswijzigingen (> quarantine_delta_pct). Max. één pending per (product, field).
create table if not exists price_quarantine (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products (id) on delete cascade,
  field         price_field not null,
  current_cents integer,
  proposed_cents integer,
  delta_pct     numeric(6, 2),
  sync_run_id   uuid references sync_runs (id) on delete set null,
  status        quarantine_status not null default 'pending',
  reviewed_by   uuid references auth.users (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists price_quarantine_status_idx on price_quarantine (status);
create unique index if not exists price_quarantine_one_pending_idx
  on price_quarantine (product_id, field) where status = 'pending';

-- Voorraad per locatie.
create table if not exists stock_levels (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products (id) on delete cascade,
  location_code text not null,
  location_name text,
  qty           integer not null default 0,
  updated_at    timestamptz not null default now(),
  unique (product_id, location_code)
);
create index if not exists stock_levels_product_id_idx on stock_levels (product_id);
