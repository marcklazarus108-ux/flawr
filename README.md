# Flawr — full app (v1)

Everything is here: sign in, create documents, write in a real-time
collaborative editor, chat with the AI, ask it to rewrite selected text,
scan handwritten or printed pages into the document, and export to
Word, PDF, or Markdown.

## What's inside

```
flawr/
  backend/    Two things run from here:
                1. The main API (auth, documents, AI, exports)
                2. The real-time collaboration server (separate process)
  frontend/   The React app you open in a browser
```

Why two backend processes instead of one: the collaboration server speaks
a different protocol (WebSockets, for instant multi-person editing) from
the main API (regular HTTP requests). Keeping them separate means one
can restart without kicking everyone out of their documents.

## 1. Accounts you'll need (all free)

1. **Neon** (https://neon.tech) — free Postgres database. Copy its
   connection string.
2. **Google Cloud Console** (https://console.cloud.google.com/apis/credentials)
   — create an OAuth Client ID (type: Web application) for "Sign in with
   Google". Add `http://localhost:5173` as an authorized origin now, and
   your real frontend URL once deployed.
3. **Google AI Studio** (https://aistudio.google.com/apikey) — free Gemini
   API key. This powers the chat, inline edits, and photo scanning.

## 2. Run everything locally first

You'll need Node.js (https://nodejs.org, LTS version) installed.

**Backend** — open a terminal:
```
cd backend
npm install
cp .env.example .env
```
Fill in `.env`: `DATABASE_URL` (Neon), `JWT_SECRET` (any long random
string), `GOOGLE_CLIENT_ID`, `GROQ_API_KEY`.

```
npx prisma migrate dev --name init
npm run dev
```
API now running at http://localhost:4000

**Collaboration server** — open a second terminal:
```
cd backend
npm run collab
```
Running at ws://localhost:1234. Uses the same `.env` file.

**Frontend** — open a third terminal:
```
cd frontend
npm install
cp .env.example .env
```
Fill in `.env`: `VITE_GOOGLE_CLIENT_ID` (same as backend's), leave the
rest as-is for local testing.

```
npm run dev
```
Open http://localhost:5173 — sign up, create a document, write in it,
try "Ask AI" on some selected text, try "Scan page" with a photo, try
exporting.

**To test real-time collaboration:** open the same document in two
browser windows (or two browsers) while signed in, and type in one -
you should see it appear in the other, plus a colored cursor showing
who's typing where.

## 3. Deploy for free on Render

You'll deploy three separate services. All can be on Render's free tier.

### Main API (Web Service)
- Root directory: `backend`
- Build command: `npm install && npx prisma generate`
- Start command: `npm start`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`,
  `GROQ_API_KEY`, and `FRONTEND_URL` (fill this in after deploying the
  frontend, see below).
- After first deploy, run the migration once from your own computer:
  temporarily point your local `backend/.env`'s `DATABASE_URL` at the same
  Neon database, then run `npx prisma migrate deploy`.

### Collaboration server (a second Web Service, same repo)
- Root directory: `backend` (same repo as above)
- Build command: `npm install && npx prisma generate`
- Start command: `npm run collab`
- Environment variables: same `DATABASE_URL` and `JWT_SECRET` as the main
  API (it needs both to load documents and verify logins).
- Render gives this its own URL, e.g. `flawr-collab.onrender.com`. Your
  frontend will connect to it as `wss://flawr-collab.onrender.com`.

### Frontend (Static Site)
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_API_URL` (main API URL + `/api`),
  `VITE_GOOGLE_CLIENT_ID`, `VITE_COLLAB_URL` (the collab service's URL,
  starting with `wss://` not `ws://`).
- After deploying, add this frontend's URL to Google Cloud's authorized
  origins, and set it as `FRONTEND_URL` on the main API service, then
  redeploy the main API.

### A note on free hosting
Render's free web services sleep after 15 minutes of inactivity — the
first request after that takes 30-50 seconds to wake up. This applies to
both the main API and the collaboration server. It costs nothing, just
causes a delay on the first use after idle time. Upgrading either service
to Render's cheapest paid tier (~$7/month) removes this.

## Known limitations of this v1, worth knowing

- **Sharing model**: any signed-in Flawr user with a document's link can
  open and co-edit it (like old-school "anyone with the link" Google
  Docs sharing). There's no per-person invite list or view-only mode yet.
- **PDF export** is text-only (titles and paragraphs), not a pixel-exact
  copy of the editor's formatting. Word and Markdown exports carry full
  formatting.
- **Gemini free tier** has daily rate limits. If AI features suddenly stop
  responding, that's almost always why - check https://aistudio.google.com
  for your usage.
- **Google sign-in button** won't render until `VITE_GOOGLE_CLIENT_ID` is
  set correctly - the page will show a small note instead if it's missing.

## Natural next additions

- Real per-person sharing permissions (view-only, invite by email)
- Version history / document snapshots
- Pixel-accurate PDF export
- Mobile app wrapper
