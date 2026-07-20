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
  Users,
  Tv,
  Store,
  ListChecks,
  Calendar,
  Settings,
  Plug,
  Menu,
  X,
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
  const [menuOpen, setMenuOpen] = useState(false);
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

  const NavSections = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {sections.map((s) => (
        <div key={s.title} className="space-y-0.5">
          <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/70">
            {s.title}
          </p>
          {s.items.map((i) => {
            const Icon = i.icon;
            const actief = isActive(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={onNavigate}
                aria-current={actief ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  actief
                    ? 'bg-primary/[0.12] text-foreground'
                    : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >
                {actief && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
                )}
                {Icon && (
                  <Icon
                    className={cn('h-[18px] w-[18px] shrink-0', actief ? 'text-foreground' : 'text-muted-foreground')}
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
  );

  const UserFooter = () => (
    <div className="flex items-center gap-3 border-t px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-foreground">
        {userLabel.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight">{userLabel}</span>
        <span className="block truncate text-xs text-muted-foreground">{filiaal}</span>
      </span>
      <SignOutButton />
    </div>
  );

  const NotifList = () => (
    <>
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs font-semibold text-muted-foreground">Notificaties</span>
        {ongelezen > 0 && (
          <button onClick={markeerAlles} className="text-xs font-medium text-primary hover:underline">
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
            'block w-full rounded-lg p-2 text-left text-sm',
            !n.gelezen ? 'bg-muted/60 hover:bg-muted' : 'opacity-60',
          )}
        >
          <p className="leading-snug">{n.tekst}</p>
          <p className="mt-0.5 text-[11px] tracking-wide text-muted-foreground">
            {n.type}
            {!n.gelezen && ' · tik om te markeren'}
          </p>
        </button>
      ))}
    </>
  );

  return (
    <div className="app-canvas flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <Link href="/tracker" className="flex items-center gap-2 border-b px-4 py-4">
          <Image src="/hellotv-logo.png" alt="helloTV" width={120} height={51} priority className="h-7 w-auto" />
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold">Tracker</span>
        </Link>
        <NavSections />
        <UserFooter />
      </aside>

      {/* Mobiel: slide-in menu (hamburger) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="pt-safe elev-2 absolute inset-y-0 left-0 flex w-[78%] max-w-[280px] flex-col bg-background">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <Image src="/hellotv-logo.png" alt="helloTV" width={120} height={51} className="h-7 w-auto" />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Menu sluiten"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <NavSections onNavigate={() => setMenuOpen(false)} />
            <UserFooter />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="pt-safe sticky top-0 z-30 flex items-center gap-3 border-b bg-background/85 px-3 py-2 backdrop-blur md:px-4">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
            className="-ml-1 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-muted md:hidden"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          <Link href="/tracker" className="md:hidden">
            <Image src="/hellotv-logo.png" alt="helloTV" width={120} height={51} className="h-6 w-auto" />
          </Link>

          {/* Zoekbalk (desktop) */}
          <div className="hidden md:block md:w-full md:max-w-md">
            <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 focus-within:ring-2 focus-within:ring-ring">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <input
                placeholder="Zoek op typenummer, model of EAN…"
                aria-label="Zoeken"
                className="h-9 w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {notifAan && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Notificaties"
                >
                  <Bell className="h-5 w-5" strokeWidth={1.75} />
                  {ongelezen > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {ongelezen}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border bg-background p-2 elev-2">
                    <NotifList />
                  </div>
                )}
              </div>
            )}
            <span className="ml-1 hidden text-right md:block">
              <span className="block text-sm font-medium leading-tight">{userLabel}</span>
              <span className="block text-xs text-muted-foreground">{filiaal}</span>
            </span>
          </div>
        </header>

        <main className="pb-nav flex-1 overflow-y-auto md:pb-0">{children}</main>
      </div>

      {/* Bottom-nav (mobiel) */}
      <nav className="pb-safe elev-nav fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t bg-background md:hidden">
        {BOTTOM.map((i) => {
          const center = i.label === 'Scan';
          const meer = i.label === 'Meer';
          const Icon = i.icon;
          const actief = !meer && isActive(i.href);
          const inner = (
            <>
              <span
                className={cn(
                  'flex items-center justify-center rounded-xl transition-colors',
                  center
                    ? 'elev-1 h-11 w-11 bg-primary text-primary-foreground'
                    : actief
                      ? 'h-8 w-11 bg-primary/[0.12] text-foreground'
                      : 'h-8 w-11 text-muted-foreground',
                )}
              >
                {Icon && (
                  <Icon className={center ? 'h-6 w-6' : 'h-[22px] w-[22px]'} strokeWidth={center ? 2 : 1.75} />
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  actief || center ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {i.label}
              </span>
            </>
          );
          const cls = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 pt-1.5';
          return meer ? (
            <button key={i.href} type="button" onClick={() => setMenuOpen(true)} className={cls} aria-label="Meer">
              {inner}
            </button>
          ) : (
            <Link key={i.href} href={i.href} aria-current={actief ? 'page' : undefined} className={cls}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
