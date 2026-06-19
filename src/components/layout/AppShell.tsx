'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { DesktopSidebar, MobileHeader, MobileBottomNav } from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [authenticated, pathname, router]);

  if (pathname === '/login') return <>{children}</>;
  if (!authenticated) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-auto pb-20 md:pb-6">
          <div className="max-w-2xl md:max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
