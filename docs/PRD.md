# PRD — helloTV PriceScan

Bron van waarheid voor het product. Bij conflict met [`../CLAUDE.md`](../CLAUDE.md) is dit document leidend.

## 1. Doel

Interne app waarmee een helloTV-medewerker een tv scant met een RFID-handheld en direct
model, inkoopprijs, verkoopprijs, marge (EUR + %), voorraad en betere alternatieven op
voorraad ziet. Vendit VMS is de bron van waarheid; PriceScan leest en verrijkt, maar schrijft
niet terug.

### Kernmetrieken (v1)

| Metriek                                                          | Doel                      |
| ---------------------------------------------------------------- | ------------------------- |
| Scan → volledig resultaat (prijs, marge, alternatieven)          | **< 2 s** (p95)           |
| Versheid prijzen en voorraad tijdens winkeltijden                | **nooit ouder dan 4 uur** |
| Prijswijzigingen met delta **> 40%** die live gaan zonder review | **0**                     |
| RFID-tags gekoppeld aan precies 1 product                        | **100%**                  |

## 2. Gebruikers

- **Magazijn** — scannen en RFID-tags koppelen aan modellen.
- **Verkoop** — scannen op de vloer; marge + alternatieven als verkoopwapen in het gesprek.
- **Beheer** — catalogus-import, Vendit-matching, sync-bewaking, quarantaine-review.
- **Inkoop** — bewaakt modellen die door inkoopprijsstijging onder de marge-drempel zakken.

## 3. User stories

1. Als **verkoper** scan ik een toestel en zie ik model, verkoopprijs, marge en **3
   alternatieven op voorraad met betere marge**, zodat ik gericht kan bijsturen in het gesprek.
2. Als **magazijnmedewerker** koppel ik een nieuwe RFID-tag aan een model in **max 3 handelingen**.
3. Als **beheerder** zie ik welke **2025/2026-modellen nog geen Vendit-match** hebben.
4. Als **beheerder** review ik **gequarantainede prijswijzigingen** voordat ze live gaan.
5. Als **inkoper** zie ik welke modellen door een **inkoopprijsstijging onder de marge-drempel**
   zijn gezakt.

## 4. Featurelijst per blok (MoSCoW)

### B. Scannen & resultaat

- **Must** RFID-scan (EPC) → productresultaat < 2 s; scan zonder match toont "koppelen".
- **Must** Resultaatscherm: model, verkoopprijs, marge (rol-afhankelijk), voorraad.
- **Should** Handmatige fallback: zoeken op model/EAN als tag ontbreekt.
- **Could** Offline-cache van laatste sync voor slechte wifi op de vloer.

### C. Prijs & marge

- **Must** Bedragen in centen; marge = verkoopprijs_excl_btw − inkoopprijs; marge% idem.
- **Must** Btw-behandeling als expliciete config-constante (default 21%, incl.).
- **Should** Marge-drempel per model/categorie met visuele waarschuwing onder drempel.

### D. Alternatieven

- **Must** Top-3 alternatieven **op voorraad**, gerangschikt op een **gewogen score** van
  marge-EUR + marge-% (en optioneel voorraaddruk); weging instelbaar.
- **Must** Klasse-match primair op **schermdiagonaal + paneltype**, aangevuld met
  **prijsklasse/segment**; Vendit-categorie als fallback.
- **Should** Uitleg waarom (bv. "+€120 marge, vergelijkbaar formaat/panel").

### E. Vendit-sync (read-only)

- **Must** Periodieke sync van prijzen, voorraad en verkoop; versheid ≤ 4 u in winkeltijden.
- **Must** Vercel-cron met `CRON_SECRET`; Zod-validatie op elke Vendit-response.
- **Should** Sync-statuspagina met laatste run, duur en fouten.
- **Won't (v1)** Terugschrijven naar Vendit.

### F. Catalogus & matching

- **Must** Catalogus van alle 2025/2026-modellen; koppeling model ↔ Vendit-artikel.
- **Must** RFID-tag koppelen aan model in max 3 handelingen; EPC uniek per product.
- **Must** Overzicht **ongematchte** 2025/2026-modellen.
- **Could** Voorstellen voor waarschijnlijke matches (fuzzy op naam/EAN).

### G. Rollen & autorisatie

- **Must** RLS-rollen medewerker / manager / admin (zie CLAUDE.md blok G).
- **Must** Inkoop- en margevelden worden nooit naar niet-gerechtigde clients gestuurd.
- **Must** Auth via **SSO** (bestaand helloTV-account, Google/Microsoft).
- **Should** Inkoper-rol/-view voor marge-drempelbewaking.
- **Could** Snelle login met **pincode per persoon of VMS-code** op de handheld (na v1).

### H. Prijshistorie & quarantaine

- **Must** Elke prijswijziging → `price_history`; delta > 40% → quarantaine, niet live.
- **Must** Review-flow: goedkeuren/afwijzen met wie/wanneer/waarom.
- **Should** Notificatie (Resend) bij nieuwe quarantaine-items.

### I. Beheer & monitoring

- **Must** Import van modeljaar-catalogus (2025/2026).
- **Must** Scanlog (elke scan) en audit-trail op prijs- en koppelacties.
- **Should** Beheerdashboard: sync-gezondheid, ongematcht, quarantaine, drempel-overtreders.
- **Could** Inkoper-alert bij zakken onder marge-drempel.

## 5. Definities & aannames

Vastgelegd zodat implementatie niet stilletjes een keuze inbakt. "Aanname" = mijn default
tot helloTV/Vendit bevestigt (zie §6).

### Geld & afronding

- Alle bedragen zijn **integer eurocenten**; rekenen in centen, pas bij weergave naar €.
- Afronding: **round-half-up** op hele centen, **één** afrondstap op het eindbedrag.
- Btw uit incl.-prijs: `excl = round(incl / (1 + BTW_TARIEF))`. Config: `BTW_TARIEF = 0.21`,
  `PRIJS_IS_INCL_BTW = true`. Overschrijfbaar per artikel als Vendit tarief/incl-vlag meegeeft.
- **Aanname:** Vendit-**inkoopprijs is excl. btw** (netto). → bevestigen (§6).

### Marge

- `marge = verkoopprijs_excl_btw − inkoopprijs` (centen).
- `marge% = marge / verkoopprijs_excl_btw`, getoond op 1 decimaal.
- Als `verkoopprijs_excl_btw ≤ 0` of inkoop/verkoop ontbreekt → marge en marge% = **onbekend**
  ("—"), nooit 0. Negatieve marge mag en wordt als waarschuwing (rood) getoond.

### Marge-drempel

- Config als **marge%-ondergrens**: globale default + optionele override per categorie/model
  (meest specifieke wint). Een model is "onder de drempel" als `marge% < drempel` na
  (her)berekening. **Default-waarde = businesskeuze → §6.**

### Quarantaine & price_history

- Delta t.o.v. de **laatst live prijs** van hetzelfde type: `delta = |nieuw − live| / live`.
  Strikt **> 40%** → quarantaine; anders direct live + `price_history`.
- Eerste prijs (geen baseline) gaat direct live. Tijdens quarantaine blijft de **laatst
  goedgekeurde prijs** zichtbaar. Max. **één open item per product per prijstype**; een nieuwe
  sync overschrijft het openstaande voorstel.
- **Goedkeuren** → prijs live + `price_history`; **afwijzen** → voorstel weg, live ongewijzigd.
  Uitvoerbaar door **admin** (CLAUDE.md blok G).
- `price_history` legt vast: product, prijstype (inkoop/verkoop), oud→nieuw (centen), delta,
  bron (sync/handmatig), actor, tijdstip.
- Richting van de 40%-regel: **aanname verkoopprijs, beide richtingen** → §6.

### Alternatieven

- Kandidaten: andere 2025/2026-modellen, **voorraad > 0**, **niet** het gescande model.
- Klasse: **gelijke schermdiagonaal (exact in inch) + gelijk paneltype**; < 3 resultaten →
  verbreden naar prijssegment (**aanname ±20%** van de verkoopprijs).
- Rangschikking: gewogen score `w1·marge% + w2·marge_EUR(genormaliseerd) [+ w3·voorraaddruk]`,
  default `w1=0,6 w2=0,4 w3=0`, configureerbaar. Toon top 3; minder → toon wat er is.
- **Aanname:** merk-overstijgend (beste marge telt, ongeacht merk).

### Rolmodel (PRD-groepen → RLS-rollen)

Aanname tot definitief model (§6):

- **magazijn** → `medewerker` + recht _tags koppelen_
- **verkoop** → `medewerker`
- **inkoop** → `manager` + inkoper-view (marge zichtbaar)
- **beheer** → `admin`

Zichtbaarheid van inkoop/marge volgt CLAUDE.md blok G.

### EPC & scannen

- EPC opgeslagen als **hex-string, uppercase, zonder scheidingstekens**.
- Eén EPC = **één fysiek toestel** dat bij **één model** hoort; prijs/marge/voorraad op
  **modelniveau**. Onbekende EPC → koppel-flow (scan → model kiezen → bevestigen = 3 handelingen),
  voor magazijn/beheer. Elke scan gelogd: EPC, tijdstip, gebruiker, resultaat, gekoppeld model.

### Sync & niet-functioneel

- Cron **elk uur** (ruim binnen 4 u). Tijdzone **Europe/Amsterdam**, valuta **EUR**.
- Zod valideert elke Vendit-response; ongeldige records worden overgeslagen en gelogd, nooit
  half doorgevoerd. Read-only.
- **< 2 s p95** gemeten **end-to-end op winkel-wifi**; server-budget richtlijn **≤ 500 ms** p95.
- UI **nl-NL** only.

## 6. Open beslispunten

Alleen **Tom / helloTV / Vendit** kan deze beantwoorden; tot dan gelden de aannames in §5.

- **Btw & inkoopprijs:** is de Vendit-inkoopprijs excl. btw? Welk veld geeft het btw-tarief en
  of de prijs incl./excl. is? Bestaan er tv's met afwijkend tarief?
- **Marge-drempel:** welke default marge%-ondergrens, en afwijkingen per categorie?
- **Quarantaine-richting:** 40% op verkoopprijs (beide richtingen / alleen daling) en/of op
  inkoopprijs?
- **Vendit API:** auth-schema (key/secret hoe gebruikt), rate limits, paginatie, incrementele
  "changed since"-sync, testomgeving. Welke sleutel matcht artikel ↔ model (EAN/SKU)?
- **Verkoop-sync:** waarvoor wordt verkoopdata gebruikt (bv. voorraaddruk/omloopsnelheid)?
- **Voorraad-locaties:** één voorraadpool of per vestiging? "Op voorraad" = welke locatie?
- **Prijs-mismatch:** akkoord dat PriceScan bij quarantaine tijdelijk een **andere prijs toont
  dan de Vendit-kassa**?
- **Rolmodel:** definitieve mapping magazijn/verkoop/inkoop/beheer → RLS-rollen; mag iemand
  meerdere rollen hebben?
- **SSO:** welke IdP (Google Workspace / Microsoft Entra)? Latere pincode/VMS-code — bron van
  die code?
- **Catalogus-import:** bron en formaat van de 2025/2026-lijst; welke attributen
  (schermdiagonaal, paneltype, segment) worden geleverd en door wie onderhouden?
- **Model ↔ Vendit-artikel:** 1:1 of 1:veel (kleur/variant)? Prijs/voorraad dan per artikel of
  geaggregeerd?
- **Handheld-hardware:** browser + keyboard-wedge vs. native scanner-SDK; schermformaat.
- **AVG/retentie:** bewaartermijn scanlog/audit (persoonsgegevens) en grondslag.
- **Volumes:** aantal modellen, tags en scans/dag (indexering/capaciteit).

## 7. Niet in scope (v1)

Terugschrijven naar Vendit (alleen lezen) · verkooporders · voorraadtelling · multi-tenant.
