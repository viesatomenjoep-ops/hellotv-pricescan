'use client';

import { useEffect, useState } from 'react';

// Toont een duidelijke offline-melding: prijzen/marges/voorraad vereisen live data (E6).
export function OnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div className="bg-red-600 px-4 py-1 text-center text-sm font-medium text-white">
      Offline — prijzen, marges en voorraad vereisen een live verbinding.
    </div>
  );
}
