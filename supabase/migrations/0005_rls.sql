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
