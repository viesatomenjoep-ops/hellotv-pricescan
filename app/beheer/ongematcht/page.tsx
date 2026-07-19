import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUnmatchedProducts, type ProductListItem } from '@/lib/supabase/queries';

// Leest live uit Supabase (rol-gated) — nooit statisch prerenderen.
export const dynamic = 'force-dynamic';

export default async function UnmatchedPage() {
  let products: ProductListItem[] = [];
  let error: string | null = null;
  try {
    products = await getUnmatchedProducts();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Kon ongematchte producten niet laden';
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ongematchte modellen</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        2025/2026-modellen zonder gekoppeld Vendit-artikel. Voorloper van de matching-review (D4).
      </p>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!error && products.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Alles gematcht. 🎉
          </CardContent>
        </Card>
      )}

      {products.map((p) => (
        <Card key={p.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{p.model_name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.brand} · {p.model_number}
                {p.ean ? ` · EAN ${p.ean}` : ''}
              </p>
            </div>
            <Badge variant="outline">{p.model_year}</Badge>
          </CardHeader>
        </Card>
      ))}
    </main>
  );
}
