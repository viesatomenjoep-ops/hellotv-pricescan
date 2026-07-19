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
