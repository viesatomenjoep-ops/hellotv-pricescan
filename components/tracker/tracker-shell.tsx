'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/sign-out-button';
import { useFlag } from './flags-provider';

interface NavItem {
  href: string;
  label: string;
  flag?: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Overzicht',
    items: [
      { href: '/tracker', label: 'Dashboard' },
      { href: '/tracker/zoeken', label: 'Zoeken' },
    ],
  },
  {
    title: 'Verkoop',
    items: [
      { href: '/tracker/scan', label: 'Scan toestel' },
      { href: '/tracker/aanbevelingen', label: 'Aanbevelingen' },
      { href: '/tracker/verkopen', label: 'Verkopen' },
    ],
  },
  {
    title: 'Voorraad',
    items: [
      { href: '/tracker/voorraad', label: 'Voorraad' },
      { href: '/tracker/toestellen', label: 'Toestellen' },
      { href: '/tracker/filialen', label: 'Filialen' },
    ],
  },
  {
    title: 'Planning',
    items: [
      { href: '/tracker/taken', label: 'Taken' },
      { href: '/tracker/agenda', label: 'Agenda', flag: 'agenda' },
    ],
  },
];

const BOTTOM: NavItem[] = [
  { href: '/tracker', label: 'Home' },
  { href: '/tracker/voorraad', label: 'Voorraad' },
  { href: '/tracker/scan', label: 'Scan' },
  { href: '/tracker/aanbevelingen', label: 'Tips' },
  { href: '/tracker/overig', label: 'Meer' },
];

function useVisibleSections(): NavSection[] {
  const agenda = useFlag('agenda');
  return SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.flag || (i.flag === 'agenda' ? agenda : true)),
  })).filter((s) => s.items.length > 0);
}

export function TrackerShell({
  userLabel,
  filiaal,
  children,
}: {
  userLabel: string;
  filiaal: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sections = useVisibleSections();
  const isActive = (href: string) =>
    href === '/tracker' ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <Link href="/tracker" className="flex items-center gap-2 px-4 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-logo text-sm font-extrabold text-primary-foreground">
            tv
          </span>
          <span className="font-logo text-base font-extrabold leading-none">
            Hello<span className="text-primary">TV</span>
            <span className="block font-sans text-xs font-medium text-muted-foreground">
              Sales Tracker
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2">
          {sections.map((s) => (
            <div key={s.title}>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {s.title}
              </p>
              {s.items.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium',
                    isActive(i.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  {i.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-2">
          <input
            placeholder="Zoek op typenummer, model of EAN…"
            className="h-9 w-full max-w-md rounded-full border bg-muted/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm sm:block">
              <span className="font-medium">{userLabel}</span>
              <span className="block text-xs text-muted-foreground">{filiaal}</span>
            </span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* Bottom-nav (mobiel) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background py-1 md:hidden">
        {BOTTOM.map((i) => {
          const center = i.label === 'Scan';
          return (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium',
                center && '-mt-6',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full',
                  center
                    ? 'h-12 w-12 bg-primary text-primary-foreground shadow-lg'
                    : isActive(i.href)
                      ? 'text-primary'
                      : 'text-muted-foreground',
                )}
              >
                {center ? '⌾' : ''}
              </span>
              <span className={cn(isActive(i.href) && !center && 'text-foreground')}>
                {i.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
