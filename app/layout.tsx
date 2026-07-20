import type { Metadata, Viewport } from 'next';
import { Baloo_2, Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { OnlineStatus } from '@/components/online-status';

// helloTV design system: Baloo 2 (alleen logo), Bricolage Grotesque (koppen),
// Plus Jakarta Sans (body/UI).
const logo = Baloo_2({ subsets: ['latin'], weight: ['800'], variable: '--font-logo' });
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});
const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'helloTV PriceScan',
  description: 'Interne scan-, prijs- en marge-app voor helloTV',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PriceScan', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // laat content tot achter de notch/home-indicator lopen
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={cn(logo.variable, display.variable, body.variable)}>
      <body className="font-sans antialiased">
        <OnlineStatus />
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
