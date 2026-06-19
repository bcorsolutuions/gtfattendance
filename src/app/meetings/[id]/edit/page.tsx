'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMeetings } from '@/lib/googleSheets';
import type { Meeting } from '@/lib/types';
import MeetingForm from '@/components/meetings/MeetingForm';

export default function EditMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    getMeetings().then((ms: Meeting[]) => {
      setMeeting(ms.find((m) => m.MeetingID === id) ?? null);
    });
  }, [id]);

  if (!meeting) return <p className="p-6 text-muted-foreground">Loading…</p>;
  return <MeetingForm meeting={meeting} />;
}
