# Database — schema, migraties, seed

Schema in [`../supabase/migrations`](../supabase/migrations); seed in
[`../scripts/seed.ts`](../scripts/seed.ts). Rollen: **admin / sales / warehouse**.

## Lokaal ontwikkelen (Docker vereist)

```bash
pnpm db:start          # start lokale Supabase (poorten 553xx) + past migraties toe
pnpm db:seed           # 6 merken, 24 modellen, prijzen, voorraad, RFID-tags, settings
pnpm db:rls-test       # bewijst RLS per rol (o.a. warehouse ziet GEEN marge)
pnpm db:reset          # drop + herbouw + migraties (opnieuw beginnen), daarna db:seed
pnpm db:types          # regenereer lib/supabase/types.ts uit de lokale DB
```

Lokale Studio: http://127.0.0.1:55323 · API: http://127.0.0.1:55321.
`pnpm db:seed` valt zonder env-vars terug op de lokale DB.

## Remote toepassen (het echte project)

Migraties kunnen niet via de PostgREST-keys; gebruik Studio of de CLI met DB-wachtwoord:

```bash
supabase link --project-ref ipwssnspafoidiqlgpad   # vraagt DB-wachtwoord
supabase db push                                    # migraties
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm db:seed   # testdata (optioneel)
```

Of plak de migraties uit `supabase/migrations` op volgorde in Studio → SQL Editor.

## Schema in het kort

- `brands`, `products` (catalogus 2025/2026, EOL + `successor_id`), `vendit_articles` (koppeling).
- `prices` — 1 rij per product; **`margin_cents`/`margin_pct` zijn GENERATED** (NULL zonder
  verkoop/inkoop). `price_history` (append-only), `price_quarantine` (>40% delta).
- `stock_levels` (per locatie), `rfid_tags` (EPC↔product), `scan_events` (elke scan gelogd).
- `sync_runs`, `alternative_overrides`, `settings`, `profiles`.

## Rollen & zichtbaarheid (RLS, bewezen via `db:rls-test`)

| Rol       | Catalogus | Inkoopprijs        | Verkoop + marge | Beheer |
| --------- | --------- | ------------------ | --------------- | ------ |
| warehouse | ✓         | ✓ (v_prices_basic) | ✗               | ✗      |
| sales     | ✓         | ✓                  | ✓               | ✗      |
| admin     | ✓         | ✓                  | ✓               | ✓      |

- `prices`-tabel: alleen sales/admin. warehouse leest enkel inkoop via `v_prices_basic`.
- Schrijven op prices/stock/sync_runs/history: alleen service role (sync-engine) of RPC.
- Geen anonieme toegang (geen grants aan `anon` + RLS op `current_user_role()`).

## Views & RPC's (B4)

- `v_product_full`, `v_price_changes_recent`, `v_margin_watchlist`, `v_prices_basic`.
- `fn_lookup_scan(p_epc, p_ean)` — scan-scherm in één call (rol-afhankelijk, logt de scan).
- `fn_alternatives(p_product_id, p_limit)` — eerste versie; D5 verfijnt de scoring.

## Rol toekennen (na inloggen)

```sql
update profiles set role = 'admin' where id = '<auth-user-id>';
```
