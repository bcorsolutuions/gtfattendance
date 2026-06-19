'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { saveMember, updateMember } from '@/lib/googleSheets';
import { generateID } from '@/lib/idgen';
import type { Member } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  member?: Member;
}

export default function MemberForm({ member }: Props) {
  const router = useRouter();
  const isEdit = !!member;

  const [form, setForm] = useState({
    FullName: member?.FullName ?? '',
    Mobile: member?.Mobile ?? '',
    Area: member?.Area ?? '',
    Status: member?.Status ?? 'Active',
    Remarks: member?.Remarks ?? '',
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
        await updateMember({ ...member, ...form });
        toast.success('Member updated successfully');
      } else {
        await saveMember({
          MemberID: generateID('MBR'),
          ...form,
          CreatedAt: new Date().toISOString(),
        });
        toast.success('Member added successfully');
      }
      router.push('/members');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/members">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Member' : 'Add Member'}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? `Editing ${member.FullName}` : 'Register a new forum member'}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="FullName">Full Name *</Label>
              <Input
                id="FullName"
                value={form.FullName}
                onChange={(e) => set('FullName', e.target.value)}
                placeholder="Enter full name"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Mobile">Mobile Number</Label>
              <Input
                id="Mobile"
                value={form.Mobile}
                onChange={(e) => set('Mobile', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Area">Area / Unit</Label>
              <Input
                id="Area"
                value={form.Area}
                onChange={(e) => set('Area', e.target.value)}
                placeholder="e.g., North Zone, Unit 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.Status} onValueChange={(v) => v && set('Status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="Remarks">Remarks</Label>
              <Textarea
                id="Remarks"
                value={form.Remarks}
                onChange={(e) => set('Remarks', e.target.value)}
                placeholder="Any additional notes…"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1 h-11">
                {saving ? 'Saving…' : isEdit ? 'Update Member' : 'Add Member'}
              </Button>
              <Link href="/members" className="flex-1">
                <Button variant="outline" type="button" className="w-full h-11">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
