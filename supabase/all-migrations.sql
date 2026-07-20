-- 0001_types — enums, updated_at-trigger en de immutable btw/marge-helper.
-- Idempotent: enums via DO-guard, functies via create or replace.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'sales', 'warehouse');
  end if;
  if not exists (select 1 from pg_type where typname = 'panel_type') then
    create type panel_type as enum ('LED', 'QLED', 'MiniLED', 'OLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'segment_type') then
    create type segment_type as enum ('budget', 'mid', 'premium');
  end if;
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type product_status as enum ('active', 'eol');
  end if;
  if not exists (select 1 from pg_type where typname = 'match_method') then
    create type match_method as enum ('ean', 'sku', 'manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'price_field') then
    create type price_field as enum ('purchase', 'sale');
  end if;
  if not exists (select 1 from pg_type where typname = 'quarantine_status') then
    create type quarantine_status as enum ('pending', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'tag_status') then
    create type tag_status as enum ('active', 'inactive', 'defect');
  end if;
  if not exists (select 1 from pg_type where typname = 'scan_input_type') then
    create type scan_input_type as enum ('rfid', 'ean');
  end if;
  if not exists (select 1 from pg_type where typname = 'scan_result') then
    create type scan_result as enum ('hit', 'unknown_tag', 'unlinked');
  end if;
  if not exists (select 1 from pg_type where typname = 'sync_status') then
    create type sync_status as enum ('running', 'success', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'override_action') then
    create type override_action as enum ('pin', 'block');
  end if;
end $$;

-- Zet updated_at bij elke update.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Verkoopprijs exclusief btw in centen. Immutable zodat het in GENERATED-kolommen mag.
-- NULL als er geen verkoopprijs is (dan geen marge — zie prices).
create or replace function calc_sale_excl_cents(p_sale integer, p_incl boolean, p_vat integer)
returns integer language sql immutable as $$
  select case
    when p_sale is null then null
    when p_incl then round(p_sale::numeric * 100 / (100 + p_vat))::int
    else p_sale
  end;
$$;
-- 0002_core — merken, producten (catalogus 2025/2026), en de Vendit-koppeltabel.

create table if not exists brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid not null references brands (id) on delete restrict,
  model_name       text not null,
  model_number     text not null,
  model_year       smallint not null check (model_year in (2025, 2026)),
  ean              text unique,
  screen_size_inch smallint check (screen_size_inch between 20 and 120),
  panel_type       panel_type,
  segment          segment_type,
  sku_hellotv      text,
  successor_id     uuid references products (id) on delete set null,
  status           product_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (brand_id, model_number),
  check (successor_id is null or successor_id <> id)
);

create index if not exists products_brand_id_idx on products (brand_id);
create index if not exists products_model_year_idx on products (model_year);
create index if not exists products_panel_type_idx on products (panel_type);
create index if not exists products_segment_idx on products (segment);
create index if not exists products_status_idx on products (status);
create index if not exists products_successor_id_idx on products (successor_id);

-- Koppeling product <-> Vendit-artikel. product_id mag NULL zijn (ongematchte artikelen).
create table if not exists vendit_articles (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references products (id) on delete set null,
  vendit_article_id text not null unique,
  vendit_ean        text,
  vendit_description text,
  match_method      match_method,
  match_confidence  numeric(3, 2) check (match_confidence between 0 and 1),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists vendit_articles_product_id_idx on vendit_articles (product_id);
create index if not exists vendit_articles_vendit_ean_idx on vendit_articles (vendit_ean);

drop trigger if exists brands_set_updated_at on brands;
create trigger brands_set_updated_at before update on brands
  for each row execute function set_updated_at();
drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
drop trigger if exists vendit_articles_set_updated_at on vendit_articles;
create trigger vendit_articles_set_updated_at before update on vendit_articles
  for each row execute function set_updated_at();
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
-- 0005_rls — Row Level Security voor alle tabellen. Geen anonieme toegang.
--
-- Onder Supabase zijn alle ingelogde gebruikers dezelfde Postgres-rol (`authenticated`);
-- de app-rol (admin/sales/warehouse) staat in `profiles`. Kolom-privileges per Postgres-rol
-- kunnen warehouse dus niet van sales scheiden. Daarom:
--   * prices-TABEL is alleen leesbaar voor sales/admin (RLS);
--   * warehouse leest enkel de inkoopprijs via de view v_prices_basic (zie 0006);
--   * marge-kolommen bestaan simpelweg niet in die view.
-- Schrijven op prices/stock_levels/sync_runs/price_history gebeurt via de service role
-- (sync-engine) of via een goedkeur-RPC; die rol omzeilt RLS.

-- App-rol van de huidige gebruiker; NULL zonder profiel/sessie -> overal geweigerd.
create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

grant execute on function current_user_role() to anon, authenticated;

alter table brands                enable row level security;
alter table products              enable row level security;
alter table vendit_articles       enable row level security;
alter table prices                enable row level security;
alter table price_history         enable row level security;
alter table price_quarantine      enable row level security;
alter table stock_levels          enable row level security;
alter table rfid_tags             enable row level security;
alter table scan_events           enable row level security;
alter table sync_runs             enable row level security;
alter table alternative_overrides enable row level security;
alter table settings              enable row level security;
alter table profiles              enable row level security;

-- brands: iedereen met rol leest; admin beheert.
create policy brands_read on brands
  for select using (current_user_role() is not null);
create policy brands_admin_write on brands
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- products: iedereen met rol leest; admin beheert (import loopt ook via service role).
create policy products_read on products
  for select using (current_user_role() is not null);
create policy products_admin_write on products
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- vendit_articles: leesbaar voor alle rollen (matchstatus); admin beheert.
create policy vendit_articles_read on vendit_articles
  for select using (current_user_role() is not null);
create policy vendit_articles_admin_write on vendit_articles
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- prices: alleen sales/admin (marge zichtbaar). warehouse gebruikt v_prices_basic.
create policy prices_sales_admin_read on prices
  for select using (current_user_role() in ('sales', 'admin'));

-- price_history: sales/admin lezen; muteren via service role.
create policy price_history_read on price_history
  for select using (current_user_role() in ('sales', 'admin'));

-- price_quarantine: alleen admin leest; muteren via goedkeur-RPC / service role.
create policy price_quarantine_admin_read on price_quarantine
  for select using (current_user_role() = 'admin');

-- stock_levels: alle rollen lezen; schrijven via service role.
create policy stock_levels_read on stock_levels
  for select using (current_user_role() is not null);

-- rfid_tags: alle rollen lezen; warehouse/admin koppelen (insert/update); admin verwijdert.
create policy rfid_tags_read on rfid_tags
  for select using (current_user_role() is not null);
create policy rfid_tags_link_insert on rfid_tags
  for insert with check (current_user_role() in ('warehouse', 'admin'));
create policy rfid_tags_link_update on rfid_tags
  for update using (current_user_role() in ('warehouse', 'admin'))
  with check (current_user_role() in ('warehouse', 'admin'));
create policy rfid_tags_admin_delete on rfid_tags
  for delete using (current_user_role() = 'admin');

-- scan_events: alle rollen loggen scans (insert); sales/admin lezen de log.
create policy scan_events_insert on scan_events
  for insert with check (current_user_role() is not null);
create policy scan_events_read on scan_events
  for select using (current_user_role() in ('sales', 'admin'));

-- sync_runs: sales/admin lezen (dashboard/voortgang); schrijven via service role.
create policy sync_runs_read on sync_runs
  for select using (current_user_role() in ('sales', 'admin'));

-- alternative_overrides: sales/admin lezen; admin beheert.
create policy alternative_overrides_read on alternative_overrides
  for select using (current_user_role() in ('sales', 'admin'));
create policy alternative_overrides_admin_write on alternative_overrides
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- settings: alle rollen lezen (drempels); admin beheert.
create policy settings_read on settings
  for select using (current_user_role() is not null);
create policy settings_admin_write on settings
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- profiles: eigen profiel of admin; alleen admin muteert (rollen toekennen).
create policy profiles_read on profiles
  for select using (id = auth.uid() or current_user_role() = 'admin');
create policy profiles_admin_write on profiles
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
-- 0006_views_functions — views en RPC's (B4). Staleness = last_synced_at ouder dan 4 uur.

-- Alleen-inkoopprijs-view voor warehouse (prices-tabel zelf is voor hen afgeschermd, 0005).
-- SECURITY DEFINER (default) zodat 'ie de prices-RLS omzeilt maar géén sale/marge-kolommen toont.
create or replace view v_prices_basic as
select
  product_id,
  purchase_price_cents,
  currency,
  last_synced_at,
  (last_synced_at is null or last_synced_at < now() - interval '4 hours') as is_stale
from prices
where current_user_role() is not null;

grant select on v_prices_basic to authenticated;

-- Volledig productbeeld: product + merk + prijs + marge + voorraad + staleness.
-- security_invoker: de prices-RLS geldt, dus warehouse ziet hier geen sale/marge.
create or replace view v_product_full with (security_invoker = true) as
select
  p.id, p.brand_id, b.name as brand_name, p.model_name, p.model_number, p.model_year,
  p.ean, p.screen_size_inch, p.panel_type, p.segment, p.sku_hellotv, p.successor_id, p.status,
  pr.purchase_price_cents, pr.sale_price_cents, pr.sale_price_includes_vat, pr.vat_pct,
  pr.margin_cents, pr.margin_pct, pr.currency, pr.last_synced_at,
  (pr.last_synced_at is null or pr.last_synced_at < now() - interval '4 hours') as is_stale,
  coalesce(s.total_stock, 0) as total_stock,
  coalesce(s.by_location, '[]'::jsonb) as stock_by_location
from products p
join brands b on b.id = p.brand_id
left join prices pr on pr.product_id = p.id
left join lateral (
  select
    sum(qty) as total_stock,
    jsonb_agg(
      jsonb_build_object('location_code', location_code, 'location_name', location_name, 'qty', qty)
      order by location_code
    ) as by_location
  from stock_levels sl where sl.product_id = p.id
) s on true;

-- Prijswijzigingen laatste 30 dagen met delta in centen en procenten + huidige marge.
create or replace view v_price_changes_recent with (security_invoker = true) as
select
  ph.id, ph.product_id, p.model_name, ph.field, ph.old_cents, ph.new_cents,
  (ph.new_cents - ph.old_cents) as delta_cents,
  case when ph.old_cents is null or ph.old_cents = 0 then null
    else round(((ph.new_cents - ph.old_cents)::numeric / ph.old_cents) * 100, 2) end as delta_pct,
  pr.margin_pct as current_margin_pct,
  ph.changed_at, ph.sync_run_id
from price_history ph
join products p on p.id = ph.product_id
left join prices pr on pr.product_id = ph.product_id
where ph.changed_at >= now() - interval '30 days';

-- Producten met marge onder settings.margin_alert_threshold_pct.
create or replace view v_margin_watchlist with (security_invoker = true) as
select
  p.id as product_id, b.name as brand_name, p.model_name, p.model_number,
  pr.margin_pct, pr.margin_cents, pr.sale_price_cents
from products p
join brands b on b.id = p.brand_id
join prices pr on pr.product_id = p.id
where pr.margin_pct is not null
  and pr.margin_pct < coalesce(
    (select (value #>> '{}')::numeric from settings where key = 'margin_alert_threshold_pct'), 10)
  and p.status = 'active';

-- Eén call voor het scan-scherm: zoekt op EPC of EAN, logt de scan, geeft rol-afhankelijk
-- product + prijzen + marge + voorraad + staleness + tagstatus terug.
-- warehouse: inkoopprijs; sales/admin: ook verkoop + marge.
create or replace function fn_lookup_scan(p_epc text default null, p_ean text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   user_role := current_user_role();
  v_epc    text := nullif(upper(trim(coalesce(p_epc, ''))), '');
  v_ean    text := nullif(trim(coalesce(p_ean, '')), '');
  v_input  scan_input_type;
  v_tag    rfid_tags%rowtype;
  v_pid    uuid;
  v_result scan_result;
  v_tag_status text;
  v_product jsonb := null;
begin
  if v_epc is not null then
    v_input := 'rfid';
    select * into v_tag from rfid_tags where epc = v_epc;
    if not found then
      v_result := 'unknown_tag';
    elsif v_tag.product_id is null then
      v_result := 'unlinked';
      v_tag_status := v_tag.status;
    else
      v_result := 'hit';
      v_pid := v_tag.product_id;
      v_tag_status := v_tag.status;
    end if;
  elsif v_ean is not null then
    v_input := 'ean';
    select id into v_pid from products where ean = v_ean;
    v_result := case when v_pid is null then 'unknown_tag' else 'hit' end;
  else
    raise exception 'Geen EPC of EAN meegegeven';
  end if;

  insert into scan_events (epc, ean, input_type, rfid_tag_id, product_id, scanned_by, result, resolved_at)
  values (v_epc, v_ean, v_input, v_tag.id, v_pid, auth.uid(), v_result, now());

  if v_pid is not null then
    select jsonb_build_object(
      'id', f.id, 'brand', f.brand_name, 'model_name', f.model_name,
      'model_number', f.model_number, 'model_year', f.model_year,
      'screen_size_inch', f.screen_size_inch, 'panel_type', f.panel_type,
      'segment', f.segment, 'status', f.status, 'successor_id', f.successor_id,
      'purchase_price_cents', f.purchase_price_cents,
      'currency', f.currency, 'last_synced_at', f.last_synced_at, 'is_stale', f.is_stale,
      'total_stock', f.total_stock, 'stock_by_location', f.stock_by_location,
      -- verkoop + marge alleen voor sales/admin:
      'sale_price_cents', case when v_role in ('sales', 'admin') then f.sale_price_cents end,
      'margin_cents', case when v_role in ('sales', 'admin') then f.margin_cents end,
      'margin_pct', case when v_role in ('sales', 'admin') then f.margin_pct end
    ) into v_product
    from v_product_full f where f.id = v_pid;
  end if;

  return jsonb_build_object(
    'input_type', v_input, 'result', v_result, 'role', v_role,
    'tag_status', v_tag_status, 'epc', v_epc, 'ean', v_ean, 'product', v_product
  );
end;
$$;

-- Alternatieven (eerste versie; D5 verfijnt tot de scoring-engine):
-- zelfde of nieuwer modeljaar, schermmaat binnen tolerantie, voorraad > 0, status active,
-- gesorteerd op margin_pct desc; respecteer overrides (pin bovenaan, block eruit).
create or replace function fn_alternatives(p_product_id uuid, p_limit integer default 3)
returns table (
  product_id uuid, model_name text, brand_name text, screen_size_inch smallint,
  segment segment_type, panel_type panel_type, model_year smallint,
  margin_pct numeric, total_stock bigint, is_pinned boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := current_user_role();
  v_tol  integer := coalesce(
    (select (value #>> '{}')::int from settings where key = 'alternatives_size_tolerance_inch'), 5);
  v_base products%rowtype;
begin
  select * into v_base from products where id = p_product_id;
  if not found then raise exception 'Onbekend product'; end if;

  return query
  select
    p.id, p.model_name, b.name, p.screen_size_inch, p.segment, p.panel_type, p.model_year,
    case when v_role in ('sales', 'admin') then pr.margin_pct else null end,
    coalesce(st.total, 0)::bigint,
    exists (
      select 1 from alternative_overrides o
      where o.product_id = p_product_id and o.alternative_product_id = p.id and o.action = 'pin'
    ) as is_pinned
  from products p
  join brands b on b.id = p.brand_id
  left join prices pr on pr.product_id = p.id
  left join lateral (select sum(qty) as total from stock_levels sl where sl.product_id = p.id) st on true
  where p.id <> p_product_id
    and p.status = 'active'
    and coalesce(st.total, 0) > 0
    and p.model_year >= v_base.model_year
    and p.screen_size_inch is not null
    and abs(p.screen_size_inch - v_base.screen_size_inch) <= v_tol
    and not exists (
      select 1 from alternative_overrides o
      where o.product_id = p_product_id and o.alternative_product_id = p.id and o.action = 'block'
    )
  order by is_pinned desc, (case when v_role in ('sales', 'admin') then pr.margin_pct end) desc nulls last
  limit p_limit;
end;
$$;

grant execute on function fn_lookup_scan(text, text) to authenticated;
grant execute on function fn_alternatives(uuid, integer) to authenticated;
-- 0007_grants — tabel/sequence-privileges. RLS blijft de echte poort; service_role omzeilt RLS.
-- Geen grants aan anon => geen anonieme toegang (RLS weigert bovendien op current_user_role()).

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Toekomstige objecten (door postgres aangemaakt) automatisch meenemen.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
-- 0008_alternatives — definitieve alternatieven-engine (D5). Vervangt de v1 uit 0006.
-- Gewichten instelbaar via settings-key 'alternatives_weights'.

drop function if exists fn_alternatives(uuid, integer);

create function fn_alternatives(p_product_id uuid, p_limit integer default 3)
returns table (
  product_id uuid, model_name text, brand_name text, screen_size_inch smallint,
  segment segment_type, panel_type panel_type, model_year smallint,
  sale_price_cents integer, total_stock bigint, margin_pct numeric,
  margin_diff_pp numeric, score numeric, is_pinned boolean, is_successor boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := current_user_role();
  v_tol  integer := coalesce((select (value #>> '{}')::int from settings where key = 'alternatives_size_tolerance_inch'), 5);
  v_w    jsonb := coalesce((select value from settings where key = 'alternatives_weights'), '{}'::jsonb);
  v_wm numeric := coalesce((v_w ->> 'margin')::numeric, 40);
  v_ws numeric := coalesce((v_w ->> 'stock')::numeric, 20);
  v_wb numeric := coalesce((v_w ->> 'brand')::numeric, 10);
  v_wy numeric := coalesce((v_w ->> 'year')::numeric, 10);
  v_wp numeric := coalesce((v_w ->> 'panel')::numeric, 10);
  v_wpr numeric := coalesce((v_w ->> 'price')::numeric, 10);
  v_year smallint; v_size smallint; v_brand uuid; v_status product_status; v_successor uuid;
  v_seg_rank int; v_panel_rank int; v_base_sale integer; v_base_margin numeric;
begin
  select p.model_year, p.screen_size_inch, p.brand_id, p.status, p.successor_id,
         case p.segment when 'budget' then 1 when 'mid' then 2 when 'premium' then 3 end,
         case p.panel_type when 'LED' then 1 when 'QLED' then 2 when 'MiniLED' then 3 when 'OLED' then 4 end,
         pr.sale_price_cents, pr.margin_pct
    into v_year, v_size, v_brand, v_status, v_successor, v_seg_rank, v_panel_rank, v_base_sale, v_base_margin
  from products p left join prices pr on pr.product_id = p.id
  where p.id = p_product_id;
  if not found then raise exception 'Onbekend product'; end if;

  return query
  select
    c.id, c.model_name, c.brand_name, c.screen_size_inch, c.segment, c.panel_type, c.model_year,
    c.sale_price_cents, c.total_stock,
    case when v_role in ('sales', 'admin') then c.margin_pct end,
    case when v_role in ('sales', 'admin') then c.margin_pct - v_base_margin end,
    round(
      least(greatest(coalesce(c.margin_pct, 0) / 30.0, 0), 1) * v_wm
      + least(c.total_stock, 5) / 5.0 * v_ws
      + case when c.brand_id = v_brand then v_wb else 0 end
      + case when c.model_year > v_year then v_wy else 0 end
      + case when c.panel_rank >= v_panel_rank then v_wp else 0 end
      + case when v_base_sale is null or v_base_sale = 0 then 0
          else greatest(0, 1 - least(abs(c.sale_price_cents - v_base_sale)::numeric / v_base_sale, 0.25) / 0.25) * v_wpr
        end, 1) as score,
    exists (select 1 from alternative_overrides o
      where o.product_id = p_product_id and o.alternative_product_id = c.id and o.action = 'pin') as is_pinned,
    (c.id = v_successor and v_status = 'eol') as is_successor
  from (
    select p.id, p.model_name, b.name as brand_name, p.screen_size_inch, p.segment, p.panel_type,
      p.model_year, p.brand_id, p.status, pr.sale_price_cents, pr.margin_pct,
      coalesce(st.total, 0)::bigint as total_stock,
      case p.segment when 'budget' then 1 when 'mid' then 2 when 'premium' then 3 end as seg_rank,
      case p.panel_type when 'LED' then 1 when 'QLED' then 2 when 'MiniLED' then 3 when 'OLED' then 4 end as panel_rank
    from products p
    join brands b on b.id = p.brand_id
    left join prices pr on pr.product_id = p.id
    left join lateral (select sum(qty) as total from stock_levels sl where sl.product_id = p.id) st on true
  ) c
  where c.id <> p_product_id
    and not exists (select 1 from alternative_overrides o
      where o.product_id = p_product_id and o.alternative_product_id = c.id and o.action = 'block')
    and (
      (c.id = v_successor and v_status = 'eol')
      or (
        c.status = 'active'
        and c.total_stock > 0
        and c.screen_size_inch is not null
        and abs(c.screen_size_inch - v_size) <= v_tol
        and c.model_year >= v_year
        and c.seg_rank between v_seg_rank and v_seg_rank + 1
        and (v_base_sale is null or c.sale_price_cents between (v_base_sale * 0.9)::int and (v_base_sale * 1.25)::int)
      )
    )
  order by is_successor desc, is_pinned desc, score desc nulls last
  limit p_limit;
end;
$$;

grant execute on function fn_alternatives(uuid, integer) to authenticated;
-- 0009_quarantine_rpc — goedkeuren/afwijzen van gequarantainede prijswijzigingen (C5).
-- Alleen admin. Goedkeuren voert de prijs door + schrijft price_history; beide zetten
-- reviewed_by/reviewed_at.

create function approve_quarantine(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q  price_quarantine%rowtype;
  v_old integer;
begin
  if current_user_role() <> 'admin' then raise exception 'Geen rechten'; end if;
  select * into v_q from price_quarantine where id = p_id and status = 'pending';
  if not found then raise exception 'Geen openstaand quarantaine-item'; end if;

  if v_q.field = 'purchase' then
    select purchase_price_cents into v_old from prices where product_id = v_q.product_id;
    update prices set purchase_price_cents = v_q.proposed_cents, last_synced_at = now()
      where product_id = v_q.product_id;
  else
    select sale_price_cents into v_old from prices where product_id = v_q.product_id;
    update prices set sale_price_cents = v_q.proposed_cents, last_synced_at = now()
      where product_id = v_q.product_id;
  end if;

  insert into price_history (product_id, field, old_cents, new_cents, sync_run_id)
  values (v_q.product_id, v_q.field, v_old, v_q.proposed_cents, v_q.sync_run_id);

  update price_quarantine
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_id;
end;
$$;

create function reject_quarantine(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_role() <> 'admin' then raise exception 'Geen rechten'; end if;
  update price_quarantine
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_id and status = 'pending';
  if not found then raise exception 'Geen openstaand quarantaine-item'; end if;
end;
$$;

grant execute on function approve_quarantine(uuid) to authenticated;
grant execute on function reject_quarantine(uuid) to authenticated;
-- 0010_matching — voorgestelde (fuzzy) matches + confirm-RPC (D2/D4).

alter table vendit_articles
  add column if not exists suggested_product_id uuid references products (id) on delete set null;

-- Bevestig een match (D4): koppel artikel aan product, method manual, confidence 1.0.
create or replace function confirm_match(p_article_id uuid, p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_role() <> 'admin' then raise exception 'Geen rechten'; end if;
  update vendit_articles
    set product_id = p_product_id, suggested_product_id = null,
        match_method = 'manual', match_confidence = 1.0
    where id = p_article_id;
end;
$$;

grant execute on function confirm_match(uuid, uuid) to authenticated;
-- 0011_import_runs — logboek van catalogus-imports (D1).

create table if not exists import_runs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'success',
  new_count     integer not null default 0,
  updated_count integer not null default 0,
  invalid_count integer not null default 0,
  error_text    text
);
create index if not exists import_runs_started_at_idx on import_runs (started_at desc);

alter table import_runs enable row level security;
create policy import_runs_admin_all on import_runs
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
