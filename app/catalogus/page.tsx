import { getSessionUser, canSeeMargin } from '@/lib/auth';
import { getCatalog } from '@/lib/supabase/catalog';
import { CatalogTable } from './catalog-table';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const user = await getSessionUser();
  const rows = await getCatalog();

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Catalogus</h1>
      <CatalogTable rows={rows} showMargin={canSeeMargin(user?.role ?? null)} />
    </main>
  );
}
