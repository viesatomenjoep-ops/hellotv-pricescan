import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUnmatchedModels, type Model } from '@/lib/supabase/queries';

// Leest live uit Supabase (rol-gated) — nooit statisch prerenderen.
export const dynamic = 'force-dynamic';

export default async function UnmatchedPage() {
  let models: Model[] = [];
  let error: string | null = null;
  try {
    models = await getUnmatchedModels();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Kon ongematchte modellen niet laden';
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
        2025/2026-modellen zonder gekoppeld Vendit-artikel. Alleen zichtbaar voor beheer.
      </p>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!error && models.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Alles gematcht. 🎉
          </CardContent>
        </Card>
      )}

      {models.map((m) => (
        <Card key={m.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{m.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.brand} · {m.model_code}
                {m.ean ? ` · EAN ${m.ean}` : ''}
              </p>
            </div>
            <Badge variant="outline">{m.model_year}</Badge>
          </CardHeader>
        </Card>
      ))}
    </main>
  );
}
