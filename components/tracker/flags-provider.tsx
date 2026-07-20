'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FlagMap } from '@/lib/tracker/flags';

const FlagsContext = createContext<{ flags: FlagMap; rol: string }>({ flags: {}, rol: 'verkoper' });

export function FlagsProvider({
  flags,
  rol,
  children,
}: {
  flags: FlagMap;
  rol: string;
  children: ReactNode;
}) {
  return <FlagsContext.Provider value={{ flags, rol }}>{children}</FlagsContext.Provider>;
}

/** True als de vlag aan staat én (indien rol_scope) de rol overeenkomt. */
export function useFlag(key: string): boolean {
  const { flags, rol } = useContext(FlagsContext);
  const f = flags[key];
  if (!f || !f.enabled) return false;
  if (f.rolScope && f.rolScope !== rol) return false;
  return true;
}

export function useRol(): string {
  return useContext(FlagsContext).rol;
}
