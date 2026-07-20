import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { SignOutButton } from './sign-out-button';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Beheer',
  sales: 'Verkoop',
  warehouse: 'Magazijn',
};

// App-header — helloTV huisstijl: inkt-zwarte balk, geel Baloo 2-woordmerk. Alleen als ingelogd.
export async function AppHeader() {
  // De Sales Tracker (/tracker) heeft z'n eigen shell — daar geen PriceScan-header tonen.
  const pathname = headers().get('x-pathname') ?? '';
  if (pathname.startsWith('/tracker')) return null;

  const user = await getSessionUser();
  if (!user) return null;

  const items: Array<{ href: string; label: string; roles: string[] }> = [
    { href: '/scan', label: 'Scan', roles: ['warehouse', 'sales', 'admin'] },
    { href: '/koppelen', label: 'Koppelen', roles: ['warehouse', 'admin'] },
    { href: '/catalogus', label: 'Catalogus', roles: ['warehouse', 'sales', 'admin'] },
    { href: '/prijzen', label: 'Prijzen', roles: ['sales', 'admin'] },
    { href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
    { href: '/beheer/quarantaine', label: 'Beheer', roles: ['admin'] },
  ];
  const nav = items.filter((n) => user.role && n.roles.includes(user.role));

  return (
    <header className="flex items-center justify-between gap-4 bg-foreground px-4 py-2 text-background">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/hellotv-logo-white.png"
            alt="helloTV"
            width={110}
            height={44}
            priority
            className="h-7 w-auto"
          />
          <span className="text-sm font-semibold opacity-90">PriceScan</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="opacity-80 hover:opacity-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-80">
          {user.fullName ?? user.email}
          {user.role && ` · ${ROLE_LABEL[user.role] ?? user.role}`}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
