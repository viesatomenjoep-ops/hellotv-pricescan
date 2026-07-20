-- RFID-chips koppelen aan Sales-Tracker-toestellen (epc → toestel).
-- Los van PriceScan rfid_tags (dat koppelt epc → products). Zo kan de Tracker
-- met echte chips een toestel herkennen.
create table if not exists toestel_tags (
  epc        text primary key,
  toestel_id integer references toestellen (id) on delete cascade,
  status     text not null default 'active',
  linked_at  timestamptz not null default now()
);
create index if not exists toestel_tags_toestel_idx on toestel_tags (toestel_id);

alter table toestel_tags enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'toestel_tags' and policyname = 'toestel_tags_all') then
    create policy toestel_tags_all on toestel_tags
      for all to authenticated using (true) with check (true);
  end if;
end $$;

grant all on toestel_tags to authenticated, service_role;
