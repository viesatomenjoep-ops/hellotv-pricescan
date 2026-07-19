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
