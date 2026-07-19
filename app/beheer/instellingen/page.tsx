import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/supabase/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole(['admin']);
  const settings = await getSettings();
  const initial: Record<string, number> = {};
  for (const s of settings) {
    if (typeof s.value === 'number') initial[s.key] = s.value;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Instellingen</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drempels</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm initial={initial} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendit</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Veldmapping en verbinding testen worden toegevoegd zodra de Vendit REST-adapter (C2)
          gekoppeld is. Nu draait de sync op de mock-adapter.
        </CardContent>
      </Card>
    </main>
  );
}
