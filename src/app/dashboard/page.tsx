'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, ClipboardCheck, TrendingUp, ChevronRight } from 'lucide-react';
import { getMembers, getMeetings, getAttendance } from '@/lib/googleSheets';
import type { Member, Meeting, Attendance } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [noConfig, setNoConfig] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
      setNoConfig(true);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const [m, mt, att] = await Promise.all([getMembers(), getMeetings(), getAttendance()]);
        setMembers(m);
        setMeetings(mt);
        setAttendance(att);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeMembers = members.filter((m) => m.Status === 'Active').length;
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(b.MeetingDate).getTime() - new Date(a.MeetingDate).getTime()
  );
  const latestMeeting = sortedMeetings[0];
  const lastAttendance = latestMeeting
    ? attendance.filter((a) => a.MeetingID === latestMeeting.MeetingID)
    : [];
  const presentCount = lastAttendance.filter((a) => a.Status === 'Present').length;
  const attendanceRate = lastAttendance.length
    ? Math.round((presentCount / lastAttendance.length) * 100)
    : null;

  const stats = [
    { label: 'Active Members',  value: activeMembers, icon: Users,         color: 'text-blue-800',  bg: 'bg-blue-50',  href: '/members' },
    { label: 'Total Meetings',  value: meetings.length, icon: CalendarDays, color: 'text-blue-700',  bg: 'bg-blue-50',  href: '/meetings' },
    { label: 'Last Present',    value: presentCount,  icon: ClipboardCheck, color: 'text-green-700', bg: 'bg-green-50', href: '/attendance' },
    { label: 'Attendance Rate', value: attendanceRate !== null ? `${attendanceRate}%` : '—', icon: TrendingUp, color: 'text-green-800', bg: 'bg-green-50', href: '/reports' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-xs">Welcome back, Admin</p>
      </div>

      {noConfig && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-800">⚠️ Google Sheets not connected</p>
          <p className="text-xs text-yellow-700 mt-1">
            Set <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_APPS_SCRIPT_URL</code> in{' '}
            <code className="bg-yellow-100 px-1 rounded">.env.local</code> — see{' '}
            <code className="bg-yellow-100 px-1 rounded">SETUP.md</code>
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="border shadow-sm active:scale-[0.98] transition-transform">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>
                      {loading ? '…' : value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</p>
        <div className="space-y-2">
          {[
            { href: '/attendance',  label: 'Mark Attendance', desc: 'Record today\'s meeting attendance', icon: ClipboardCheck, color: 'bg-primary' },
            { href: '/members/new', label: 'Add New Member',  desc: 'Register a new forum member',        icon: Users,          color: 'bg-blue-700' },
            { href: '/meetings/new',label: 'Create Meeting',  desc: 'Schedule a new meeting',              icon: CalendarDays,   color: 'bg-blue-900' },
            { href: '/reports',     label: 'View Reports',    desc: 'Attendance analytics & summaries',    icon: TrendingUp,     color: 'bg-green-700' },
          ].map(({ href, label, desc, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-3.5 bg-card border rounded-xl hover:bg-muted active:scale-[0.98] transition-all shadow-sm"
            >
              <div className={`p-2.5 rounded-xl ${color} text-white shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent meetings */}
      {sortedMeetings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Meetings</p>
            <Link href="/meetings" className="text-xs text-primary">View all</Link>
          </div>
          <div className="space-y-2">
            {sortedMeetings.slice(0, 3).map((m) => (
              <Link
                key={m.MeetingID}
                href={`/attendance?meeting=${m.MeetingID}`}
                className="flex items-center gap-3 p-3 bg-card border rounded-xl active:scale-[0.98] transition-transform shadow-sm"
              >
                <div className="text-center bg-primary/10 rounded-lg px-2.5 py-1.5 shrink-0">
                  <p className="text-xs font-bold text-primary leading-none">
                    {format(new Date(m.MeetingDate), 'dd')}
                  </p>
                  <p className="text-[9px] text-primary/70 uppercase">
                    {format(new Date(m.MeetingDate), 'MMM')}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{m.Title}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.Venue || 'No venue'}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">Attend</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Users(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, ...rest } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
