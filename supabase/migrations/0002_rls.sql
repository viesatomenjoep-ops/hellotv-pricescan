-- 0002_rls — Row Level Security. Zichtbaarheid van inkoop/marge is rol-gebonden en wordt
-- afgedwongen in de database (CLAUDE.md blok G), niet alleen in de UI.
--
-- Strategie: prijs/marge/voorraad lopen ALLEEN via de SECURITY DEFINER-RPC's in 0003.
-- Clients lezen `vendit_articles`, `tags` en `scans` dus niet rechtstreeks.

-- Rol van de huidige gebruiker; default 'medewerker' als er geen profiel/sessie is.
-- SECURITY DEFINER zodat de lookup de RLS op `profiles` niet zelf raakt.
create function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()), 'medewerker')::user_role;
$$;

alter table profiles        enable row level security;
alter table models          enable row level security;
alter table vendit_articles enable row level security;
alter table tags            enable row level security;
alter table scans           enable row level security;

-- profiles: iedereen ziet z'n eigen profiel; admin ziet alle.
create policy profiles_select_self on profiles
  for select using (id = auth.uid() or current_user_role() = 'admin');
create policy profiles_admin_write on profiles
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- models: catalogus is niet gevoelig -> leesbaar voor iedereen (ook anon in dev).
-- Schrijven (import/beheer) alleen admin.
create policy models_select_all on models
  for select using (true);
create policy models_admin_write on models
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- vendit_articles: geen directe client-toegang. Alleen manager/admin mogen lezen
-- (bijv. voor beheer); medewerkers krijgen prijzen enkel via de RPC.
create policy vendit_articles_manager_read on vendit_articles
  for select using (current_user_role() in ('manager', 'admin'));

-- tags: koppelen gebeurt via RPC (definer). Admin mag lezen voor beheer.
create policy tags_admin_read on tags
  for select using (current_user_role() = 'admin');

-- scans: audit-trail, alleen manager/admin mogen lezen. Inserts lopen via RPC.
create policy scans_manager_read on scans
  for select using (current_user_role() in ('manager', 'admin'));
