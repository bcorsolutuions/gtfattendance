'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import { ArrowLeft, Camera, X, User } from 'lucide-react';
import Link from 'next/link';

interface Props {
  member?: Member;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const SIZE = 120; // small thumbnail to stay well under Sheets 50k char limit
        const ratio = Math.min(SIZE / img.width, SIZE / img.height);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        console.log('Photo size (chars):', dataUrl.length);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MemberForm({ member }: Props) {
  const router = useRouter();
  const isEdit = !!member;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    FullName: member?.FullName ?? '',
    Mobile: member?.Mobile ?? '',
    Area: member?.Area ?? '',
    Status: member?.Status ?? 'Active',
    Remarks: member?.Remarks ?? '',
  });
  const [photo, setPhoto] = useState<string>(member?.Photo ?? '');
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
    } catch {
      toast.error('Failed to process image');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Strip "data:image/jpeg;base64," prefix — Sheets rejects strings starting with "data:"
    const photoToSave = photo.includes(',') ? photo.split(',')[1] : photo;
    try {
      if (isEdit) {
        await updateMember({ ...member, ...form, Photo: photoToSave });
        toast.success('Member updated successfully');
      } else {
        await saveMember({
          MemberID: generateID('MBR'),
          ...form,
          Photo: photoToSave,
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

            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`} alt="Member photo" className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-muted-foreground" />
                  )}
                </div>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-primary font-medium"
              >
                <Camera size={14} /> {photo ? 'Change Photo' : 'Add Photo'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

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
