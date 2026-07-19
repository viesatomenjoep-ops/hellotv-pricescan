# CLAUDE.md — hellotv-pricescan

## 1. Doel

Interne app voor **helloTV**. Een medewerker scant een tv met een RFID-handheld en ziet
direct: model, actuele **inkoopprijs**, **verkoopprijs**, **marge (EUR én %)**, **voorraad**,
en slimmere **alternatieven die op voorraad zijn**.

Bron van waarheid voor prijzen, verkoop en voorraad is het **Vendit VMS**-kassasysteem
(sync via de Vendit API). De catalogus bevat alle tv-modellen van modeljaar **2025 en 2026**.

## 2. Stack

Next.js 14 (App Router) · TypeScript strict · Supabase (Postgres + Auth + **RLS**) ·
Tailwind + shadcn/ui · Vercel (hosting + cron).

## 3. Conventies

- **Server components** standaard; alleen `"use client"` waar interactie nodig is.
- **Alle datatoegang via `lib/supabase`** — nooit los een client instantiëren.
- **Zod op elke API-grens** (inkomend én uitgaand, incl. Vendit-responses).
- **Geen secrets in de frontend.** `service_role`/secret keys alleen server-side.
- **Nederlandse UI-teksten.**
- Absolute imports via `@/`. pnpm. ESLint + Prettier moeten schoon zijn.

## 4. Domeinregels

- **Alle bedragen in centen (integer).** Nooit floats voor geld.
- **Marge** = `verkoopprijs_excl_btw − inkoopprijs`.
  **Marge%** = `marge / verkoopprijs_excl_btw`.
- Vendit-verkoopprijzen zijn **incl. 21% btw** tenzij de API anders aangeeft.
  De btw-behandeling is een **expliciete config-constante**, nooit een aanname in code.
- Elke prijswijziging → **`price_history`**. Een delta **> 40%** gaat naar **quarantaine**,
  nooit direct live.
- Eén **RFID-tag (EPC)** hoort bij **precies 1 product**. **Elke scan wordt gelogd.**
- Marges zijn gevoelig: zichtbaarheid is **rol-gebonden** (zie blok G).

## G. Rollen & zichtbaarheid

Afgedwongen via Supabase **RLS**, niet alleen in de UI:

- **medewerker** — ziet model, verkoopprijs, voorraad en alternatieven. **Geen** inkoopprijs
  of marge.
- **manager** — ziet alles, inclusief inkoopprijs en marge (EUR + %).
- **admin** — als manager, plus beheer van quarantaine, config en gebruikers.

Marge- en inkoopvelden worden nooit naar een client gestuurd voor rollen die ze niet mogen zien.

## Code-review subagent

Voor een codebase-review: start een subagent **zonder projectcontext** die beoordeelt op
dode code, dubbele logica, ontbrekende foutafhandeling, type-gaten (`any`, onveilige casts) en
afwijkingen van deze conventies. Output = genummerd rapport met prioriteit (hoog/middel/laag),
`bestand:regel`, beschrijving en concrete fix. Fix daarna alle **hoog**-punten.

## Bron van waarheid

De volledige productspecificatie staat in **[`docs/PRD.md`](docs/PRD.md)** en is leidend bij
twijfel of conflict met deze samenvatting.

---

**Onderhoud:** werk dit bestand zelf bij wanneer ik zeg: _"voeg dit toe aan CLAUDE.md."_
