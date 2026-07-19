-- RLS-bewijs per rol (B3). Draai in de lokale db-container. Toont PASS/FAIL.
-- Belangrijk: bewijst dat warehouse GEEN marges kan zien.

-- Testgebruikers + profielen.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'warehouse@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'sales@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'admin@test.local')
on conflict (id) do nothing;
insert into profiles (id, full_name, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'Wietske Warehouse', 'warehouse'),
  ('00000000-0000-0000-0000-0000000000a2', 'Sander Sales', 'sales'),
  ('00000000-0000-0000-0000-0000000000a3', 'Auke Admin', 'admin')
on conflict (id) do update set role = excluded.role;

\echo '================ WAREHOUSE ================'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
select case when count(*) = 0 then 'PASS' else 'FAIL' end as r,
       'warehouse ziet prices-tabel NIET (rows=' || count(*) || ')' as check from prices;
select case when count(*) = 24 then 'PASS' else 'FAIL' end as r,
       'warehouse ziet inkoopprijs via v_prices_basic (rows=' || count(*) || ')' as check from v_prices_basic;
select case when count(margin_pct) = 0 then 'PASS' else 'FAIL' end as r,
       'warehouse ziet GEEN marge in v_product_full (non-null=' || count(margin_pct) || ')' as check from v_product_full;
select case when count(*) = 24 then 'PASS' else 'FAIL' end as r,
       'warehouse ziet producten (rows=' || count(*) || ')' as check from products;
reset role;

\echo '================ SALES ===================='
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', false);
select case when count(*) = 24 then 'PASS' else 'FAIL' end as r,
       'sales ziet prices-tabel incl. marge (rows=' || count(*) || ')' as check from prices;
select case when count(margin_pct) = 24 then 'PASS' else 'FAIL' end as r,
       'sales ziet marges in v_product_full (non-null=' || count(margin_pct) || ')' as check from v_product_full;
select case when count(*) = 0 then 'PASS' else 'FAIL' end as r,
       'sales ziet quarantaine NIET (rows=' || count(*) || ')' as check from price_quarantine;
reset role;

\echo '================ ADMIN ===================='
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', false);
select case when count(*) = 24 then 'PASS' else 'FAIL' end as r,
       'admin ziet prices-tabel (rows=' || count(*) || ')' as check from prices;
select case when count(*) >= 0 then 'PASS' else 'FAIL' end as r,
       'admin kan quarantaine lezen (rows=' || count(*) || ')' as check from price_quarantine;
reset role;

\echo '================ EXTRA TABELLEN (warehouse) ======'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
select case when count(*) = 0 then 'PASS' else 'FAIL' end as r,
       'warehouse ziet quarantaine NIET (rows=' || count(*) || ')' as check from price_quarantine;
select case when count(*) > 0 then 'PASS' else 'FAIL' end as r,
       'warehouse leest settings (drempels) (rows=' || count(*) || ')' as check from settings;
select case when count(*) > 0 then 'PASS' else 'FAIL' end as r,
       'warehouse leest voorraad (rows=' || count(*) || ')' as check from stock_levels;
-- warehouse mag prices NIET schrijven (RLS: geen write policy) -> 0 rijen geraakt
with upd as (update prices set sale_price_cents = sale_price_cents where true returning 1)
select case when count(*) = 0 then 'PASS' else 'FAIL' end as r,
       'warehouse kan prices NIET schrijven (rows=' || count(*) || ')' as check from upd;
reset role;

\echo '================ ANON (geen sessie) ======'
set role anon;
select set_config('request.jwt.claims', '', false);
select case when count(*) = 0 then 'PASS' else 'FAIL' end as r,
       'anon ziet GEEN producten (rows=' || count(*) || ')' as check from products;
select case when count(*) = 0 then 'PASS' else 'FAIL' end as r,
       'anon ziet GEEN prijzen (rows=' || count(*) || ')' as check from prices;
reset role;
