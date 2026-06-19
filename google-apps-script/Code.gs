// GTF Attendance Management — Google Apps Script
// Deploy this as a Web App with "Anyone" access

var SS_ID = '1G1djWr5ssyvcvXk1dfa4G76aNqBelOlXTyN71kHth2w';

var SHEETS = {
  Members:    'Members',
  Meetings:   'Meetings',
  Attendance: 'Attendance'
};

var HEADERS = {
  Members:    ['MemberID', 'FullName', 'Mobile', 'Area', 'Status', 'Remarks', 'CreatedAt'],
  Meetings:   ['MeetingID', 'MeetingDate', 'Title', 'Venue', 'Notes', 'CreatedAt'],
  Attendance: ['AttendanceID', 'MeetingID', 'MemberID', 'Status', 'Remarks', 'MarkedOn']
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSpreadsheet() {
  return SpreadsheetApp.openById(SS_ID);
}

function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function generateID(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GET handler ────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'getMembers') {
      return response({ members: sheetToObjects(getSheet(SHEETS.Members)) });
    }
    if (action === 'getMeetings') {
      return response({ meetings: sheetToObjects(getSheet(SHEETS.Meetings)) });
    }
    if (action === 'getAttendance') {
      var att = sheetToObjects(getSheet(SHEETS.Attendance));
      if (e.parameter.meetingID) att = att.filter(function(a) { return a.MeetingID === e.parameter.meetingID; });
      if (e.parameter.memberID) att = att.filter(function(a) { return a.MemberID === e.parameter.memberID; });
      return response({ attendance: att });
    }
    return response({ error: 'Unknown action: ' + action });
  } catch(err) {
    return response({ error: err.toString() });
  }
}

// ─── POST handler ───────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'saveMember')         return saveMember(body.member);
    if (action === 'updateMember')       return updateMember(body.member);
    if (action === 'deleteMember')       return deleteMember(body.memberID);
    if (action === 'saveMeeting')        return saveMeeting(body.meeting);
    if (action === 'updateMeeting')      return updateMeeting(body.meeting);
    if (action === 'deleteMeeting')      return deleteMeeting(body.meetingID);
    if (action === 'saveAttendanceBatch') return saveAttendanceBatch(body.meetingID, body.records);

    return response({ error: 'Unknown action: ' + action });
  } catch(err) {
    return response({ error: err.toString() });
  }
}

// ─── Members ────────────────────────────────────────────────────────────────

function saveMember(m) {
  var sheet = getSheet(SHEETS.Members);
  sheet.appendRow([m.MemberID, m.FullName, m.Mobile, m.Area, m.Status, m.Remarks, m.CreatedAt]);
  return response({ success: true, MemberID: m.MemberID });
}

function updateMember(m) {
  var sheet = getSheet(SHEETS.Members);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === m.MemberID) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        m.MemberID, m.FullName, m.Mobile, m.Area, m.Status, m.Remarks, data[i][6]
      ]]);
      return response({ success: true });
    }
  }
  return response({ error: 'Member not found' });
}

function deleteMember(memberID) {
  var sheet = getSheet(SHEETS.Members);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === memberID) {
      sheet.deleteRow(i + 1);
      return response({ success: true });
    }
  }
  return response({ error: 'Member not found' });
}

// ─── Meetings ───────────────────────────────────────────────────────────────

function saveMeeting(m) {
  var sheet = getSheet(SHEETS.Meetings);
  sheet.appendRow([m.MeetingID, m.MeetingDate, m.Title, m.Venue, m.Notes, m.CreatedAt]);
  return response({ success: true, MeetingID: m.MeetingID });
}

function updateMeeting(m) {
  var sheet = getSheet(SHEETS.Meetings);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === m.MeetingID) {
      sheet.getRange(i + 1, 1, 1, 6).setValues([[
        m.MeetingID, m.MeetingDate, m.Title, m.Venue, m.Notes, data[i][5]
      ]]);
      return response({ success: true });
    }
  }
  return response({ error: 'Meeting not found' });
}

function deleteMeeting(meetingID) {
  var sheet = getSheet(SHEETS.Meetings);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === meetingID) {
      sheet.deleteRow(i + 1);
      return response({ success: true });
    }
  }
  return response({ error: 'Meeting not found' });
}

// ─── Attendance ─────────────────────────────────────────────────────────────

function saveAttendanceBatch(meetingID, records) {
  var sheet = getSheet(SHEETS.Attendance);
  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString();

  // Delete existing records for this meeting
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === meetingID) {
      sheet.deleteRow(i + 1);
    }
  }

  // Insert new records
  records.forEach(function(r) {
    sheet.appendRow([
      generateID('ATT'),
      meetingID,
      r.MemberID,
      r.Status,
      r.Remarks || '',
      now
    ]);
  });

  return response({ success: true, count: records.length });
}
