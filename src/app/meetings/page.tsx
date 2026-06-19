'use client';

import { useEffect, useState } from 'react';
import { getMeetings, deleteMeeting } from '@/lib/googleSheets';
import type { Meeting } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, ClipboardCheck, MapPin, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getMeetings();
      setMeetings(
        data.sort((a: Meeting, b: Meeting) =>
          new Date(b.MeetingDate).getTime() - new Date(a.MeetingDate).getTime()
        )
      );
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = meetings.filter((m) =>
    m.Title.toLowerCase().includes(search.toLowerCase()) ||
    m.Venue.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(m: Meeting) {
    if (!confirm(`Delete "${m.Title}"?`)) return;
    try {
      await deleteMeeting(m.MeetingID);
      toast.success('Meeting deleted');
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Meetings</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{meetings.length} total</p>
        </div>
        <Link href="/meetings/new">
          <Button size="sm" className="gap-1.5 h-9">
            <Plus size={15} /> New
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title or venue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Meeting cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="mx-auto mb-2 opacity-30" size={36} />
          <p className="text-sm">No meetings found</p>
          <Link href="/meetings/new" className="text-primary text-sm hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <Card key={m.MeetingID} className="shadow-sm border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Date pill */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {format(new Date(m.MeetingDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <p className="font-semibold text-sm leading-tight">{m.Title}</p>
                    {m.Venue && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin size={11} /> {m.Venue}
                      </span>
                    )}
                    {m.Notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.Notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => router.push(`/attendance?meeting=${m.MeetingID}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                    >
                      <ClipboardCheck size={13} /> Attendance
                    </button>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => router.push(`/meetings/${m.MeetingID}/edit`)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center pb-1">{filtered.length} meetings</p>
    </div>
  );
}
