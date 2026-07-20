'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import {
  House,
  Boxes,
  ScanLine,
  Lightbulb,
  Ellipsis,
  Bell,
  LayoutDashboard,
  Search,
  TrendingUp,
  Users,
  Tv,
  Store,
  ListChecks,
  Calendar,
  Settings,
  Plug,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/sign-out-button';
import { useFlag } from './flags-provider';
import { markeerGelezenAction, markeerAllesGelezenAction } from '@/app/tracker/notificatie-actions';

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
  icon?: LucideIcon;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Overzicht',
    items: [
      { href: '/tracker', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/tracker/zoeken', label: 'Zoeken', icon: Search },
    ],
  },
  {
    title: 'Verkoop',
    items: [
      { href: '/tracker/scan', label: 'Scan toestel', icon: ScanLine },
      { href: '/tracker/aanbevelingen', label: 'Aanbevelingen', icon: Lightbulb },
      { href: '/tracker/verkopen', label: 'Verkopen', icon: TrendingUp },
      { href: '/tracker/verkopers', label: 'Verkopers', icon: Users },
    ],
  },
  {
    title: 'Voorraad',
    items: [
      { href: '/tracker/voorraad', label: 'Voorraad', icon: Boxes },
      { href: '/tracker/toestellen', label: 'Toestellen', icon: Tv },
      { href: '/tracker/filialen', label: 'Filialen', icon: Store },
    ],
  },
  {
    title: 'Planning',
    items: [
      { href: '/tracker/taken', label: 'Taken', icon: ListChecks },
      { href: '/tracker/agenda', label: 'Agenda', flag: 'agenda', icon: Calendar },
    ],
  },
  {
    title: 'Beheer',
    items: [
      { href: '/tracker/overig', label: 'Overig', icon: Settings },
      { href: '/tracker/koppelingen', label: 'Koppelingen', flag: 'overig.koppelingen', icon: Plug },
    ],
  },
];

const BOTTOM: NavItem[] = [
  { href: '/tracker', label: 'Home', icon: House },
  { href: '/tracker/voorraad', label: 'Voorraad', icon: Boxes },
  { href: '/tracker/scan', label: 'Scan', icon: ScanLine },
  { href: '/tracker/aanbevelingen', label: 'Tips', icon: Lightbulb },
  { href: '/tracker/overig', label: 'Meer', icon: Ellipsis },
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
  const router = useRouter();
  const sections = useVisibleSections();
  const notifAan = useFlag('notificaties');
  const [notifOpen, setNotifOpen] = useState(false);
  const [, startNotif] = useTransition();
  const ongelezen = notificaties.filter((n) => !n.gelezen).length;

  function markeerGelezen(id: string) {
    startNotif(async () => {
      await markeerGelezenAction(id);
      router.refresh();
    });
  }
  function markeerAlles() {
    startNotif(async () => {
      await markeerAllesGelezenAction();
      router.refresh();
    });
  }
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
              {s.items.map((i) => {
                const Icon = i.icon;
                const actief = isActive(i.href);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    aria-current={actief ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
                      actief ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {actief && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    {Icon && (
                      <Icon
                        className={cn('h-4 w-4 shrink-0', actief ? 'text-foreground' : 'text-muted-foreground')}
                        strokeWidth={1.75}
                      />
                    )}
                    {i.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-2">
          <input
            placeholder="Zoek op typenummer, model of EAN…"
            aria-label="Zoeken"
            className="h-10 w-full max-w-md rounded-full border bg-muted/50 px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring md:h-9 md:text-sm"
          />
          <div className="flex items-center gap-3">
            {notifAan && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Notificaties"
                >
                  <Bell className="h-5 w-5" strokeWidth={1.75} />
                  {ongelezen > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {ongelezen}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border bg-background p-2 shadow-lg">
                    <div className="flex items-center justify-between px-1 pb-1">
                      <span className="text-xs font-semibold text-muted-foreground">Notificaties</span>
                      {ongelezen > 0 && (
                        <button
                          onClick={markeerAlles}
                          className="text-xs text-primary hover:underline"
                        >
                          Alles gelezen
                        </button>
                      )}
                    </div>
                    {notificaties.length === 0 && (
                      <p className="p-2 text-sm text-muted-foreground">Geen notificaties.</p>
                    )}
                    {notificaties.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => !n.gelezen && markeerGelezen(n.id)}
                        className={cn(
                          'block w-full rounded-md p-2 text-left text-sm',
                          !n.gelezen ? 'bg-muted/60 hover:bg-muted' : 'opacity-60',
                        )}
                      >
                        <p>{n.tekst}</p>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {n.type}
                          {!n.gelezen && ' · tik om te markeren'}
                        </p>
                      </button>
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

        <main className="pb-nav flex-1 overflow-y-auto md:pb-0">{children}</main>
      </div>

      {/* Bottom-nav (mobiel) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background py-1 md:hidden">
        {BOTTOM.map((i) => {
          const center = i.label === 'Scan';
          const Icon = i.icon;
          const actief = isActive(i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={actief ? 'page' : undefined}
              className={cn(
                'flex min-h-12 min-w-[52px] flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-[11px] font-medium',
                center && '-mt-6',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full transition-colors',
                  center
                    ? 'h-12 w-12 bg-primary text-primary-foreground shadow-lg'
                    : actief
                      ? 'h-9 w-9 bg-primary/15 text-foreground'
                      : 'h-9 w-9 text-muted-foreground',
                )}
              >
                {Icon && (
                  <Icon className={center ? 'h-6 w-6' : 'h-5 w-5'} strokeWidth={center ? 2 : 1.75} />
                )}
              </span>
              <span className={cn(actief && !center ? 'font-semibold text-foreground' : '')}>
                {i.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
