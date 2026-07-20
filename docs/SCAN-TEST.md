# Scan-testplan (RFID-chips + barcodes)

Praktische checklist om het scannen van TV's met echte hardware te testen. Twee flows:

- **PriceScan `/scan` + `/koppelen`** — magazijn: chip ↔ product, rol-afhankelijke prijs/marge.
- **Sales Tracker `/tracker/scan`** — verkoopvloer: chip ↔ toestel, dealcalculator.

## 0. Reader instellen

De meeste USB-RFID/barcode-handhelds werken als **keyboard-wedge**: ze "typen" de code en
sturen meestal een **Enter** erachter. Dat is de aanbevolen modus — de app luistert dan overal.

- Zet de reader (indien instelbaar) op **HID / keyboard** met **Enter/CR** als suffix.
- Kan de reader dat niet? De app finaliseert nu ook **na een korte stilte** (120 ms), dus een
  reader zónder suffix werkt ook. Voor seriële readers: gebruik de knop **Web Serial verbinden**
  (alleen Chrome/Edge).
- Diagnose-scherm: **`/dev/scan-test`** toont elke scan met type (rfid/ean) en timing. Gebruik dit
  eerst om te zien of je reader überhaupt tekens doorgeeft en of ze als "scanner" worden herkend.

Test zonder hardware kan altijd via het **handmatige invoerveld** (typ/plak een code + Enter).

## 1. Formaat-check (geen hardware nodig)

Op `/dev/scan-test` of het invoerveld:

- [ ] EAN-13 met geldige checksum → herkend als **ean**.
- [ ] 16–32 hex tekens (bv. `E2801170000002000000A001`) → herkend als **rfid**.
- [ ] Code met spaties/streepjes (`E280 1170 …`) → genormaliseerd, herkend.
- [ ] Te korte/ongeldige code → **rode** foutfeedback, geen actie.
- [ ] Dezelfde code 2× snel achter elkaar → tweede wordt genegeerd (3s debounce).

## 2. PriceScan `/koppelen` (chip aan product hangen)

- [ ] Kies een model (zoek op naam/typenummer/EAN of scan de doos-barcode).
- [ ] Scan een **verse** chip → verschijnt in de lijst "gekoppeld".
- [ ] Scan dezelfde chip nogmaals bij een **ander** model → conflictmelding "al gekoppeld";
      kies verplaatsen.
- [ ] Ontkoppelen werkt (chip → geen product).

## 3. PriceScan `/scan` (rol-afhankelijk)

Login per rol (`admin` / `sales` / `warehouse`, wachtwoord `PriceScan!2026`):

- [ ] **sales** scant gekoppelde chip → model + **verkoop + marge** + voorraad + alternatieven.
- [ ] **warehouse** scant zelfde chip → model + **inkoop**, **géén** verkoop/marge.
- [ ] Onbekende chip → kaart "Onbekende tag" met knop **Nu koppelen**.
- [ ] Gekoppelde-maar-productloze chip → kaart "Tag zonder product".
- [ ] EAN-scan van een model zonder chip → zelfde resultaatkaart.

## 4. Sales Tracker `/tracker/scan` (chip ↔ toestel)

- [ ] Scan een chip die aan een toestel is gekoppeld (of gebruik een seed-EPC
      `E2801170000002000000A0xx`) → toestel opent met dealcalculator.
- [ ] Scan een **onbekende** chip → paneel "Onbekende chip — koppel aan een toestel";
      kies een toestel → chip is gekoppeld en toestel opent.
- [ ] Scan de zojuist gekoppelde chip opnieuw → wordt nu direct herkend.
- [ ] Scan een **EAN** die bij een toestel hoort → toestel opent.
- [ ] "Demo (willekeurig)" werkt nog voor presentaties zonder chips.

## 5. EAN-brug — één chip, overal herkend

De demo-toestellen 1–4 delen hun EAN met PriceScan-producten (seed). Zo werkt de brug:

- [ ] Koppel in **PriceScan `/koppelen`** een verse chip aan product #1 → scan diezelfde chip in de
      **Tracker** → het bijbehorende toestel opent (gespiegeld via EAN).
- [ ] Koppel in de **Tracker** een verse chip aan toestel #2 → scan diezelfde chip in **PriceScan
      `/scan`** → het product verschijnt.
- [ ] Ontkoppel de chip in één app → hij is in beide apps weg.
- [ ] Chip op een toestel/product zónder tegenhanger (geen gedeelde EAN) → werkt gewoon in de
      app waar je hem koppelde; de andere app kent hem niet (verwacht gedrag).

> De brug matcht op EAN. In productie (Vendit) delen product en toestel dezelfde EAN, dus dit werkt
> automatisch. In de demo alleen voor toestellen 1–4 (seed `BRUG_EANS`).

## 6. Randgevallen

- [ ] Snel meerdere verschillende chips achter elkaar → elke scan pakt het juiste item.
- [ ] Reader zonder Enter-suffix → scan finaliseert alsnog (idle-timeout).
- [ ] Netwerk traag/uit → handmatige invoer + calculator blijven werken (Tracker is offline-first).

## Geautomatiseerde tests

- **Unit** (`pnpm test`): classificatie/normalisatie van EPC/EAN — 50 tests.
- **E2E** (`pnpm e2e`): `e2e/scan.spec.ts` (PriceScan rol-gating) + `e2e/tracker-scan.spec.ts`
  (Tracker-herkenning, onbekende chip koppelen, EAN-brug beide richtingen). Vereist de geseede
  lokale stack: `pnpm db:start && pnpm db:seed && pnpm db:seed-users && pnpm db:seed-tracker`,
  daarna `pnpm e2e`. Scannen wordt gesimuleerd via de handmatige invoervelden.

## Bekende grenzen

- De EAN-brug spiegelt via de **service-role** op de server; hij is best-effort en faalt stil als
  er geen tegenhanger met dezelfde EAN bestaat. De primaire koppeling gaat altijd door.
- PriceScan (`rfid_tags`) en Tracker (`toestel_tags`) blijven aparte tabellen; de brug houdt ze in
  sync op basis van EAN. Ze delen (nog) geen catalogus.
- De unit-tests dekken de classificatie/normalisatie (`pnpm test`). Hardware-gedrag (timing,
  suffix) is per reader anders — vandaar `/dev/scan-test`.
