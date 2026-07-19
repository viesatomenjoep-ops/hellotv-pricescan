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
