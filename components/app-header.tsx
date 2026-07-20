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
    <header className="flex items-center justify-between gap-3 bg-foreground px-3 py-2 text-background sm:px-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/hellotv-logo-white.png"
            alt="helloTV"
            width={110}
            height={44}
            priority
            className="h-7 w-auto"
          />
          <span className="hidden text-sm font-semibold opacity-90 sm:inline">PriceScan</span>
        </Link>
        <nav className="flex gap-4 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 whitespace-nowrap py-1 opacity-80 hover:opacity-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <span className="hidden opacity-80 sm:inline">
          {user.fullName ?? user.email}
          {user.role && ` · ${ROLE_LABEL[user.role] ?? user.role}`}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
