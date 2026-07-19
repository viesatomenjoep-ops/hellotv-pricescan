# Runbook — van 0 naar testen (A-Z)

## 1. Database opzetten (remote project ipwssnspafoidiqlgpad)

Pas alle migraties toe, **op volgorde**, via Supabase Studio → SQL Editor
(`supabase/migrations/0001_types.sql` t/m `0008_alternatives.sql`), of met de CLI:

```bash
supabase link --project-ref ipwssnspafoidiqlgpad   # vraagt DB-wachtwoord
supabase db push
```

## 2. Test-data + gebruikers

```bash
export SUPABASE_URL="https://ipwssnspafoidiqlgpad.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service role key>"
pnpm db:seed          # 6 merken, 24 modellen, prijzen, voorraad, 12+5 RFID-tags
pnpm db:seed-users    # admin/sales/warehouse, wachtwoord PriceScan!2026
```

Inloggen kan met:

| Rol       | E-mail                   | Ziet marge? |
| --------- | ------------------------ | ----------- |
| admin     | admin@hellotv.local      | ja          |
| sales     | sales@hellotv.local      | ja          |
| warehouse | warehouse@hellotv.local  | nee         |

Wachtwoord (alle drie): `PriceScan!2026` — wijzig na eerste login.

## 3. Vercel

Env-vars staan al ingesteld (Supabase + CRON_SECRET). Na `git push` deployt Vercel automatisch.
De cron (`vercel.json`) draait elke 2 uur; die gebruikt nu de **MockVenditAdapter** tot de echte
Vendit-API gekoppeld is.

## 4. Testen met RFID-chips

1. Zet de handheld in **HID / keyboard-wedge**-modus (scanner "typt" de code + Enter).
2. Ga naar **`/dev/scan-test`** (publiek, geen login) en scan een chip — je ziet de code + type.
   - Verwacht EPC-formaat: **hex, 16–32 tekens** (EPC-96 = 24 hex). EAN = 13 cijfers.
3. Log in als **warehouse** of **sales** → **`/scan`** → scan een chip:
   - Onbekende chip → oranje kaart "Onbekende tag" → **Nu koppelen** (EPC voorgevuld).
   - Koppel via **`/koppelen`**: kies model, scan chips (bulk), klaar.
   - Scan daarna dezelfde chip → resultaatkaart met prijs/voorraad (+ marge als sales) + alternatieven.
4. Verschil sales vs warehouse: warehouse ziet **geen** verkoopprijs/marge.

## 5. Lokaal ontwikkelen

```bash
pnpm db:start && pnpm db:seed && pnpm db:seed-users
pnpm dev            # http://localhost:3000
pnpm sync:demo      # sync-engine demo (3 history + 1 quarantaine)
pnpm db:rls-test    # bewijst rol-scheiding
```
