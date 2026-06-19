export type MemberStatus = 'Active' | 'Inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Leave Informed';

export interface Member {
  MemberID: string;
  FullName: string;
  Mobile: string;
  Area: string;
  Status: MemberStatus;
  Remarks: string;
  Photo?: string;
  CreatedAt: string;
}

export interface Meeting {
  MeetingID: string;
  MeetingDate: string;
  Title: string;
  Venue: string;
  Notes: string;
  CreatedAt: string;
}

export interface Attendance {
  AttendanceID: string;
  MeetingID: string;
  MemberID: string;
  Status: AttendanceStatus;
  Remarks: string;
  MarkedOn: string;
}

export interface AttendanceSummary {
  Present: number;
  Absent: number;
  LeaveInformed: number;
  Total: number;
}
