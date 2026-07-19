// Prijs- en marge-configuratie. Btw-behandeling is een expliciete constante, nooit een
// aanname verspreid door de code (CLAUDE.md domeinregels, PRD §5).

/** Standaard btw-tarief voor tv's (NL). */
export const BTW_TARIEF = 0.21;

/** Vendit-verkoopprijzen zijn standaard inclusief btw, tenzij de API anders aangeeft. */
export const PRIJS_IS_INCL_BTW = true;

/**
 * Globale marge%-ondergrens (0..1). Onder deze waarde geldt een model als "onder de drempel".
 * NB: definitieve waarde is een businesskeuze (PRD §6) — dit is een werk-default.
 */
export const MARGE_DREMPEL_PCT = 0.15;

/** Delta-drempel voor prijs-quarantaine (PRD/CLAUDE.md): > 40% wijziging gaat naar review. */
export const QUARANTAINE_DELTA_PCT = 0.4;
