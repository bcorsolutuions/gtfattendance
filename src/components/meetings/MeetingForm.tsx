'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { saveMeeting, updateMeeting } from '@/lib/googleSheets';
import { generateID } from '@/lib/idgen';
import type { Meeting } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Props {
  meeting?: Meeting;
}

export default function MeetingForm({ meeting }: Props) {
  const router = useRouter();
  const isEdit = !!meeting;

  const [form, setForm] = useState({
    MeetingDate: meeting?.MeetingDate
      ? format(new Date(meeting.MeetingDate), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    Title: meeting?.Title ?? '',
    Venue: meeting?.Venue ?? '',
    Notes: meeting?.Notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateMeeting({ ...meeting, ...form });
        toast.success('Meeting updated');
      } else {
        await saveMeeting({
          MeetingID: generateID('MTG'),
          ...form,
          CreatedAt: new Date().toISOString(),
        });
        toast.success('Meeting created');
      }
      router.push('/meetings');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/meetings">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Meeting' : 'New Meeting'}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? `Editing ${meeting.Title}` : 'Schedule a new meeting'}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="MeetingDate">Meeting Date *</Label>
              <Input
                id="MeetingDate"
                type="date"
                value={form.MeetingDate}
                onChange={(e) => set('MeetingDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Title">Meeting Title *</Label>
              <Input
                id="Title"
                value={form.Title}
                onChange={(e) => set('Title', e.target.value)}
                placeholder="e.g., Monthly General Meeting"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Venue">Venue</Label>
              <Input
                id="Venue"
                value={form.Venue}
                onChange={(e) => set('Venue', e.target.value)}
                placeholder="e.g., Community Hall, Block A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Notes">Notes</Label>
              <Textarea
                id="Notes"
                value={form.Notes}
                onChange={(e) => set('Notes', e.target.value)}
                placeholder="Agenda, announcements…"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 h-11">
                {saving ? 'Saving…' : isEdit ? 'Update Meeting' : 'Create Meeting'}
              </Button>
              <Link href="/meetings" className="flex-1">
                <Button variant="outline" type="button" className="w-full h-11">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
