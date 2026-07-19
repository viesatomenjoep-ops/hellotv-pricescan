import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  href,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  href?: string;
  tone?: 'default' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'danger' ? 'text-red-700' : tone === 'warn' ? 'text-orange-700' : 'text-foreground';
  const inner = (
    <Card className={cn(href && 'transition-colors hover:bg-muted/50')}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn('mt-1 text-2xl font-bold', toneClass)}>{value}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
