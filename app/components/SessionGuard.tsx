'use client';

import { useAutoLogout } from "@/app/hooks/useAutoLogout";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  useAutoLogout();
  return <>{children}</>;
}
