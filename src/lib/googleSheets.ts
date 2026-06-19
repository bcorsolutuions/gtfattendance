const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? '';

function buildURL(action: string, params?: Record<string, string>): string {
  if (!APPS_SCRIPT_URL) throw new Error('Google Sheets not configured. Set NEXT_PUBLIC_APPS_SCRIPT_URL in .env.local');
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function callAPI(action: string, payload?: Record<string, unknown>) {
  const url = buildURL(action);
  const response = await fetch(url, {
    method: payload ? 'POST' : 'GET',
    headers: { 'Content-Type': 'text/plain' },
    body: payload ? JSON.stringify({ action, ...payload }) : undefined,
  });
  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function getMembers() {
  const data = await callAPI('getMembers');
  return data.members ?? [];
}

export async function saveMember(member: Record<string, unknown>) {
  return callAPI('saveMember', { member });
}

export async function updateMember(member: Record<string, unknown>) {
  return callAPI('updateMember', { member });
}

export async function deleteMember(memberID: string) {
  return callAPI('deleteMember', { memberID });
}

export async function getMeetings() {
  const data = await callAPI('getMeetings');
  return data.meetings ?? [];
}

export async function saveMeeting(meeting: Record<string, unknown>) {
  return callAPI('saveMeeting', { meeting });
}

export async function updateMeeting(meeting: Record<string, unknown>) {
  return callAPI('updateMeeting', { meeting });
}

export async function deleteMeeting(meetingID: string) {
  return callAPI('deleteMeeting', { meetingID });
}

export async function getAttendance(meetingID?: string, memberID?: string) {
  const params: Record<string, string> = {};
  if (meetingID) params.meetingID = meetingID;
  if (memberID) params.memberID = memberID;
  const url = buildURL('getAttendance', params);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.attendance ?? [];
}

export async function saveAttendanceBatch(
  meetingID: string,
  records: Array<{ MemberID: string; Status: string; Remarks: string }>
) {
  return callAPI('saveAttendanceBatch', { meetingID, records });
}
