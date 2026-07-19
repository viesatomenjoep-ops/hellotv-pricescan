import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { OnlineStatus } from '@/components/online-status';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'helloTV PriceScan',
  description: 'Interne scan-, prijs- en marge-app voor helloTV',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PriceScan', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#19445B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)}>
      <body className="font-sans antialiased">
        <OnlineStatus />
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
