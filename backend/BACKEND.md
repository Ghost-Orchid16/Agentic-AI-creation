# Deploying the Orbit backend

This is a tiny Express server with one job: hold your AI provider's API key
server-side (via environment variables) and proxy chat requests to it, so
the key never appears in the browser, in your HTML/CSS/JS, or in this
GitHub repository.

It's a separate deployment from the frontend — the frontend (in the repo
root) stays a static site on GitHub Pages; this `backend/` folder deploys
to a small Node host.

## Deploy for free on Render

1. Go to `render.com` and sign up (free, no credit card for the free tier).
2. **New → Web Service**, connect your GitHub account and pick this repo.
3. Set:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Under **Environment**, add these variables (see `.env.example` for details):
   - `AI_ENDPOINT` — e.g. `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` for Gemini
   - `AI_MODEL` — e.g. `gemini-2.0-flash`
   - `AI_API_KEY` — your own key from that provider (never share this)
   - `ALLOWED_ORIGIN` — your GitHub Pages URL, e.g. `https://your-username.github.io`
5. Click **Create Web Service**. After it builds, Render gives you a URL like
   `https://orbit-backend-xxxx.onrender.com`.
6. In Orbit's **Settings** tab, paste that URL into "Backend URL" and Save.

That's it — the Doubt Solver, AI Summary, and planner AI tips now go through
your backend, and your API key never leaves it.

**Note on the free tier:** Render's free web services sleep after ~15 minutes
of inactivity and take a few seconds to wake up on the next request — the
first AI reply after a break may be slow. That's normal and fine for this
project.

## Testing it locally first (optional)

```bash
cd backend
cp .env.example .env   # then fill in AI_API_KEY
npm install
npm start
```

Visit `http://localhost:3000/api/status` — it should report `{"configured":true,...}`.
Point Orbit's Settings → Backend URL at `http://localhost:3000` while testing locally.

## What this backend does and doesn't do

- It only ever forwards a `messages` array to your configured AI provider and
  returns the reply — it doesn't store anything, doesn't log conversation
  content, and has no database.
- It rate-limits each IP to 20 requests/minute to blunt casual abuse if the
  URL leaks.
- `ALLOWED_ORIGIN` restricts which website is allowed to call it — set it to
  your actual Pages URL once deployed, not `*`, for real use.
