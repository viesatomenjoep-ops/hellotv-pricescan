-- 0012_sales_tracker — datamodel voor de HelloTV Sales Tracker (naast PriceScan, zelfde project).
-- Geld in eurocenten (int). RLS permissief in de prototype-fase: authenticated using(true).

do $$ begin
  if not exists (select 1 from pg_type where typname = 'verkoper_rol') then
    create type verkoper_rol as enum ('verkoper', 'manager');
  end if;
  if not exists (select 1 from pg_type where typname = 'toestel_klasse') then
    create type toestel_klasse as enum ('OLED', 'QLED', 'Mini-LED', 'LED');
  end if;
  if not exists (select 1 from pg_type where typname = 'aanbieding_status') then
    create type aanbieding_status as enum ('concept', 'verzonden', 'geaccepteerd');
  end if;
  if not exists (select 1 from pg_type where typname = 'verkoop_status') then
    create type verkoop_status as enum ('lead', 'offerte', 'verkocht', 'geleverd');
  end if;
  if not exists (select 1 from pg_type where typname = 'taak_status') then
    create type taak_status as enum ('te-doen', 'bezig', 'review', 'klaar');
  end if;
  if not exists (select 1 from pg_type where typname = 'agenda_type') then
    create type agenda_type as enum ('activiteit', 'herinnering');
  end if;
  if not exists (select 1 from pg_type where typname = 'notificatie_type') then
    create type notificatie_type as enum ('voorraad', 'marge', 'verkoop', 'systeem');
  end if;
end $$;

create table if not exists filialen (
  id     text primary key,
  naam   text not null,
  plaats text,
  lat    numeric,
  lng    numeric
);

create table if not exists verkopers (
  id           text primary key,
  naam         text not null,
  kleur        text,
  email        text unique,
  filiaal_id   text references filialen (id) on delete set null,
  rol          verkoper_rol not null default 'verkoper',
  auth_user_id uuid references auth.users (id) on delete set null
);

create table if not exists toestellen (
  id               integer primary key,
  merk             text not null,
  model            text not null,
  type_nr          text not null,
  ean              text,
  inch             smallint,
  klasse           toestel_klasse,
  inkoop_c         integer not null default 0,
  ticket_c         integer not null default 0,
  min_marge_c      integer not null default 0,
  verkoopsnelheid  smallint default 0,
  specs            text
);
create index if not exists toestellen_merk_idx on toestellen (merk);
create index if not exists toestellen_klasse_idx on toestellen (klasse);

create table if not exists voorraad (
  id           uuid primary key default gen_random_uuid(),
  toestel_id   integer not null references toestellen (id) on delete cascade,
  filiaal_id   text not null references filialen (id) on delete cascade,
  aantal       integer not null default 0,
  wijkt_af_vms boolean not null default false,
  unique (toestel_id, filiaal_id)
);
create index if not exists voorraad_filiaal_idx on voorraad (filiaal_id);

create table if not exists centraal_magazijn (
  toestel_id integer primary key references toestellen (id) on delete cascade,
  aantal     integer not null default 0,
  eta_dagen  integer
);

create table if not exists klanten (
  id         uuid primary key default gen_random_uuid(),
  naam       text not null,
  email      text unique,
  telefoon   text,
  segment    text,
  prijsfactor numeric(4, 2) not null default 1.0
);

create table if not exists bijverkoop (
  id        uuid primary key default gen_random_uuid(),
  naam      text not null,
  categorie text,
  prijs_c   integer not null default 0,
  marge_c   integer not null default 0
);

create table if not exists aanbiedingen (
  id          uuid primary key default gen_random_uuid(),
  toestel_id  integer references toestellen (id) on delete set null,
  klant_id    uuid references klanten (id) on delete set null,
  prijs_c     integer not null,
  korting_pct numeric(5, 2),
  extras      jsonb not null default '[]'::jsonb,
  geldig_tot  date,
  status      aanbieding_status not null default 'concept',
  verkoper_id text references verkopers (id) on delete set null,
  aangemaakt  timestamptz not null default now()
);

create table if not exists verkopen (
  id          uuid primary key default gen_random_uuid(),
  toestel_id  integer references toestellen (id) on delete set null,
  model       text,
  type_nr     text,
  klant       text,
  verkoper_id text references verkopers (id) on delete set null,
  waarde_c    integer not null default 0,
  status      verkoop_status not null default 'lead',
  aangemaakt  timestamptz not null default now()
);
create index if not exists verkopen_status_idx on verkopen (status);

create table if not exists taken (
  id         uuid primary key default gen_random_uuid(),
  titel      text not null,
  persoon_id text references verkopers (id) on delete set null,
  status     taak_status not null default 'te-doen',
  aangemaakt timestamptz not null default now()
);

create table if not exists agenda_items (
  id      uuid primary key default gen_random_uuid(),
  datum   date not null,
  tijd    text,
  titel   text not null,
  type    agenda_type not null default 'activiteit',
  locatie text
);
create index if not exists agenda_items_datum_idx on agenda_items (datum);

create table if not exists notificaties (
  id      uuid primary key default gen_random_uuid(),
  type    notificatie_type not null,
  tekst   text not null,
  tijd    timestamptz not null default now(),
  gelezen boolean not null default false
);

create table if not exists targets (
  id             uuid primary key default gen_random_uuid(),
  periode        text not null,
  omzet_c        integer not null default 0,
  omzet_doel_c   integer not null default 0,
  marge_pct      numeric(5, 2) default 0,
  marge_doel_pct numeric(5, 2) default 0
);

create table if not exists verkoop_events (
  id         uuid primary key default gen_random_uuid(),
  toestel_id integer references toestellen (id) on delete cascade,
  marge_c    integer not null default 0,
  datum      date not null default current_date
);
create index if not exists verkoop_events_toestel_idx on verkoop_events (toestel_id);

create table if not exists integraties (
  id          uuid primary key default gen_random_uuid(),
  soort       text not null,
  status      text not null default 'niet-verbonden',
  config_json jsonb not null default '{}'::jsonb
);

create table if not exists vms_sync_log (
  id                 uuid primary key default gen_random_uuid(),
  gestart            timestamptz not null default now(),
  afgerond           timestamptz,
  aantal_bijgewerkt  integer not null default 0,
  status             text not null default 'running'
);

create table if not exists feature_flags (
  key         text primary key,
  enabled     boolean not null default true,
  rol_scope   text,
  beschrijving text
);

-- RLS: prototype-fase — elke ingelogde gebruiker mag alles (later aanscherpen op filiaal/rol).
do $$
declare t text;
begin
  foreach t in array array[
    'filialen','verkopers','toestellen','voorraad','centraal_magazijn','klanten','bijverkoop',
    'aanbiedingen','verkopen','taken','agenda_items','notificaties','targets','verkoop_events',
    'integraties','vms_sync_log','feature_flags'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_authenticated_all on %I', t, t);
    execute format(
      'create policy %I_authenticated_all on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;
