import { z } from 'zod';
import type { VenditAdapter, VenditArticleRow } from './types';
import {
  DEFAULT_MAPPING,
  normalizeEan,
  normalizePriceToCents,
  type PriceUnit,
  type VenditFieldMapping,
} from './normalize';

// Zod op de grens: valideer de vorm van de Vendit-page-response voordat we mappen.
const venditRowSchema = z.record(z.string(), z.unknown());
const venditPageSchema = z.union([
  z.array(venditRowSchema),
  z.object({ items: z.array(venditRowSchema) }),
]);

// Vendit REST-adapter (C2). Structuur staat; endpoints/auth worden bevestigd zodra de Vendit
// API-documentatie binnen is. Auth-stijl, veldmapping en prijs-unit zijn configureerbaar
// (geen codewijziging nodig als Vendit-veldnamen afwijken).

export type AuthStyle = 'bearer' | 'header' | 'basic';

export interface VenditRestConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  authStyle: AuthStyle;
  mapping: VenditFieldMapping;
  priceUnit: PriceUnit;
  articlesPath: string;
  pageSize: number;
  maxRequestsPerSecond: number;
}

export function configFromEnv(overrides: Partial<VenditRestConfig> = {}): VenditRestConfig {
  return {
    baseUrl: process.env.VENDIT_API_BASE_URL ?? '',
    apiKey: process.env.VENDIT_API_KEY ?? '',
    apiSecret: process.env.VENDIT_API_SECRET ?? '',
    authStyle: 'bearer',
    mapping: DEFAULT_MAPPING,
    priceUnit: 'auto',
    articlesPath: '/articles',
    pageSize: 100,
    maxRequestsPerSecond: 5,
    ...overrides,
  };
}

function authHeaders(cfg: VenditRestConfig): Record<string, string> {
  switch (cfg.authStyle) {
    case 'bearer':
      return { Authorization: `Bearer ${cfg.apiKey}` };
    case 'header':
      return { 'X-Api-Key': cfg.apiKey, 'X-Api-Secret': cfg.apiSecret };
    case 'basic':
      return { Authorization: `Basic ${btoa(`${cfg.apiKey}:${cfg.apiSecret}`)}` };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Eén rauwe rij -> genormaliseerde VenditArticleRow. eanInvalid telt ongeldige EANs. */
export function mapRow(
  raw: Record<string, unknown>,
  cfg: VenditRestConfig,
  counters: { eanInvalid: number; priceAmbiguous: number },
): VenditArticleRow {
  const m = cfg.mapping;
  const rawEan = raw[m.ean] as string | undefined;
  const ean = normalizeEan(rawEan);
  if (rawEan && !ean) counters.eanInvalid += 1;

  const purchase = normalizePriceToCents(raw[m.purchasePrice] as string | number, cfg.priceUnit);
  const sale = normalizePriceToCents(raw[m.salePrice] as string | number, cfg.priceUnit);
  if (purchase.ambiguous || sale.ambiguous) counters.priceAmbiguous += 1;

  const stockField = raw[m.stock];
  const stockRaw: Array<Record<string, unknown>> = Array.isArray(stockField) ? stockField : [];

  return {
    venditArticleId: String(raw[m.articleId] ?? ''),
    ean: ean ?? undefined,
    sku: (raw[m.sku] as string) ?? undefined,
    description: String(raw[m.description] ?? ''),
    purchasePriceCents: purchase.cents,
    salePriceCents: sale.cents,
    salePriceIncludesVat: raw[m.vatIncluded] !== false,
    stock: stockRaw.map((s) => ({
      locationCode: String(s.locationCode ?? s.code ?? ''),
      locationName: (s.locationName as string) ?? undefined,
      qty: Number(s.qty ?? s.quantity ?? 0),
    })),
    status: String(raw['status'] ?? 'active'),
    sourceTimestamp: String(raw[m.changedAt] ?? new Date(0).toISOString()),
  };
}

export class VenditRestAdapter implements VenditAdapter {
  readonly counters = { eanInvalid: 0, priceAmbiguous: 0 };
  private minInterval: number;

  constructor(private cfg: VenditRestConfig) {
    if (!cfg.baseUrl) throw new Error('VENDIT_API_BASE_URL ontbreekt');
    this.minInterval = 1000 / cfg.maxRequestsPerSecond;
  }

  private async fetchPage(page: number, since?: Date): Promise<Record<string, unknown>[]> {
    const url = new URL(this.cfg.articlesPath, this.cfg.baseUrl);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(this.cfg.pageSize));
    if (since) url.searchParams.set('modifiedSince', since.toISOString());

    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...authHeaders(this.cfg) },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.min(1000 * 2 ** attempt, 8000)); // exponential backoff
        continue;
      }
      if (!res.ok) throw new Error(`Vendit ${res.status}: ${await res.text()}`);
      const parsed = venditPageSchema.parse(await res.json());
      return Array.isArray(parsed) ? parsed : parsed.items;
    }
    throw new Error('Vendit: te veel herhaalde fouten (429/5xx)');
  }

  async *fetchArticles(since?: Date): AsyncIterable<VenditArticleRow> {
    // Vendit ondersteunt mogelijk geen "gewijzigd-sinds"; dan valt de sync-engine terug op
    // full sync + lokale delta-detectie (die kan het systeem al aan).
    let page = 1;
    let last = Date.now();
    for (;;) {
      const wait = this.minInterval - (Date.now() - last);
      if (wait > 0) await sleep(wait);
      last = Date.now();

      const rows = await this.fetchPage(page, since);
      if (rows.length === 0) break;
      for (const raw of rows) yield mapRow(raw, this.cfg, this.counters);
      if (rows.length < this.cfg.pageSize) break;
      page += 1;
    }
  }
}
