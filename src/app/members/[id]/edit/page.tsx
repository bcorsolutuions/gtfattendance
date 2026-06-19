'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMembers } from '@/lib/googleSheets';
import type { Member } from '@/lib/types';
import MemberForm from '@/components/members/MemberForm';

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    getMembers().then((ms: Member[]) => {
      setMember(ms.find((m) => m.MemberID === id) ?? null);
    });
  }, [id]);

  if (!member) return <p className="p-6 text-muted-foreground">Loading…</p>;
  return <MemberForm member={member} />;
}
