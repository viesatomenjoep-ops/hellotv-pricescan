import { requireRole } from '@/lib/auth';
import { getSettings } from '@/lib/supabase/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from './settings-form';
import { WeightsForm } from './weights-form';
import { VenditTest } from './vendit-test';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole(['admin']);
  const settings = await getSettings();
  const initial: Record<string, number> = {};
  let weights: Record<string, number> = {};
  for (const s of settings) {
    if (typeof s.value === 'number') initial[s.key] = s.value;
    if (s.key === 'alternatives_weights' && s.value && typeof s.value === 'object') {
      weights = s.value as Record<string, number>;
    }
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
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Zonder VENDIT_API_BASE_URL draait de sync op de mock-adapter. De veldmapping is
            configureerbaar via de settings-tabel (`vendit_mapping`).
          </p>
          <VenditTest />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alternatieven — score-gewichten</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightsForm initial={weights} />
        </CardContent>
      </Card>
    </main>
  );
}
