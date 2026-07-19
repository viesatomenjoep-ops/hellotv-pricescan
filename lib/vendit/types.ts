import type { VenditArticleRow } from '@/lib/schemas';

// Adapter-architectuur (C1). Elke Vendit-bron (mock of REST) implementeert dit contract.
// De adapter regelt zelf auth, paginatie en rate limiting; de sync-engine kent alleen deze rijen.

export type { VenditArticleRow };

export interface VenditAdapter {
  /** Streamt artikelen; met `since` optioneel alleen wijzigingen sinds dat moment. */
  fetchArticles(since?: Date): AsyncIterable<VenditArticleRow>;
}
