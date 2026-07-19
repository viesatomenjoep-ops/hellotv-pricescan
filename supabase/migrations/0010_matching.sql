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
