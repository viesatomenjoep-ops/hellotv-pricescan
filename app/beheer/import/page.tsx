import { requireRole } from '@/lib/auth';
import { ImportForm } from './import-form';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  await requireRole(['admin']);
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Modellen importeren</h1>
      <p className="text-sm text-muted-foreground">
        Upload een CSV met de 2025/2026-modellen. Eerst een dry-run preview, daarna bevestigen
        (upsert op EAN, anders merk + modelnummer).
      </p>
      <ImportForm />
    </main>
  );
}
