'use client';

import { useEffect, useState } from 'react';
import { getMembers, deleteMember } from '@/lib/googleSheets';
import type { Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, UserCheck, UserX, Phone, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setMembers(await getMembers());
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.FullName.toLowerCase().includes(q) ||
      m.Mobile.includes(q) ||
      m.Area.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || m.Status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleDelete(m: Member) {
    if (!confirm(`Delete "${m.FullName}"? This cannot be undone.`)) return;
    try {
      await deleteMember(m.MemberID);
      toast.success('Member deleted');
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
          <h1 className="text-xl font-bold">Members</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{members.filter(m => m.Status === 'Active').length} active</p>
        </div>
        <Link href="/members/new">
          <Button size="sm" className="gap-1.5 h-9">
            <Plus size={15} /> Add
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, mobile or area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2">
        {(['All', 'Active', 'Inactive'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Member cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="mx-auto mb-2 opacity-30" size={36} />
          <p className="text-sm">No members found</p>
          <Link href="/members/new" className="text-primary text-sm hover:underline">Add a member</Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <Card key={m.MemberID} className="shadow-sm border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-muted border shrink-0 overflow-hidden flex items-center justify-center">
                    {m.Photo && m.Photo.length > 10 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.Photo.startsWith('data:') ? m.Photo : `data:image/jpeg;base64,${m.Photo}`} alt={m.FullName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm leading-tight">{m.FullName}</p>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          m.Status === 'Active'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {m.Status === 'Active' ? <UserCheck size={9} className="mr-0.5" /> : <UserX size={9} className="mr-0.5" />}
                        {m.Status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      {m.Mobile && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone size={11} /> {m.Mobile}
                        </span>
                      )}
                      {m.Area && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={11} /> {m.Area}
                        </span>
                      )}
                    </div>
                    {m.Remarks && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{m.Remarks}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => router.push(`/members/${m.MemberID}/edit`)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center pb-1">
        {filtered.length} of {members.length} members
      </p>
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
