-- 0003_functions — RPC's voor blok B (scan) en F (koppelen, ongematcht).
-- Rol-gating en scanlog gebeuren hier, server-side. Alle bedragen in centen.

-- Scan een EPC op, log de scan, en geef het rol-afhankelijke resultaat terug.
-- medewerker: model, verkoopprijs, voorraad. manager/admin: ook inkoop + marge.
create function scan_lookup(p_epc text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_epc     text := upper(trim(p_epc));
  v_role    user_role := current_user_role();
  v_model   models%rowtype;
  v_art     vendit_articles%rowtype;
  v_sale_excl integer;
  v_margin    integer;
  v_price   jsonb;
  v_result  jsonb;
begin
  select m.* into v_model
  from tags t join models m on m.id = t.model_id
  where t.epc = v_epc and t.status = 'active';

  if not found then
    insert into scans (epc, model_id, result, scanned_by)
    values (v_epc, null, 'unmatched', auth.uid());
    return jsonb_build_object('matched', false, 'epc', v_epc);
  end if;

  insert into scans (epc, model_id, result, scanned_by)
  values (v_epc, v_model.id, 'matched', auth.uid());

  -- Meest recent gesyncte artikel voor dit model.
  select a.* into v_art
  from vendit_articles a
  where a.model_id = v_model.id
  order by a.synced_at desc nulls last
  limit 1;

  if found and v_art.sale_price_cents is not null then
    v_sale_excl := case
      when v_art.price_includes_vat
        then round(v_art.sale_price_cents / (1 + v_art.vat_rate))::integer
      else v_art.sale_price_cents
    end;

    v_price := jsonb_build_object(
      'sale_price_cents', v_art.sale_price_cents,
      'sale_price_excl_vat_cents', v_sale_excl,
      'price_includes_vat', v_art.price_includes_vat,
      'vat_rate', v_art.vat_rate,
      'stock_qty', v_art.stock_qty
    );

    -- Marge alleen voor manager/admin (blok G).
    if v_role in ('manager', 'admin') and v_art.purchase_price_cents is not null then
      v_margin := v_sale_excl - v_art.purchase_price_cents;
      v_price := v_price || jsonb_build_object(
        'purchase_price_cents', v_art.purchase_price_cents,
        'margin_cents', v_margin,
        'margin_pct', case when v_sale_excl > 0
          then round(v_margin::numeric / v_sale_excl, 4) else null end
      );
    end if;
  else
    v_price := null;  -- gekoppeld model zonder (prijs)artikel
  end if;

  return jsonb_build_object(
    'matched', true,
    'epc', v_epc,
    'role', v_role,
    'model', jsonb_build_object(
      'id', v_model.id,
      'brand', v_model.brand,
      'model_code', v_model.model_code,
      'name', v_model.name,
      'model_year', v_model.model_year,
      'screen_size_inch', v_model.screen_size_inch,
      'panel_type', v_model.panel_type
    ),
    'price', v_price
  );
end;
$$;

-- Koppel een EPC aan een model (blok F). Faalt als de EPC al bestaat.
create function couple_tag(p_epc text, p_model_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_epc text := upper(trim(p_epc));
  v_id  uuid;
begin
  if v_epc = '' then
    raise exception 'EPC is leeg';
  end if;
  if not exists (select 1 from models where id = p_model_id) then
    raise exception 'Onbekend model';
  end if;
  if exists (select 1 from tags where epc = v_epc) then
    raise exception 'EPC is al gekoppeld';
  end if;

  insert into tags (epc, model_id, created_by)
  values (v_epc, p_model_id, auth.uid())
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'epc', v_epc, 'model_id', p_model_id);
end;
$$;

-- Overzicht van 2025/2026-modellen zonder gekoppeld Vendit-artikel (blok F). Alleen beheer.
create function unmatched_models()
returns setof models
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user_role() not in ('manager', 'admin') then
    raise exception 'Geen rechten';
  end if;
  return query
    select m.* from models m
    where m.model_year in (2025, 2026)
      and not exists (select 1 from vendit_articles a where a.model_id = m.id)
    order by m.brand, m.name;
end;
$$;

grant execute on function scan_lookup(text)          to anon, authenticated;
grant execute on function couple_tag(text, uuid)     to anon, authenticated;
grant execute on function unmatched_models()         to anon, authenticated;
grant execute on function current_user_role()        to anon, authenticated;
