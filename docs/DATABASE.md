# Database — migraties toepassen

Het schema staat als SQL in [`../supabase/migrations`](../supabase/migrations); seed-data in
[`../supabase/seed.sql`](../supabase/seed.sql). Toepassen kan op twee manieren.

## Optie A — Supabase Studio (snelst, geen tooling)

1. Open het project in [Supabase Studio](https://supabase.com/dashboard) → **SQL Editor**.
2. Plak en run in deze volgorde:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_functions.sql`
   - `supabase/seed.sql` (optioneel, demo-data)

## Optie B — Supabase CLI

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref ipwssnspafoidiqlgpad   # vraagt DB-wachtwoord
pnpm dlx supabase db push                                    # migraties
pnpm dlx supabase db execute --file supabase/seed.sql        # seed (optioneel)
```

## Wat het schema doet (blok B & F)

- `models` — catalogus 2025/2026. `vendit_articles` — prijs/voorraad per model (later Vendit-sync).
- `tags` — EPC ↔ model (1 tag = 1 model). `scans` — elke scan gelogd. `profiles` — rol per user.
- **RLS** dwingt blok G af: prijs/marge lopen alleen via de RPC `scan_lookup`, die inkoop + marge
  **enkel** teruggeeft aan `manager`/`admin`. Clients lezen `vendit_articles` niet rechtstreeks.
- RPC's: `scan_lookup(epc)`, `couple_tag(epc, model_id)`, `unmatched_models()`.

## Rollen tijdens ontwikkeling

Auth (SSO) is nog niet gekoppeld (blok G, PRD §6). Zonder sessie geldt een gebruiker als
**`medewerker`** → geen marge zichtbaar; beheer-pagina's geven "Geen rechten". Om marge/beheer te
testen, maak na het koppelen van auth een profiel aan met een hogere rol:

```sql
update profiles set role = 'admin' where id = '<auth-user-id>';
```
