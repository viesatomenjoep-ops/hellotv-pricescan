-- 0011_import_runs — logboek van catalogus-imports (D1).

create table if not exists import_runs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'success',
  new_count     integer not null default 0,
  updated_count integer not null default 0,
  invalid_count integer not null default 0,
  error_text    text
);
create index if not exists import_runs_started_at_idx on import_runs (started_at desc);

alter table import_runs enable row level security;
create policy import_runs_admin_all on import_runs
  for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
