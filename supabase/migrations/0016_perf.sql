-- Performance: index + voorraad-aggregatie (catalogus groeide naar 317 modellen).

-- Voorraad wordt overal per toestel gegroepeerd/gefilterd; deze index ontbrak nog.
create index if not exists voorraad_toestel_idx on voorraad (toestel_id);
create index if not exists voorraad_toestel_filiaal_idx on voorraad (toestel_id, filiaal_id);

-- Pre-geaggregeerde totalen per toestel, zodat consumers niet ~5.700 regels hoeven op te halen
-- en in JS te sommeren.
create or replace view v_toestel_voorraad as
  select toestel_id, sum(aantal)::int as totaal
  from voorraad
  group by toestel_id;

grant select on v_toestel_voorraad to authenticated, service_role, anon;
