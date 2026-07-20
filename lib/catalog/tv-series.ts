import type { Serie } from './tv-catalog';

// Gescrapete 2025/2026 Benelux-line-ups per merk (bron: fabrikant + retailers, zie research).
// Onzekere series/maten zijn weggelaten tot ze hard bevestigd zijn. QD-Mini LED → 'Mini-LED',
// QD-OLED → 'QD-OLED'. Prijzen = richt-adviesprijzen (verkoop incl. btw); rest interpoleert.

// ── TCL (geen OLED in Benelux; alles LCD: Mini-LED/QLED/LED) ─────────────────
const TCL: Serie[] = [
  // 2025 "K"
  { merk: 'TCL', familie: 'C6K QLED', panel: 'QLED', jaar: 2025, segment: 'budget', pattern: '{inch}C6K', sizes: [50, 55, 65, 75, 85, 98], anchors: [{ inch: 55, eur: 899 }, { inch: 65, eur: 1199 }] },
  { merk: 'TCL', familie: 'C7K Mini-LED', panel: 'Mini-LED', jaar: 2025, segment: 'mid', pattern: '{inch}C7K', sizes: [50, 55, 65, 75, 85, 98, 115], anchors: [{ inch: 55, eur: 999 }, { inch: 65, eur: 1399 }] },
  { merk: 'TCL', familie: 'C8K Mini-LED', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: '{inch}C8K', sizes: [65, 75, 85, 98], anchors: [{ inch: 65, eur: 1599 }, { inch: 75, eur: 2499 }] },
  { merk: 'TCL', familie: 'C9K Mini-LED', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: '{inch}C9K', sizes: [65, 75, 85], anchors: [{ inch: 65, eur: 1999 }, { inch: 75, eur: 2999 }] },
  { merk: 'TCL', familie: 'P7K QLED', panel: 'QLED', jaar: 2025, segment: 'budget', pattern: '{inch}P7K', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 43, eur: 399 }, { inch: 55, eur: 549 }] },
  { merk: 'TCL', familie: 'P8K QLED', panel: 'QLED', jaar: 2025, segment: 'mid', pattern: '{inch}P8K', sizes: [55, 65, 75], anchors: [{ inch: 55, eur: 799 }] },
  // 2026 "L"
  { merk: 'TCL', familie: 'C7L Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'mid', pattern: '{inch}C7L', sizes: [55, 65, 75, 85, 98], anchors: [{ inch: 55, eur: 1099 }, { inch: 65, eur: 1399 }] },
  { merk: 'TCL', familie: 'C8L Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: '{inch}C8L', sizes: [55, 65, 75, 85, 98], anchors: [{ inch: 65, eur: 1699 }, { inch: 85, eur: 2999 }] },
  { merk: 'TCL', familie: 'P7L QLED', panel: 'QLED', jaar: 2026, segment: 'budget', pattern: '{inch}P7L', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 43, eur: 379 }, { inch: 55, eur: 499 }] },
  { merk: 'TCL', familie: 'P8L Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'mid', pattern: '{inch}P8L', sizes: [55, 65, 75, 85], anchors: [{ inch: 55, eur: 699 }, { inch: 65, eur: 999 }] },
  { merk: 'TCL', familie: 'X11L Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: '{inch}X11L', sizes: [75, 85, 98], anchors: [{ inch: 75, eur: 4299 }, { inch: 98, eur: 8999 }] },
  { merk: 'TCL', familie: 'RM9L RGB-Mini LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: '{inch}RM9L', sizes: [85, 98, 115], anchors: [{ inch: 85, eur: 5999 }, { inch: 115, eur: 12999 }] },
  // 2026-uitbreiding
  { merk: 'TCL', familie: 'C6L QLED', panel: 'QLED', jaar: 2026, segment: 'budget', pattern: '{inch}C6L', sizes: [55, 65, 75, 85, 98], anchors: [{ inch: 55, eur: 799 }, { inch: 65, eur: 999 }] },
  { merk: 'TCL', familie: 'RM7L RGB-Mini LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: '{inch}RM7L', sizes: [65, 75, 85], anchors: [{ inch: 65, eur: 2499 }, { inch: 85, eur: 3999 }] },
];

// ── LG (OLED = 'OLED'; QNED MiniLED = 'Mini-LED'; QNED edge-lit = 'QLED'; UHD = 'LED') ──────
// 2025 met exacte NL-typenummers; 2026 OLED met basispatroon (NL-suffix nog niet gepubliceerd).
const LG: Serie[] = [
  // 2025 OLED
  { merk: 'LG', familie: 'OLED evo G5', panel: 'OLED', jaar: 2025, segment: 'premium', pattern: 'OLED{inch}G56LS', sizes: [48, 55, 65, 77, 83, 97], anchors: [{ inch: 55, eur: 2799 }, { inch: 65, eur: 3299 }] },
  { merk: 'LG', familie: 'OLED evo C5', panel: 'OLED', jaar: 2025, segment: 'premium', pattern: 'OLED{inch}C55LA', sizes: [42, 48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 1599 }, { inch: 65, eur: 1999 }] },
  { merk: 'LG', familie: 'OLED B5', panel: 'OLED', jaar: 2025, segment: 'mid', pattern: 'OLED{inch}B56LA', sizes: [48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 799 }, { inch: 65, eur: 1199 }] },
  // 2025 QNED (MiniLED)
  { merk: 'LG', familie: 'QNED evo QNED93', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: '{inch}QNED93A6A', sizes: [55, 65, 75, 85], anchors: [{ inch: 65, eur: 1899 }] },
  { merk: 'LG', familie: 'QNED evo QNED86', panel: 'Mini-LED', jaar: 2025, segment: 'mid', pattern: '{inch}QNED86A6A', sizes: [55, 65, 75, 86], anchors: [{ inch: 55, eur: 899 }, { inch: 65, eur: 1149 }] },
  // 2025 QNED (edge-lit QLED) + UHD (LED)
  { merk: 'LG', familie: 'QNED80', panel: 'QLED', jaar: 2025, segment: 'mid', pattern: '{inch}QNED80A6A', sizes: [50, 55, 65, 75, 86], anchors: [{ inch: 55, eur: 699 }, { inch: 65, eur: 849 }] },
  { merk: 'LG', familie: 'UHD UA75', panel: 'LED', jaar: 2025, segment: 'budget', pattern: '{inch}UA75006LA', sizes: [43, 50, 55, 65, 75, 86], anchors: [{ inch: 50, eur: 449 }, { inch: 65, eur: 649 }] },
  { merk: 'LG', familie: 'UHD UA73', panel: 'LED', jaar: 2025, segment: 'budget', pattern: '{inch}UA73006LA', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 43, eur: 379 }, { inch: 55, eur: 499 }] },
  // 2026 OLED (basispatroon; NL-suffix + prijzen afgeleid, worden door Vendit overschreven)
  { merk: 'LG', familie: 'OLED evo G6', panel: 'OLED', jaar: 2026, segment: 'premium', pattern: 'OLED{inch}G6', sizes: [55, 65, 77, 83, 97], anchors: [{ inch: 55, eur: 2799 }, { inch: 65, eur: 3499 }] },
  { merk: 'LG', familie: 'OLED evo C6', panel: 'OLED', jaar: 2026, segment: 'premium', pattern: 'OLED{inch}C6', sizes: [42, 48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 1999 }, { inch: 65, eur: 2699 }] },
  { merk: 'LG', familie: 'OLED B6', panel: 'OLED', jaar: 2026, segment: 'mid', pattern: 'OLED{inch}B6', sizes: [48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 1299 }, { inch: 65, eur: 1699 }] },
  // 2026-uitbreiding (QNED-jaarsuffix A6→B; UHD UA→UB)
  { merk: 'LG', familie: 'QNED evo QNED93 (2026)', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: '{inch}QNED93B', sizes: [55, 65, 75, 85], anchors: [{ inch: 65, eur: 1899 }] },
  { merk: 'LG', familie: 'QNED evo QNED86 (2026)', panel: 'Mini-LED', jaar: 2026, segment: 'mid', pattern: '{inch}QNED86B', sizes: [50, 55, 65, 75, 86], anchors: [{ inch: 55, eur: 899 }, { inch: 65, eur: 1149 }] },
  { merk: 'LG', familie: 'QNED80 (2026)', panel: 'QLED', jaar: 2026, segment: 'mid', pattern: '{inch}QNED80B', sizes: [50, 55, 65, 75, 86], anchors: [{ inch: 55, eur: 699 }, { inch: 65, eur: 849 }] },
  { merk: 'LG', familie: 'UHD UB80', panel: 'LED', jaar: 2026, segment: 'budget', pattern: '{inch}UB80006LB', sizes: [43, 50, 55, 65, 75, 86], anchors: [{ inch: 50, eur: 449 }, { inch: 65, eur: 649 }] },
];
// ── Samsung (QE = QLED/OLED/Neo; UE = Crystal UHD; 2025 = F, 2026 = H) ───────
const SAMSUNG: Serie[] = [
  // 2025
  { merk: 'Samsung', familie: 'Neo QLED 8K QN990F', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: 'QE{inch}QN990F', sizes: [65, 77, 85, 98], anchors: [{ inch: 65, eur: 5799 }, { inch: 85, eur: 10999 }] },
  { merk: 'Samsung', familie: 'Neo QLED 8K QN900F', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: 'QE{inch}QN900F', sizes: [65, 75, 85], anchors: [{ inch: 65, eur: 3499 }, { inch: 75, eur: 4999 }] },
  { merk: 'Samsung', familie: 'Neo QLED QN90F', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: 'QE{inch}QN90F', sizes: [43, 50, 55, 65, 75, 85, 98], anchors: [{ inch: 55, eur: 1799 }, { inch: 65, eur: 2499 }] },
  { merk: 'Samsung', familie: 'Neo QLED QN80F', panel: 'Mini-LED', jaar: 2025, segment: 'mid', pattern: 'QE{inch}QN80F', sizes: [50, 55, 65, 75, 85, 100], anchors: [{ inch: 55, eur: 1399 }, { inch: 65, eur: 1799 }] },
  { merk: 'Samsung', familie: 'Neo QLED QN70F', panel: 'Mini-LED', jaar: 2025, segment: 'mid', pattern: 'QE{inch}QN70F', sizes: [55, 65, 75, 85], anchors: [{ inch: 55, eur: 1099 }, { inch: 65, eur: 1399 }] },
  { merk: 'Samsung', familie: 'OLED S95F', panel: 'QD-OLED', jaar: 2025, segment: 'premium', pattern: 'QE{inch}S95F', sizes: [55, 65, 77, 83], anchors: [{ inch: 55, eur: 2599 }, { inch: 65, eur: 3499 }] },
  { merk: 'Samsung', familie: 'OLED S90F', panel: 'QD-OLED', jaar: 2025, segment: 'premium', pattern: 'QE{inch}S90F', sizes: [42, 48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 1999 }, { inch: 65, eur: 2699 }] },
  { merk: 'Samsung', familie: 'OLED S85F', panel: 'OLED', jaar: 2025, segment: 'mid', pattern: 'QE{inch}S85F', sizes: [55, 65, 77, 83], anchors: [{ inch: 55, eur: 1499 }, { inch: 65, eur: 1999 }] },
  { merk: 'Samsung', familie: 'QLED Q7F', panel: 'QLED', jaar: 2025, segment: 'mid', pattern: 'QE{inch}Q7F', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 55, eur: 699 }, { inch: 65, eur: 899 }] },
  { merk: 'Samsung', familie: 'Crystal UHD U7000F', panel: 'LED', jaar: 2025, segment: 'budget', pattern: 'UE{inch}U7000F', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 55, eur: 449 }, { inch: 65, eur: 599 }] },
  { merk: 'Samsung', familie: 'The Frame LS03F', panel: 'QLED', jaar: 2025, segment: 'mid', pattern: 'QE{inch}LS03F', sizes: [32, 43, 50, 55], anchors: [{ inch: 43, eur: 1349 }, { inch: 55, eur: 1699 }] },
  { merk: 'Samsung', familie: 'The Frame Pro LS03FW', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: 'QE{inch}LS03FW', sizes: [65, 75, 85], anchors: [{ inch: 65, eur: 2399 }, { inch: 85, eur: 3299 }] },
  // 2026
  { merk: 'Samsung', familie: 'OLED S95H', panel: 'QD-OLED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}S95H', sizes: [48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 2499 }, { inch: 65, eur: 3299 }] },
  { merk: 'Samsung', familie: 'OLED S90H', panel: 'QD-OLED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}S90H', sizes: [42, 48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 1899 }, { inch: 65, eur: 2599 }] },
  { merk: 'Samsung', familie: 'OLED S85H', panel: 'OLED', jaar: 2026, segment: 'mid', pattern: 'QE{inch}S85H', sizes: [48, 55, 65, 77, 83], anchors: [{ inch: 55, eur: 1399 }, { inch: 65, eur: 1899 }] },
  { merk: 'Samsung', familie: 'Neo QLED 8K QN990H', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}QN990H', sizes: [65, 77, 85, 98], anchors: [{ inch: 65, eur: 9999 }, { inch: 85, eur: 14999 }] },
  { merk: 'Samsung', familie: 'Neo QLED QN80H', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}QN80H', sizes: [55, 65, 75, 85, 100], anchors: [{ inch: 55, eur: 1349 }, { inch: 65, eur: 1749 }] },
  { merk: 'Samsung', familie: 'Neo QLED QN70H', panel: 'Mini-LED', jaar: 2026, segment: 'mid', pattern: 'QE{inch}QN70H', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 55, eur: 1099 }, { inch: 65, eur: 1399 }] },
  { merk: 'Samsung', familie: 'The Frame LS03H', panel: 'QLED', jaar: 2026, segment: 'mid', pattern: 'QE{inch}LS03H', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 43, eur: 1349 }, { inch: 55, eur: 1699 }] },
  { merk: 'Samsung', familie: 'The Frame Pro LS03HW', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}LS03HW', sizes: [55, 65, 75, 85], anchors: [{ inch: 55, eur: 1699 }, { inch: 65, eur: 2199 }] },
  { merk: 'Samsung', familie: 'Crystal UHD U7000H', panel: 'LED', jaar: 2026, segment: 'budget', pattern: 'UE{inch}U7000H', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 55, eur: 449 }, { inch: 65, eur: 599 }] },
  // 2026-uitbreiding
  { merk: 'Samsung', familie: 'OLED S99H', panel: 'QD-OLED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}S99H', sizes: [55, 65, 77, 83], anchors: [{ inch: 65, eur: 3999 }, { inch: 77, eur: 5499 }] },
  { merk: 'Samsung', familie: 'Micro RGB R95H', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}R95H', sizes: [75, 85, 98], anchors: [{ inch: 75, eur: 3299 }, { inch: 98, eur: 6999 }] },
  { merk: 'Samsung', familie: 'Micro RGB R85H', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'QE{inch}R85H', sizes: [55, 65, 75, 85], anchors: [{ inch: 55, eur: 1399 }, { inch: 65, eur: 1799 }] },
  { merk: 'Samsung', familie: 'Neo QLED Mini LED M80H', panel: 'Mini-LED', jaar: 2026, segment: 'mid', pattern: 'QE{inch}M80H', sizes: [55, 65, 75, 85], anchors: [{ inch: 55, eur: 899 }, { inch: 65, eur: 1099 }] },
  { merk: 'Samsung', familie: 'Neo QLED Mini LED M70H', panel: 'Mini-LED', jaar: 2026, segment: 'budget', pattern: 'QE{inch}M70H', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 43, eur: 499 }, { inch: 55, eur: 699 }] },
];

// ── Sony BRAVIA (K-{inch}{serie}) ────────────────────────────────────────────
const SONY: Serie[] = [
  // 2025
  { merk: 'Sony', familie: 'BRAVIA 8 II QD-OLED', panel: 'QD-OLED', jaar: 2025, segment: 'premium', pattern: 'K-{inch}XR80M2', sizes: [55, 65], anchors: [{ inch: 55, eur: 2999 }, { inch: 65, eur: 3699 }] },
  { merk: 'Sony', familie: 'BRAVIA 5 Mini-LED', panel: 'Mini-LED', jaar: 2025, segment: 'mid', pattern: 'K-{inch}XR55B', sizes: [55, 65, 75, 85, 98], anchors: [{ inch: 55, eur: 1099 }, { inch: 65, eur: 1297 }] },
  { merk: 'Sony', familie: 'BRAVIA 3 LED', panel: 'LED', jaar: 2025, segment: 'budget', pattern: 'K-{inch}S35B', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 43, eur: 599 }, { inch: 55, eur: 749 }] },
  // 2026
  { merk: 'Sony', familie: 'BRAVIA 9 II Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'K-{inch}XR90M2', sizes: [65, 75, 85, 115], anchors: [{ inch: 65, eur: 3499 }, { inch: 85, eur: 6999 }] },
  { merk: 'Sony', familie: 'BRAVIA 7 II Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: 'K-{inch}XR75M2', sizes: [50, 55, 65, 75, 85, 98], anchors: [{ inch: 55, eur: 1899 }, { inch: 65, eur: 2219 }] },
  { merk: 'Sony', familie: 'BRAVIA 3 II LED', panel: 'LED', jaar: 2026, segment: 'mid', pattern: 'K-{inch}XR30M2', sizes: [43, 50, 55, 65, 75, 85, 100], anchors: [{ inch: 55, eur: 799 }, { inch: 65, eur: 899 }] },
  { merk: 'Sony', familie: 'BRAVIA 2 II LED', panel: 'LED', jaar: 2026, segment: 'budget', pattern: 'K-{inch}S20M2', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 55, eur: 599 }, { inch: 65, eur: 679 }] },
];

// ── Philips (Ambilight; {inch}<serie>/12; 2025 eindigt op 0, 2026 op 1) ──────
const PHILIPS: Serie[] = [
  // 2025
  { merk: 'Philips', familie: 'OLED+ 950', panel: 'OLED', jaar: 2025, segment: 'premium', pattern: '{inch}OLED950/12', sizes: [65, 77], anchors: [{ inch: 65, eur: 2499 }, { inch: 77, eur: 3499 }] },
  { merk: 'Philips', familie: 'OLED+ 910', panel: 'OLED', jaar: 2025, segment: 'premium', pattern: '{inch}OLED910/12', sizes: [55, 65, 77], anchors: [{ inch: 65, eur: 2299 }] },
  { merk: 'Philips', familie: 'OLED 810', panel: 'OLED', jaar: 2025, segment: 'mid', pattern: '{inch}OLED810/12', sizes: [42, 48, 55, 65, 77], anchors: [{ inch: 55, eur: 1399 }, { inch: 65, eur: 1799 }] },
  { merk: 'Philips', familie: 'OLED 760', panel: 'OLED', jaar: 2025, segment: 'mid', pattern: '{inch}OLED760/12', sizes: [48, 55, 65, 77], anchors: [{ inch: 55, eur: 1199 }] },
  { merk: 'Philips', familie: 'MLED950 The Xtra', panel: 'Mini-LED', jaar: 2025, segment: 'premium', pattern: '{inch}MLED950/12', sizes: [65, 75], anchors: [{ inch: 65, eur: 1799 }] },
  { merk: 'Philips', familie: 'MLED910', panel: 'Mini-LED', jaar: 2025, segment: 'mid', pattern: '{inch}MLED910/12', sizes: [55, 65, 75, 85], anchors: [{ inch: 65, eur: 1399 }] },
  { merk: 'Philips', familie: 'The One PUS9000', panel: 'QLED', jaar: 2025, segment: 'mid', pattern: '{inch}PUS9000/12', sizes: [43, 50, 55, 65, 75, 85], anchors: [{ inch: 55, eur: 799 }, { inch: 65, eur: 999 }] },
  { merk: 'Philips', familie: 'PUS8500', panel: 'LED', jaar: 2025, segment: 'budget', pattern: '{inch}PUS8500/12', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 50, eur: 599 }, { inch: 65, eur: 749 }] },
  { merk: 'Philips', familie: 'PUS8000', panel: 'LED', jaar: 2025, segment: 'budget', pattern: '{inch}PUS8000/12', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 43, eur: 449 }, { inch: 55, eur: 599 }] },
  // 2026
  { merk: 'Philips', familie: 'OLED+ 951', panel: 'OLED', jaar: 2026, segment: 'premium', pattern: '{inch}OLED951/12', sizes: [65, 77], anchors: [{ inch: 65, eur: 2699 }] },
  { merk: 'Philips', familie: 'OLED+ 911', panel: 'OLED', jaar: 2026, segment: 'premium', pattern: '{inch}OLED911/12', sizes: [48, 55, 65, 77], anchors: [{ inch: 65, eur: 2499 }] },
  { merk: 'Philips', familie: 'OLED 811', panel: 'OLED', jaar: 2026, segment: 'mid', pattern: '{inch}OLED811/12', sizes: [42, 48, 55, 65, 77], anchors: [{ inch: 55, eur: 1499 }, { inch: 65, eur: 1899 }] },
  { merk: 'Philips', familie: 'OLED 761', panel: 'OLED', jaar: 2026, segment: 'mid', pattern: '{inch}OLED761/12', sizes: [55, 65, 77], anchors: [{ inch: 55, eur: 1199 }] },
  { merk: 'Philips', familie: 'The One PQS9001', panel: 'QLED', jaar: 2026, segment: 'mid', pattern: '{inch}PQS9001/12', sizes: [43, 50, 55, 65, 75, 85, 100], anchors: [{ inch: 55, eur: 849 }, { inch: 65, eur: 1049 }] },
  // 2026-uitbreiding (LED-instap eindigt op 1)
  { merk: 'Philips', familie: 'MLED981 RGB Mini-LED', panel: 'Mini-LED', jaar: 2026, segment: 'premium', pattern: '{inch}MLED981/12', sizes: [75, 85], anchors: [{ inch: 85, eur: 3499 }] },
  { merk: 'Philips', familie: 'PUS8501', panel: 'LED', jaar: 2026, segment: 'budget', pattern: '{inch}PUS8501/12', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 50, eur: 599 }, { inch: 65, eur: 749 }] },
  { merk: 'Philips', familie: 'PUS8001', panel: 'LED', jaar: 2026, segment: 'budget', pattern: '{inch}PUS8001/12', sizes: [43, 50, 55, 65, 75], anchors: [{ inch: 43, eur: 449 }, { inch: 55, eur: 599 }] },
];

export const SERIES: Serie[] = [...TCL, ...SAMSUNG, ...LG, ...SONY, ...PHILIPS];
