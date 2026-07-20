import { getAgenda } from '@/lib/tracker/queries';
import { getFlags } from '@/lib/tracker/flags';
import { AgendaClient } from './agenda-client';
import { Placeholder } from '@/components/tracker/placeholder';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const flags = await getFlags();
  if (!flags['agenda']?.enabled) {
    return (
      <Placeholder
        title="Agenda"
        note="Deze module staat uit. Zet 'agenda' aan bij Meer → Instellingen."
      />
    );
  }
  const items = await getAgenda();
  return <AgendaClient items={items} />;
}
