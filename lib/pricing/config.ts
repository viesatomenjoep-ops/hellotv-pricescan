// Prijs- en marge-drempels — fallback-defaults in ÉÉN eenheid (procenten, hele getallen).
// De runtime-bron is de settings-tabel; deze constanten zijn de fallback als een setting ontbreekt.
// CLAUDE.md: btw-behandeling/drempel is een expliciete config-constante, nooit een losse aanname.

/** Fallback: prijswijziging > deze delta% gaat naar quarantaine (settings: quarantine_delta_pct). */
export const DEFAULT_QUARANTINE_DELTA_PCT = 40;

/** Fallback: marge% onder deze drempel = alert (settings: margin_alert_threshold_pct). */
export const DEFAULT_MARGIN_ALERT_PCT = 10;
