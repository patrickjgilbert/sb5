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

---

## 🚀 Deployment & Configuration

### GitHub Repository
- **Repository**: `https://github.com/patrickjgilbert/sb5.git`
- **Branch**: `main` (default deployment branch)

### Vercel Deployment
- **Platform**: Vercel (automatic deployments from GitHub)
- **Production URL**: https://www.schedulebuddy.co
- **Vercel URL**: https://sb5.vercel.app
- **Framework**: Next.js (automatically detected)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next` (default)
- **Node.js Version**: Latest stable (auto-detected from `package.json`)
- **Configuration**: Fluid Compute enabled, Standard Protection, 1 vCPU, 2 GB Memory

### Environment Variables Required

#### OpenAI Configuration
```bash
OPENAI_API_KEY=sk-proj-[YOUR_OPENAI_API_KEY]
```
- **Purpose**: Powers the AI analysis feature for schedule recommendations
- **Where to get**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Model used**: GPT-4o

#### Supabase Configuration  
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs[YOUR_ANON_KEY]
```
- **Purpose**: Database storage for events and participant responses
- **Where to get**: [Supabase Dashboard](https://app.supabase.com/)
- **Current Project**: `wxirftjrvfihqwbcjewc.supabase.co`

#### Development Configuration
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
- **Purpose**: Base URL for local development
- **Production**: Set to `https://www.schedulebuddy.co` in production

### Database Schema (Supabase)

#### Events Table
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  description TEXT,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Responses Table  
```sql
CREATE TABLE responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES events(id),
  participant_name TEXT NOT NULL,
  availability TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/patrickjgilbert/sb5.git
   cd sb5/schedulebuddy
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual keys
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

### Development & Testing Workflow

**For safe development with testing before production deployment:**

1. **See [DEVELOPMENT.md](schedulebuddy/DEVELOPMENT.md)** for complete workflow guide
2. **Use feature branches** for new changes
3. **Test locally** with `npm run dev` 
4. **Get Vercel preview** by pushing feature branches
5. **Merge to main** only after testing

#### Automatic Deployment (Production)
1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
2. **Vercel automatically deploys** from GitHub integration

#### Manual Deployment via Vercel CLI
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Environment Variables in Vercel

To update environment variables in production:

1. **Via Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add/update variables for Production, Preview, and Development environments

2. **Via Vercel CLI**:
   ```bash
   vercel env add OPENAI_API_KEY production
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   ```

### Key Dependencies
- **Framework**: Next.js 15.4.4 with React 19.1.0
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI API (GPT-4o)
- **Styling**: Tailwind CSS 4.0
- **Utilities**: date-fns, axios, uuid
- **TypeScript**: Full TypeScript support

### Troubleshooting Deployment Issues

#### Common Issues:
1. **Build fails**: Check environment variables are set in Vercel dashboard
2. **API errors**: Verify OpenAI API key has sufficient credits
3. **Database errors**: Confirm Supabase URL and key are correct
4. **CORS issues**: Ensure domain is added to Supabase allowed origins

#### Debug Steps:
1. Check Vercel function logs in dashboard
2. Verify environment variables in Vercel settings
3. Test API endpoints individually
4. Check Supabase dashboard for database connectivity

### Security Notes
- **Never commit** `.env.local` or API keys to version control
- **Rotate keys** periodically for security
- **Use different** API keys for development vs production
- **Monitor usage** in OpenAI and Supabase dashboards

---

