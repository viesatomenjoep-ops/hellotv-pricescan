import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const links = [
  { href: '/scan', title: 'Scannen', desc: 'Scan een tv en zie prijs, marge en voorraad.' },
  {
    href: '/beheer/ongematcht',
    title: 'Ongematchte modellen',
    desc: '2025/2026-modellen zonder Vendit-artikel (beheer).',
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">helloTV PriceScan</h1>
        <p className="text-muted-foreground">Intern — scan, prijs, marge en alternatieven.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{l.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{l.desc}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
