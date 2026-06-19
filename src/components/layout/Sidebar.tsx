'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, CalendarDays,
  ClipboardCheck, BarChart3, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GTFLogoIcon } from '@/components/GTFLogo';

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/members',    label: 'Members',     icon: Users },
  { href: '/meetings',   label: 'Meetings',    icon: CalendarDays },
  { href: '/attendance', label: 'Attendance',  icon: ClipboardCheck },
  { href: '/reports',    label: 'Reports',     icon: BarChart3 },
];

/* ── Desktop sidebar ─────────────────────────────────────────────── */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen shrink-0"
      style={{ background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)' }}>

      {/* Logo + name */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center">
          <GTFLogoIcon size={30} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Global Thikkodians</p>
          <p className="text-blue-200 text-xs">Forum</p>
        </div>
      </div>

      <Separator className="opacity-20" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <Separator className="opacity-20" />

      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => { logout(); router.push('/login'); }}
        >
          <LogOut size={16} className="mr-2" /> Logout
        </Button>
      </div>
    </aside>
  );
}

/* ── Mobile top header ───────────────────────────────────────────── */
export function MobileHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const current = NAV.find((n) => pathname.startsWith(n.href));

  return (
    <header
      className="md:hidden flex items-center justify-between px-4 py-2.5 sticky top-0 z-20 shadow-sm"
      style={{ background: 'linear-gradient(90deg, #0D47A1, #1565C0)' }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white rounded-lg p-0.5 shadow-sm shrink-0 flex items-center justify-center">
          <GTFLogoIcon size={26} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">GTF</p>
          <p className="text-blue-200 text-[10px] leading-tight">Global Thikkodians Forum</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {current && (
          <span className="text-blue-100 text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full">
            {current.label}
          </span>
        )}
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white"
          aria-label="Logout"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

/* ── Mobile bottom nav ───────────────────────────────────────────── */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-background border-t flex items-stretch h-16">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
