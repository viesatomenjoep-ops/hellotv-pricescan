import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { SignOutButton } from './sign-out-button';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Beheer',
  sales: 'Verkoop',
  warehouse: 'Magazijn',
};

// App-header met branding (navy #19445B, oranje accent #F26B21). Rendert alleen als ingelogd.
export async function AppHeader() {
  const user = await getSessionUser();
  if (!user) return null;

  const items: Array<{ href: string; label: string; roles: string[] }> = [
    { href: '/scan', label: 'Scan', roles: ['warehouse', 'sales', 'admin'] },
    { href: '/koppelen', label: 'Koppelen', roles: ['warehouse', 'admin'] },
    { href: '/prijzen', label: 'Prijzen', roles: ['sales', 'admin'] },
    { href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
    { href: '/beheer/quarantaine', label: 'Beheer', roles: ['admin'] },
  ];
  const nav = items.filter((n) => user.role && n.roles.includes(user.role));

  return (
    <header
      className="flex items-center justify-between gap-4 px-4 py-2 text-white"
      style={{ backgroundColor: '#19445B' }}
    >
      <div className="flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          helloTV <span style={{ color: '#F26B21' }}>PriceScan</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="opacity-90 hover:opacity-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-90">
          {user.fullName ?? user.email}
          {user.role && ` · ${ROLE_LABEL[user.role] ?? user.role}`}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
