import { getFilialenOverzicht } from '@/lib/tracker/queries';
import { FilialenView } from './filialen-view';

export const dynamic = 'force-dynamic';

export default async function FilialenPage() {
  const filialen = await getFilialenOverzicht();
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <FilialenView filialen={filialen} />
    </div>
  );
}
