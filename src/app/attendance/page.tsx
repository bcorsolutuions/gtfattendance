'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getMembers, getMeetings, getAttendance, saveAttendanceBatch } from '@/lib/googleSheets';
import type { Member, Meeting, Attendance, AttendanceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Save, Search, CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react';

type StatusMap = Record<string, AttendanceStatus>;

const STATUS_CONFIG = {
  Present: {
    label: 'Present',
    short: 'P',
    icon: CheckCircle2,
    active: 'bg-green-500 text-white border-green-500 shadow-sm',
    inactive: 'bg-background text-muted-foreground border-border hover:bg-green-50 hover:text-green-700 hover:border-green-300',
  },
  Absent: {
    label: 'Absent',
    short: 'A',
    icon: XCircle,
    active: 'bg-red-500 text-white border-red-500 shadow-sm',
    inactive: 'bg-background text-muted-foreground border-border hover:bg-red-50 hover:text-red-700 hover:border-red-300',
  },
  'Leave Informed': {
    label: 'Leave',
    short: 'L',
    icon: Clock,
    active: 'bg-yellow-400 text-yellow-900 border-yellow-400 shadow-sm',
    inactive: 'bg-background text-muted-foreground border-border hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300',
  },
} as const;

function AttendanceContent() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('meeting');

  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(preselected);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ms, mts] = await Promise.all([getMembers(), getMeetings()]);
        setMembers(ms.filter((m: Member) => m.Status === 'Active'));
        setMeetings(
          mts.sort((a: Meeting, b: Meeting) =>
            new Date(b.MeetingDate).getTime() - new Date(a.MeetingDate).getTime()
          )
        );
      } catch (e: unknown) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedMeeting) return;
    setStatusMap({});
    setAlreadySaved(false);
    getAttendance(selectedMeeting).then((att: Attendance[]) => {
      const map: StatusMap = {};
      att.forEach((a) => { map[a.MemberID] = a.Status; });
      setStatusMap(map);
      setAlreadySaved(att.length > 0);
    });
  }, [selectedMeeting]);

  function setStatus(memberID: string, status: AttendanceStatus) {
    setStatusMap((prev) => ({ ...prev, [memberID]: status }));
  }

  function markAll(status: AttendanceStatus) {
    const map: StatusMap = {};
    members.forEach((m) => { map[m.MemberID] = status; });
    setStatusMap(map);
  }

  async function handleSave() {
    if (!selectedMeeting) { toast.error('Select a meeting first'); return; }
    const unmarked = members.filter((m) => !statusMap[m.MemberID]);
    if (unmarked.length > 0) {
      const proceed = confirm(`${unmarked.length} member(s) not marked. They will be saved as Absent. Continue?`);
      if (!proceed) return;
    }
    const records = members.map((m) => ({
      MemberID: m.MemberID,
      Status: statusMap[m.MemberID] ?? 'Absent',
      Remarks: '',
    }));
    setSaving(true);
    try {
      await saveAttendanceBatch(selectedMeeting, records);
      toast.success('Attendance saved!');
      setAlreadySaved(true);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const filteredMembers = members.filter((m) =>
    m.FullName.toLowerCase().includes(search.toLowerCase()) ||
    m.Area.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    Present: Object.values(statusMap).filter((s) => s === 'Present').length,
    Absent: Object.values(statusMap).filter((s) => s === 'Absent').length,
    Leave: Object.values(statusMap).filter((s) => s === 'Leave Informed').length,
    Unmarked: members.length - Object.keys(statusMap).length,
  };

  const meeting = meetings.find((m) => m.MeetingID === selectedMeeting);
  const markedCount = members.length - counts.Unmarked;
  const progress = members.length > 0 ? Math.round((markedCount / members.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Attendance</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Mark attendance for a meeting</p>
      </div>

      {/* Meeting selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
            Select Meeting
          </label>
          <Select
            value={selectedMeeting}
            onValueChange={(v) => setSelectedMeeting(v ?? null)}
          >
            <SelectTrigger className="w-full h-11 text-sm">
              <SelectValue placeholder="Choose a meeting…" />
            </SelectTrigger>
            <SelectContent>
              {meetings.map((m) => (
                <SelectItem key={m.MeetingID} value={m.MeetingID}>
                  {format(new Date(m.MeetingDate), 'dd MMM yyyy')} — {m.Title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {meeting && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <MapPin size={11} /> {meeting.Venue}
              {alreadySaved && (
                <span className="ml-2 text-green-600 font-medium">✓ Already saved</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedMeeting && (
        <>
          {/* Progress + summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{markedCount} of {members.length} marked</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Present', count: counts.Present, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Absent', count: counts.Absent, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Leave', count: counts.Leave, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Pending', count: counts.Unmarked, color: 'text-gray-500', bg: 'bg-gray-50' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} className={`rounded-lg p-2 text-center ${bg}`}>
                  <p className={`text-lg font-bold leading-none ${color}`}>{count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mark-all buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Mark all:</span>
            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => markAll(s)}
                className="flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-muted"
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Member rows */}
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No members found</p>
            ) : (
              filteredMembers.map((member, idx) => {
                const current = statusMap[member.MemberID];
                return (
                  <div
                    key={member.MemberID}
                    className="flex items-center gap-3 bg-card border rounded-xl px-3 py-3 shadow-sm"
                  >
                    {/* Index + name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-muted-foreground shrink-0">{idx + 1}.</span>
                        <p className="font-medium text-sm leading-tight truncate">{member.FullName}</p>
                      </div>
                      {member.Area && (
                        <p className="text-xs text-muted-foreground ml-4 truncate">{member.Area}</p>
                      )}
                    </div>

                    {/* Status buttons — big touch targets */}
                    <div className="flex gap-1.5 shrink-0">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const Icon = cfg.icon;
                        const isActive = current === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(member.MemberID, s)}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 text-[10px] font-bold transition-all active:scale-95 ${
                              isActive ? cfg.active : cfg.inactive
                            }`}
                          >
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className="mt-0.5">{cfg.short}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Save button — sticky at bottom above nav */}
          {!loading && members.length > 0 && (
            <div className="sticky bottom-20 md:bottom-4 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 text-base gap-2 shadow-lg"
              >
                <Save size={18} />
                {saving ? 'Saving…' : alreadySaved ? 'Update Attendance' : 'Save Attendance'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading…</p>}>
      <AttendanceContent />
    </Suspense>
  );
}
