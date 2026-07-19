# Security-audit (G2)

Interne app met bedrijfsgevoelige inkoopprijzen en marges. Samenvatting van de controles.

## 1. RLS (rol-scheiding) — `pnpm db:rls-test`

Bewezen tegen de lokale DB (alle PASS):

- **warehouse** ziet de `prices`-tabel niet, ziet géén marge in `v_product_full`, en kan
  `prices` **niet schrijven**. Leest wel inkoopprijs (via `v_prices_basic`), voorraad en settings.
- **sales** ziet prijzen + marge; ziet `price_quarantine` niet.
- **admin** ziet alles, inclusief quarantaine.
- **anon** (geen sessie) ziet geen producten en geen prijzen (geen grants + RLS).
- Schrijven op `prices`/`stock_levels`/`sync_runs`/`price_history` gebeurt alleen via de
  service role (sync-engine) of de goedkeur-RPC's.
- Quarantaine goedkeuren/afwijzen (`approve_quarantine`/`reject_quarantine`) en matches
  bevestigen (`confirm_match`) controleren `current_user_role() = 'admin'`.

## 2. Secrets in de client-bundle — 0 hits

`.next/static` doorzocht op `service_role`, `sb_secret_…`, `VENDIT_API_*`, `CRON_SECRET`:
**0 echte secret-waarden**. (De string `sb_secret` komt één keer voor als guard binnen
`@supabase/supabase-js` — `startsWith("sb_secret_")` — geen leak.)

- `lib/supabase/admin.ts` is **server-only** (`import 'server-only'`): een build-error als het in
  een client bundle belandt. Service-role/secret keys hebben geen `NEXT_PUBLIC_`-prefix.
- Alleen `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` staan bewust in de
  frontend (anon key is publiek bedoeld; RLS is de poort).

## 3. Route handlers & validatie

- **Zod op elke grens**: scan/koppel/quarantaine/matching/instellingen-acties valideren input.
- `/api/sync` weigert zonder `Authorization: Bearer CRON_SECRET` (401) en voorkomt dubbele runs
  (409 bij een lopende run < 15 min).
- Middleware zet alles achter login; `/beheer/*` en `/dashboard` checken `requireRole(['admin'])`
  server-side.

## Restrisico's / aandachtspunten

- **Rate limiting** op de scan- en alternatieven-routes (30/min per gebruiker) is nog **niet**
  geïmplementeerd — aanbevolen voor productie (nu server actions zonder throttle).
- **SSO (Microsoft Entra)** staat gepland maar niet actief; nu e-mail/wachtwoord. Wachtwoorden
  van de seed-gebruikers direct wijzigen.
- **Service-role/secret keys**: zijn in deze sessie gedeeld in chat — overweeg te roteren in
  het Supabase-dashboard.
- Kolom-scheiding voor warehouse steunt op de `v_prices_basic`-view + RLS (niet op Postgres
  kolom-privileges, omdat alle ingelogde gebruikers dezelfde `authenticated`-rol delen).
