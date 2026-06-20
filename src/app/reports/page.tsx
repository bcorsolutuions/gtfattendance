'use client';

import { useEffect, useState, useRef } from 'react';
import { getMembers, getMeetings, getAttendance } from '@/lib/googleSheets';
import type { Member, Meeting, Attendance, AttendanceStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Printer, FileSpreadsheet, FileDown, MessageCircle } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

const STATUS_CELL: Record<AttendanceStatus, string> = {
  Present: 'bg-green-500 text-white',
  Absent: 'bg-red-500 text-white',
  'Leave Informed': 'bg-yellow-400 text-yellow-900',
};

const STATUS_ABBR: Record<AttendanceStatus, string> = {
  Present: 'P',
  Absent: 'A',
  'Leave Informed': 'L',
};

type Tab = 'grid' | 'meeting' | 'member';

export default function ReportsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<Tab>('grid');
  const [filterMeeting, setFilterMeeting] = useState<string | null>('all');
  const [filterMember, setFilterMember] = useState<string | null>('all');
  const [filterArea, setFilterArea] = useState<string | null>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ms, mts, att] = await Promise.all([getMembers(), getMeetings(), getAttendance()]);
        setMembers(ms);
        setMeetings(mts.sort((a: Meeting, b: Meeting) =>
          new Date(a.MeetingDate).getTime() - new Date(b.MeetingDate).getTime()
        ));
        setAttendance(att);
      } catch (e: unknown) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const areas = Array.from(new Set(members.map((m) => m.Area).filter(Boolean)));

  const filteredMeetings = meetings.filter((m) => {
    if (dateFrom && dateTo) {
      try {
        return isWithinInterval(parseISO(m.MeetingDate), { start: parseISO(dateFrom), end: parseISO(dateTo) });
      } catch { return true; }
    }
    return true;
  }).filter((m) => !filterMeeting || filterMeeting === 'all' || m.MeetingID === filterMeeting);

  const filteredMembers = members
    .filter((m) => !filterArea || filterArea === 'all' || m.Area === filterArea)
    .filter((m) => !filterMember || filterMember === 'all' || m.MemberID === filterMember);

  const attMap: Record<string, Record<string, AttendanceStatus>> = {};
  attendance.forEach((a) => {
    if (!attMap[a.MeetingID]) attMap[a.MeetingID] = {};
    attMap[a.MeetingID][a.MemberID] = a.Status;
  });

  const totalPresent = attendance.filter((a) => a.Status === 'Present').length;
  const totalAbsent = attendance.filter((a) => a.Status === 'Absent').length;
  const totalLeave = attendance.filter((a) => a.Status === 'Leave Informed').length;

  const meetingSummary = filteredMeetings.map((m) => {
    const att = attendance.filter((a) => a.MeetingID === m.MeetingID);
    return { ...m, present: att.filter((a) => a.Status === 'Present').length, absent: att.filter((a) => a.Status === 'Absent').length, leave: att.filter((a) => a.Status === 'Leave Informed').length, total: att.length };
  });

  const memberSummary = filteredMembers.map((m) => {
    const att = attendance.filter((a) => a.MemberID === m.MemberID);
    return { ...m, present: att.filter((a) => a.Status === 'Present').length, absent: att.filter((a) => a.Status === 'Absent').length, leave: att.filter((a) => a.Status === 'Leave Informed').length, total: att.length };
  });

  // ── Print ──────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ── PDF (browser print-to-PDF) ─────────────────────────────────────────────
  function handlePDF() {
    toast.info('Select "Save as PDF" in the print dialog');
    setTimeout(() => window.print(), 500);
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  function handleExcel() {
    const wb = XLSX.utils.book_new();

    if (tab === 'grid') {
      const rows = filteredMembers.map((m) => {
        const row: Record<string, string | number> = { Member: m.FullName, Area: m.Area };
        filteredMeetings.forEach((mt) => {
          const status = attMap[mt.MeetingID]?.[m.MemberID];
          row[format(new Date(mt.MeetingDate), 'dd MMM yy')] = status ? STATUS_ABBR[status] : '-';
        });
        const att = attendance.filter((a) => a.MemberID === m.MemberID);
        row['P'] = att.filter((a) => a.Status === 'Present').length;
        row['A'] = att.filter((a) => a.Status === 'Absent').length;
        row['L'] = att.filter((a) => a.Status === 'Leave Informed').length;
        return row;
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Attendance Grid');
    }

    if (tab === 'meeting') {
      const rows = meetingSummary.map((m) => ({
        Date: format(new Date(m.MeetingDate), 'dd MMM yyyy'),
        Meeting: m.Title,
        Venue: m.Venue,
        Present: m.present,
        Absent: m.absent,
        Leave: m.leave,
        Total: m.total,
        Rate: m.total > 0 ? `${Math.round((m.present / m.total) * 100)}%` : '-',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Meeting Summary');
    }

    if (tab === 'member') {
      const rows = memberSummary.map((m) => ({
        Name: m.FullName,
        Area: m.Area,
        Present: m.present,
        Absent: m.absent,
        Leave: m.leave,
        Total: m.total,
        Rate: m.total > 0 ? `${Math.round((m.present / m.total) * 100)}%` : '-',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Member Summary');
    }

    XLSX.writeFile(wb, `GTF_Attendance_${tab}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast.success('Excel file downloaded');
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  function handleWhatsApp() {
    let text = `*GTF Attendance Report*\n${format(new Date(), 'dd MMM yyyy')}\n\n`;

    if (tab === 'meeting') {
      text += `*Meeting-wise Summary*\n`;
      meetingSummary.forEach((m) => {
        text += `📅 ${format(new Date(m.MeetingDate), 'dd MMM yyyy')} - ${m.Title}\n`;
        text += `  ✅ Present: ${m.present}  ❌ Absent: ${m.absent}  🟡 Leave: ${m.leave}  | Rate: ${m.total > 0 ? Math.round((m.present / m.total) * 100) : 0}%\n`;
      });
    } else if (tab === 'member') {
      text += `*Member-wise Summary*\n`;
      memberSummary.forEach((m) => {
        text += `👤 ${m.FullName} (${m.Area})\n`;
        text += `  ✅ ${m.present}  ❌ ${m.absent}  🟡 ${m.leave}  | Rate: ${m.total > 0 ? Math.round((m.present / m.total) * 100) : 0}%\n`;
      });
    } else {
      text += `*Overall Summary*\n`;
      text += `✅ Total Present: ${totalPresent}\n`;
      text += `❌ Total Absent: ${totalAbsent}\n`;
      text += `🟡 Leave Informed: ${totalLeave}\n\n`;
      text += `*Members: ${filteredMembers.length} | Meetings: ${filteredMeetings.length}*`;
    }

    text += `\n\n_Global Thikkodians Forum_`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  const tabLabel = tab === 'grid' ? 'Attendance Grid' : tab === 'meeting' ? 'Meeting-wise Summary' : 'Member-wise Attendance';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Attendance analytics and summaries</p>
        </div>
        {/* Export buttons */}
        <div className="flex gap-2 flex-wrap no-print">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer size={15} /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePDF}>
            <FileDown size={15} /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50" onClick={handleExcel}>
            <FileSpreadsheet size={15} /> Excel
          </Button>
          <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white" onClick={handleWhatsApp}>
            <MessageCircle size={15} /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-4 no-print">
        {[
          { label: 'Total Present', value: totalPresent, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Total Absent', value: totalAbsent, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Leave Informed', value: totalLeave, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-lg border p-4 ${bg}`}>
            <p className={`text-3xl font-bold ${color}`}>{loading ? '…' : value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="no-print">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">From Date</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">To Date</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Meeting</label>
              <Select value={filterMeeting} onValueChange={setFilterMeeting}>
                <SelectTrigger className="h-8 w-48"><SelectValue placeholder="All meetings" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meetings</SelectItem>
                  {meetings.map((m) => (
                    <SelectItem key={m.MeetingID} value={m.MeetingID}>
                      {format(new Date(m.MeetingDate), 'dd MMM yy')} – {m.Title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Area</label>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="All areas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Member</label>
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="All members" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map((m) => <SelectItem key={m.MemberID} value={m.MemberID}>{m.FullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="h-8"
                onClick={() => { setDateFrom(''); setDateTo(''); setFilterMeeting('all'); setFilterMember('all'); setFilterArea('all'); }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab switcher */}
      <div className="flex gap-2 no-print">
        {[{ key: 'grid', label: 'Attendance Grid' }, { key: 'meeting', label: 'Meeting-wise' }, { key: 'member', label: 'Member-wise' }].map(({ key, label }) => (
          <Button key={key} variant={tab === key ? 'default' : 'outline'} size="sm" onClick={() => setTab(key as Tab)}>{label}</Button>
        ))}
      </div>

      {/* ── PRINTABLE AREA ── */}
      <div id="print-area" ref={printRef}>
        {/* Print header */}
        <div className="hidden print:block mb-4 text-center border-b pb-3">
          <h2 className="text-lg font-bold">Global Thikkodians Forum</h2>
          <p className="text-sm">{tabLabel} — Printed on {format(new Date(), 'dd MMM yyyy')}</p>
        </div>

        {/* Grid view */}
        {tab === 'grid' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Grid</CardTitle>
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-4 h-4 bg-green-500 rounded-sm mr-1 align-middle" />P = Present&nbsp;&nbsp;
                <span className="inline-block w-4 h-4 bg-red-500 rounded-sm mr-1 align-middle" />A = Absent&nbsp;&nbsp;
                <span className="inline-block w-4 h-4 bg-yellow-400 rounded-sm mr-1 align-middle" />L = Leave
              </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? <p className="text-muted-foreground text-sm p-6">Loading…</p> : (
                <table className="text-xs border-collapse w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 px-3 border font-medium min-w-[140px] sticky left-0 bg-muted z-10">Member</th>
                      <th className="text-left p-2 px-3 border font-medium min-w-[70px] sticky left-[140px] bg-muted z-10">Area</th>
                      {filteredMeetings.map((m) => (
                        <th key={m.MeetingID} className="p-2 border font-medium text-center whitespace-nowrap min-w-[70px]">
                          <div>{format(new Date(m.MeetingDate), 'dd MMM')}</div>
                          <div className="font-normal text-muted-foreground truncate max-w-[70px]">{m.Title}</div>
                        </th>
                      ))}
                      <th className="p-2 border font-medium text-center bg-muted">P</th>
                      <th className="p-2 border font-medium text-center bg-muted">A</th>
                      <th className="p-2 border font-medium text-center bg-muted">L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m, i) => {
                      const memberAtt = attendance.filter((a) => a.MemberID === m.MemberID);
                      const p = memberAtt.filter((a) => a.Status === 'Present').length;
                      const a = memberAtt.filter((a) => a.Status === 'Absent').length;
                      const l = memberAtt.filter((a) => a.Status === 'Leave Informed').length;
                      return (
                        <tr key={m.MemberID} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                          <td className={`p-2 px-3 border font-medium sticky left-0 z-10 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>{m.FullName}</td>
                          <td className={`p-2 px-3 border text-muted-foreground sticky left-[140px] z-10 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>{m.Area}</td>
                          {filteredMeetings.map((mt) => {
                            const status = attMap[mt.MeetingID]?.[m.MemberID];
                            return (
                              <td key={mt.MeetingID} className="border text-center">
                                {status ? (
                                  <span className={`inline-block w-6 h-6 rounded leading-6 text-xs font-bold ${STATUS_CELL[status]}`}>{STATUS_ABBR[status]}</span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                            );
                          })}
                          <td className="p-2 border text-center font-semibold text-green-700">{p}</td>
                          <td className="p-2 border text-center font-semibold text-red-700">{a}</td>
                          <td className="p-2 border text-center font-semibold text-yellow-700">{l}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Meeting-wise */}
        {tab === 'meeting' && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Meeting-wise Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Meeting</TableHead><TableHead>Venue</TableHead>
                    <TableHead className="text-green-700">Present</TableHead><TableHead className="text-red-700">Absent</TableHead>
                    <TableHead className="text-yellow-700">Leave</TableHead><TableHead>Total</TableHead><TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={8} className="text-muted-foreground">Loading…</TableCell></TableRow>
                    : meetingSummary.length === 0 ? <TableRow><TableCell colSpan={8} className="text-muted-foreground">No data</TableCell></TableRow>
                    : meetingSummary.map((m) => (
                      <TableRow key={m.MeetingID}>
                        <TableCell className="whitespace-nowrap">{format(new Date(m.MeetingDate), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="font-medium">{m.Title}</TableCell>
                        <TableCell className="text-muted-foreground">{m.Venue}</TableCell>
                        <TableCell className="font-semibold text-green-700">{m.present}</TableCell>
                        <TableCell className="font-semibold text-red-700">{m.absent}</TableCell>
                        <TableCell className="font-semibold text-yellow-700">{m.leave}</TableCell>
                        <TableCell>{m.total}</TableCell>
                        <TableCell>
                          {m.total > 0 ? (
                            <Badge className={`text-xs ${m.present / m.total >= 0.75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {Math.round((m.present / m.total) * 100)}%
                            </Badge>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Member-wise */}
        {tab === 'member' && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Member-wise Attendance History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Area</TableHead>
                    <TableHead className="text-green-700">Present</TableHead><TableHead className="text-red-700">Absent</TableHead>
                    <TableHead className="text-yellow-700">Leave</TableHead><TableHead>Total</TableHead><TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={7} className="text-muted-foreground">Loading…</TableCell></TableRow>
                    : memberSummary.length === 0 ? <TableRow><TableCell colSpan={7} className="text-muted-foreground">No data</TableCell></TableRow>
                    : memberSummary.map((m) => (
                      <TableRow key={m.MemberID}>
                        <TableCell className="font-medium">{m.FullName}</TableCell>
                        <TableCell className="text-muted-foreground">{m.Area}</TableCell>
                        <TableCell className="font-semibold text-green-700">{m.present}</TableCell>
                        <TableCell className="font-semibold text-red-700">{m.absent}</TableCell>
                        <TableCell className="font-semibold text-yellow-700">{m.leave}</TableCell>
                        <TableCell>{m.total}</TableCell>
                        <TableCell>
                          {m.total > 0 ? (
                            <Badge className={`text-xs ${m.present / m.total >= 0.75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {Math.round((m.present / m.total) * 100)}%
                            </Badge>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
