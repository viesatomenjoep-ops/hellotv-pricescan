'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/sign-out-button';
import { useFlag } from './flags-provider';

interface Notificatie {
  id: string;
  type: string;
  tekst: string;
  gelezen: boolean;
}

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
      { href: '/tracker/verkopers', label: 'Verkopers' },
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
  {
    title: 'Beheer',
    items: [
      { href: '/tracker/overig', label: 'Overig' },
      { href: '/tracker/koppelingen', label: 'Koppelingen', flag: 'overig.koppelingen' },
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
  const koppelingen = useFlag('overig.koppelingen');
  const flagAan: Record<string, boolean> = {
    agenda,
    'overig.koppelingen': koppelingen,
  };
  return SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.flag || flagAan[i.flag]),
  })).filter((s) => s.items.length > 0);
}

export function TrackerShell({
  userLabel,
  filiaal,
  notificaties,
  children,
}: {
  userLabel: string;
  filiaal: string;
  notificaties: Notificatie[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const sections = useVisibleSections();
  const notifAan = useFlag('notificaties');
  const [notifOpen, setNotifOpen] = useState(false);
  const ongelezen = notificaties.filter((n) => !n.gelezen).length;
  const isActive = (href: string) =>
    href === '/tracker' ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <Link href="/tracker" className="block px-4 py-4">
          <Image
            src="/hellotv-logo.png"
            alt="helloTV"
            width={120}
            height={51}
            priority
            className="h-7 w-auto"
          />
          <span className="mt-1 block text-xs font-medium text-muted-foreground">
            Sales Tracker
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
            {notifAan && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Notificaties"
                >
                  <span className="text-lg">🔔</span>
                  {ongelezen > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {ongelezen}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border bg-background p-2 shadow-lg">
                    {notificaties.length === 0 && (
                      <p className="p-2 text-sm text-muted-foreground">Geen notificaties.</p>
                    )}
                    {notificaties.map((n) => (
                      <div
                        key={n.id}
                        className={cn('rounded-md p-2 text-sm', !n.gelezen && 'bg-muted/60')}
                      >
                        <p>{n.tekst}</p>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {n.type}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                'flex min-h-12 min-w-[52px] flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-[11px] font-medium',
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
