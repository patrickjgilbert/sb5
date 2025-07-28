# 🗓️ ScheduleBuddy Web App

A mobile-first web app that helps groups of friends coordinate schedules using natural language inputs. This tool simplifies availability collection and uses an LLM to recommend optimal meeting times based on participant responses.

---

## 🚀 Overview

This app allows:

- **Admins (Event Creators)** to create events and provide a public link for friends to submit availability.
- **Participants** to submit their name and availability in a single form.
- **LLM Analysis** to suggest ideal meeting times based on all responses.

Built with **Next.js**, **OpenAI API**, and **Google Sheets (user-managed)** for storage.

---

## 🧱 Project Workflow

1. **Admin creates a new event**

   - Provides event name, optional description, and a scheduling window (default: next 30 days).
   - Creates a new Google Sheet manually and sets sharing to "Anyone with the link can edit."
   - Pastes link to Google Sheet in the app.
   - Clicks "Create Event."

2. **Sheet Setup**

   - The app renames the sheet to: `ScheduleBuddy Responses: [event ID]`
   - Adds a tab with a link back to the event's admin page so the admin can always retrieve the URL.

3. **Admin receives a shareable participant form link**

   - Form collects: name + availability (free text).
   - Submissions are appended to the linked Google Sheet.

4. **Admin dashboard (example: attached screenshot)**

   - Shows response summary (e.g. participant count, range of suggestions).
   - Runs OpenAI analysis on the sheet data.
   - Outputs 2–3 suggested meeting times with rationale and confidence level.

---

## 📊 Tech Stack

| Layer               | Tool/Framework                      |
| ------------------- | ----------------------------------- |
| **Frontend**        | Next.js + TypeScript                |
| **Styling**         | Tailwind CSS                        |
| **Backend API**     | Next.js API Routes / Edge Functions |
| **LLM Integration** | OpenAI GPT-4 API                    |
| **Data Storage**    | User-supplied Google Sheets         |
| **Deployment**      | Vercel                              |

---

## 🔹 Pages

```
/pages
  index.tsx                // Landing page with CTA
  create.tsx               // Admin creates an event
  event/[eventId].tsx      // Participant form page
  admin/[eventId].tsx      // Admin dashboard with AI output
```

---

## 🔹 API Routes

### POST `/api/create-event`

Creates a new event and renames the provided Google Sheet.

**Request Body:**

```json
{
  "eventName": "Fantasy Football Draft",
  "description": "Try to find a time before the season starts!",
  "windowStart": "2025-08-01",
  "windowEnd": "2025-08-31",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/..."
}
```

**Response:**

```json
{
  "eventId": "abc123xyz",
  "adminUrl": "https://schedulebuddy.app/admin/abc123xyz",
  "formUrl": "https://schedulebuddy.app/event/abc123xyz"
}
```

---

### POST `/api/submit`

Saves participant response to the linked Google Sheet.

**Request Body:**

```json
{
  "eventId": "abc123xyz",
  "name": "Patrick",
  "availability": "Evenings after 7 PM, not available August 11–18."
}
```

---

### POST `/api/analyze`

Reads all responses from the sheet and runs GPT summarization.

**Output:**

```json
{
  "suggestions": [
    {
      "time": "August 10, 9:00 PM EST",
      "confidence": "high",
      "notes": "Works for all except one participant who prefers earlier."
    },
    {
      "time": "August 17, 9:00 PM EST",
      "confidence": "high",
      "notes": "Weekend option aligns with most evening preferences."
    }
  ]
}
```

---

## 📅 UI Flow (Updated)

### Admin Flow:

- Clicks **Create Event**
- Provides event info + Google Sheet link
- Receives:
  - Admin dashboard URL (includes analysis + results)
  - Form submission link to share with friends

### Participant Flow:

- Visits form link
- Inputs name and availability
- Response is appended to the shared Google Sheet

### Admin Dashboard (see mockup):

- Summary of total responses
- GPT-generated recommendations
- Confidence levels + recommendation notes
- Link sharing and final scheduling instructions

---

## 🔍 Considerations & Simplifications

### ✅ No Google Auth / Service Account Required

- Admin manually manages the sheet and permissions.
- No backend token exchange needed.

### ✅ No Chatbot or Clarifying Q&A

- Simple form submission instead.
- GPT will handle nuance when analyzing all responses together.

### ✅ No Admin Portal Login

- Admin keeps access via spreadsheet tab link.
- Simplifies hosting, sessions, and user management.

---

## 🔄 Future Enhancements

- Add voting flow for final selection.
- Export suggested time to calendar.
- Use Sheets API later if admin auth becomes feasible.

---

## 👥 Team Notes

This is now a **lightweight scheduling tool** powered by:

- User-managed sheets
- OpenAI summaries
- Simple sharing workflows

Prioritize:

1. Admin flow and sheet renaming logic
2. Participant form
3. AI analysis based on freeform sheet data
4. Admin dashboard rendering

Minimal infrastructure with maximum usefulness.

