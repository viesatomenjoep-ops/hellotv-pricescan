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
