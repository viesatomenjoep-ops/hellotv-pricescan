-- 0001_init — kernschema voor blok B (scannen) en F (catalogus & matching).
-- Alle geldbedragen zijn integer eurocenten (zie docs/PRD.md §5).

-- Rollen (CLAUDE.md blok G). PRD-groepen mappen hierop (§5 rolmodel).
create type user_role as enum ('medewerker', 'manager', 'admin');
create type panel_type as enum ('OLED', 'QLED', 'Mini-LED', 'LED', 'Overig');
create type scan_result as enum ('matched', 'unmatched');

-- Gebruikersprofiel met rol; 1-op-1 met auth.users.
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       user_role not null default 'medewerker',
  created_at timestamptz not null default now()
);

-- Catalogus: alle tv-modellen van modeljaar 2025/2026.
create table models (
  id                uuid primary key default gen_random_uuid(),
  brand             text not null,
  model_code        text not null,
  name              text not null,
  model_year        smallint not null check (model_year in (2025, 2026)),
  screen_size_inch  smallint,
  panel_type        panel_type,
  segment           text,
  ean               text,
  created_at        timestamptz not null default now(),
  unique (brand, model_code)
);

-- Vendit-artikel gekoppeld aan een model. Prijzen/voorraad zijn later Vendit-sync (blok E);
-- nu handmatig/seed. Bron van waarheid voor prijs, voorraad, verkoop.
create table vendit_articles (
  id                  uuid primary key default gen_random_uuid(),
  vendit_article_id   text not null unique,
  model_id            uuid references models (id) on delete set null,
  purchase_price_cents integer,                 -- inkoop, excl. btw (aanname §5)
  sale_price_cents    integer,                  -- verkoop
  price_includes_vat  boolean not null default true,
  vat_rate            numeric(4, 3) not null default 0.210,
  stock_qty           integer not null default 0,
  synced_at           timestamptz,
  created_at          timestamptz not null default now()
);

-- RFID-tag: één EPC hoort bij precies één model (CLAUDE.md domeinregels).
create table tags (
  id         uuid primary key default gen_random_uuid(),
  epc        text not null unique,
  model_id   uuid not null references models (id) on delete restrict,
  status     text not null default 'active',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Scanlog: elke scan wordt gelogd (CLAUDE.md domeinregels).
create table scans (
  id         uuid primary key default gen_random_uuid(),
  epc        text not null,
  model_id   uuid references models (id) on delete set null,
  result     scan_result not null,
  scanned_by uuid references auth.users (id) on delete set null,
  scanned_at timestamptz not null default now()
);

create index models_model_year_idx on models (model_year);
create index vendit_articles_model_id_idx on vendit_articles (model_id);
create index scans_scanned_at_idx on scans (scanned_at desc);
