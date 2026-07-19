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
