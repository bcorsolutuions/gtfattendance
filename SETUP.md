# GTF Attendance Management — Setup Guide

## Prerequisites
- Node.js 18+
- A Google account (free)

---

## Step 1 — Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**.
2. Name it **"GTF Attendance"** (or any name you like).
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  <<<SPREADSHEET_ID>>>  /edit
   ```

---

## Step 2 — Deploy the Google Apps Script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete all existing code in the editor.
3. Copy and paste the contents of **`google-apps-script/Code.gs`** from this project.
4. On **line 4**, replace the empty string with your Spreadsheet ID:
   ```javascript
   var SS_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
5. Click **Save** (Ctrl+S).
6. Click **Deploy → New deployment**.
7. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
8. Set:
   - **Description**: GTF Attendance API
   - **Execute as**: Me (your Google account)
   - **Who has access**: **Anyone**
9. Click **Deploy**.
10. **Authorize** the app when prompted (click "Advanced" → "Go to GTF Attendance (unsafe)" if needed).
11. Copy the **Web app URL** — it looks like:
    ```
    https://script.google.com/macros/s/AKfycb.../exec
    ```

> **Important**: Every time you change the Apps Script code, you must create a **new deployment** — do not re-use an existing one, or the old version will keep running.

---

## Step 3 — Configure the Next.js App

1. Open `.env.local` in the project root.
2. Paste the Apps Script URL and set a secure password:
   ```env
   NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   NEXT_PUBLIC_ADMIN_PASSWORD=YourSecurePassword123
   ```

---

## Step 4 — Run the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your admin password.

---

## Sheet Structure (auto-created on first use)

| Sheet | Columns |
|-------|---------|
| Members | MemberID, FullName, Mobile, Area, Status, Remarks, CreatedAt |
| Meetings | MeetingID, MeetingDate, Title, Venue, Notes, CreatedAt |
| Attendance | AttendanceID, MeetingID, MemberID, Status, Remarks, MarkedOn |

---

## Deploy to Production (optional)

The easiest free option is **Vercel**:

```bash
npm install -g vercel
vercel
```

Set the environment variables in your Vercel project dashboard under **Settings → Environment Variables**.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API error" on dashboard | Check that `NEXT_PUBLIC_APPS_SCRIPT_URL` is set correctly |
| CORS error in browser | Re-deploy the Apps Script as "Anyone" |
| Changes not reflected | You must create a **new deployment** after code changes |
| Login fails | Check `NEXT_PUBLIC_ADMIN_PASSWORD` in `.env.local` |
