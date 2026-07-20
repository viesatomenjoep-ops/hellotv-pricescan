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

## 5. Randgevallen

- [ ] Snel meerdere verschillende chips achter elkaar → elke scan pakt het juiste item.
- [ ] Reader zonder Enter-suffix → scan finaliseert alsnog (idle-timeout).
- [ ] Netwerk traag/uit → handmatige invoer + calculator blijven werken (Tracker is offline-first).

## Bekende grenzen

- Tracker en PriceScan hebben **gescheiden** koppelingen: een chip die je in PriceScan aan een
  *product* hangt, is niet automatisch bekend in de Tracker (`toestel_tags` is apart). Koppel in
  het scherm waar je hem gebruikt.
- De unit-tests dekken de classificatie/normalisatie (`pnpm test`). Hardware-gedrag (timing,
  suffix) is per reader anders — vandaar `/dev/scan-test`.
