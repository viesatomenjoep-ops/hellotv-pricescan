import { KoppelWizard } from './koppel-wizard';

export default function KoppelenPage({ searchParams }: { searchParams: { epc?: string } }) {
  return <KoppelWizard initialEpc={searchParams.epc ?? null} />;
}
