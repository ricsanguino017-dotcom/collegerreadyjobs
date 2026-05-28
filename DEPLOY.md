# CollegeReadyJobs — Full Backend Deploy Guide

## What's in this project

```
crj-backend/
├── pages/
│   ├── index.html              ← Your full frontend (no keys inside)
│   └── api/
│       ├── ai.js               ← Claude AI proxy (key server-side)
│       ├── jobs.js             ← Adzuna jobs proxy (key server-side)
│       ├── parse-resume.js     ← Real PDF + DOCX parsing
│       ├── reports.js          ← ATS reports saved to Supabase
│       └── tracker.js          ← Application tracker in Supabase
├── lib/
│   └── supabase.js             ← Supabase client
├── SUPABASE_SCHEMA.sql         ← Run this in Supabase SQL editor
├── package.json
├── .env.example                ← Copy to .env.local
└── .gitignore                  ← .env.local is excluded
```

---

## Step 1 — Set up Supabase (free)

1. Go to **supabase.com** → Create account → New project
2. Name it "collegerreadyjobs", choose a region close to you
3. Go to **SQL Editor** → paste the contents of `SUPABASE_SCHEMA.sql` → Run
4. Go to **Settings → API** → copy:
   - Project URL (looks like `https://xxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key (keep this private)
5. Go to **Authentication → Providers** → enable **Email** and **Google**

---

## Step 2 — Rotate your Adzuna key

Your old Adzuna key was exposed in a previous version. Get a new one:
1. Go to **developer.adzuna.com** → sign in
2. My Account → regenerate App Key
3. Copy the new key

---

## Step 3 — Deploy to Vercel

### Option A: GitHub (recommended)
1. Create a GitHub repo called `collegerreadyjobs`
2. Upload all files from `crj-backend/`
3. Copy `index.html` into `pages/index.html`
4. Go to **vercel.com** → Import GitHub repo → Deploy

### Option B: CLI (fastest)
```bash
cd crj-backend
npm install
npx vercel
```

---

## Step 4 — Add environment variables in Vercel

Go to your project on Vercel → **Settings → Environment Variables** → add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (from console.anthropic.com) |
| `ADZUNA_APP_ID` | `7945d87d` |
| `ADZUNA_APP_KEY` | your new rotated key |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `NEXT_PUBLIC_APP_URL` | `https://collegerreadyjobs.vercel.app` |

Click **Save** → Vercel redeploys automatically.

---

## How the security works after deploy

```
Browser
  │
  ├── POST /api/ai          ← sends prompt only, no key
  │         └── server calls Anthropic with ANTHROPIC_API_KEY
  │
  ├── GET  /api/jobs        ← sends search query, no key
  │         └── server calls Adzuna with ADZUNA_APP_KEY
  │
  └── POST /api/parse-resume ← sends file
            └── server parses PDF/DOCX with pdf-parse + mammoth
```

Zero API keys in the browser. Ever.

---

## What's still TODO for full production

1. **Wire up Supabase Auth in the frontend** — replace the fake `U={name,major}` login
   with `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`
   
2. **Real Google OAuth** — enable in Supabase Auth → Providers → Google,
   then call `supabase.auth.signInWithOAuth({ provider: 'google' })`

3. **Pass auth token to API routes** — after login, include the session token
   in API calls: `Authorization: Bearer ${session.access_token}`
   The `/api/reports.js` and `/api/tracker.js` routes are already ready for this.

4. **Stripe payments** — add `stripe` package, create `/api/create-checkout-session.js`

---

## Local development

```bash
cp .env.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
# Open http://localhost:3000
```
