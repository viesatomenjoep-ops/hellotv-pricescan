-- 0002_core — merken, producten (catalogus 2025/2026), en de Vendit-koppeltabel.

create table if not exists brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid not null references brands (id) on delete restrict,
  model_name       text not null,
  model_number     text not null,
  model_year       smallint not null check (model_year in (2025, 2026)),
  ean              text unique,
  screen_size_inch smallint check (screen_size_inch between 20 and 120),
  panel_type       panel_type,
  segment          segment_type,
  sku_hellotv      text,
  successor_id     uuid references products (id) on delete set null,
  status           product_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (brand_id, model_number),
  check (successor_id is null or successor_id <> id)
);

create index if not exists products_brand_id_idx on products (brand_id);
create index if not exists products_model_year_idx on products (model_year);
create index if not exists products_panel_type_idx on products (panel_type);
create index if not exists products_segment_idx on products (segment);
create index if not exists products_status_idx on products (status);
create index if not exists products_successor_id_idx on products (successor_id);

-- Koppeling product <-> Vendit-artikel. product_id mag NULL zijn (ongematchte artikelen).
create table if not exists vendit_articles (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references products (id) on delete set null,
  vendit_article_id text not null unique,
  vendit_ean        text,
  vendit_description text,
  match_method      match_method,
  match_confidence  numeric(3, 2) check (match_confidence between 0 and 1),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists vendit_articles_product_id_idx on vendit_articles (product_id);
create index if not exists vendit_articles_vendit_ean_idx on vendit_articles (vendit_ean);

drop trigger if exists brands_set_updated_at on brands;
create trigger brands_set_updated_at before update on brands
  for each row execute function set_updated_at();
drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
drop trigger if exists vendit_articles_set_updated_at on vendit_articles;
create trigger vendit_articles_set_updated_at before update on vendit_articles
  for each row execute function set_updated_at();
