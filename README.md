# 🪐 Orbit — Your AI Study Universe

Orbit is a premium, browser-based AI study command center built for a school **Work Education** activity (IT subject). It plans study time across *all* your subjects at once, explains its own reasoning, solves doubts instantly, plays focus music (including searching any song on demand), and tracks your progress — in a restrained, dark-cosmic dashboard designed to feel like a real product, not a demo.

Built with plain **HTML, CSS and JavaScript** (no framework, no build step, no C/C++/Java), so it runs directly in any browser and can be hosted online for free with GitHub Pages.

## ✨ Features

- **Multi-subject AI Study Planner** — add every subject you have an exam for. Orbit plans them *together*: subjects with a closer exam automatically get more of each day's study time, and a subject switches to pure revision on its last day. A **"How Orbit Thinks"** panel explains the reasoning in plain language for whichever mode applies — Last-Day Mode (≤1 day left), Learn → Practice → Revise (2–6 days), or Learn → Practice → Review → Spaced Revision → Mock Test (7+ days).
  - **Task breakdown** — each topic gets an estimated time, split into Pomodoro-style study/break sessions.
  - **Smart rescheduling** — the plan regenerates live from whatever's still unfinished, so a missed day rolls forward automatically.
  - **Spaced repetition** — rating a topic "hard" on completion schedules review reminders (1/3/7/16 days later) in the sidebar Review Queue.
  - **Urgency/Difficulty Matrix**, an auto **Summary**, and a real node-and-arrow **Flowchart** (SVG) of your plan.
  - **AI Topic Summary** — pick any topic and generate key points, formulas and common mistakes (falls back gracefully offline).
- **Instant Doubt Solver** — a chat interface with suggested prompts, copy/regenerate on any answer, code-block formatting, and an offline fallback engine when no AI key is connected.
- **Search & play any song** — a YouTube-powered search box plays instantly through YouTube's own embedded player, plus a categorized playlist (Deep Focus / Lo-Fi / Ambient / Classical / Nature) for direct audio links.
- **Dashboard** — a personal greeting, a live stat row (study time, streak, tasks, next exam), a mission-style exam countdown that escalates through four visual states as the date nears, a clock-time-sequenced "Today's Plan" timeline, and one-click quick actions.
- **Targets** (long-term goals with deadlines, editable, progress-tracked) and **Daily Goals** (a checklist with completion animation) as their own dedicated pages.
- **Progress** — overall + per-subject completion, a weekly activity chart, a subject-distribution chart, a study streak, and a planned-vs-actual time table.
- **Profile** — a name and avatar shown in your greeting and the sidebar, stored locally.
- **5 themes** (Cosmos, Nebula, Ocean, Forest, Sunset) with restrained, theme-aware animated backgrounds — space scenes (solar system, black hole, star cluster, meteor shower, orbit rings, wormhole) that change per tab in the space themes, and a firefly treeline / bubbling waves / drifting embers world for Forest / Ocean / Sunset.
- **Fully responsive** — the sidebar becomes a slide-in drawer on mobile, the topbar collapses, and every page reflows rather than just shrinking.
- **Works fully offline by default**, with optional online AI and music search when you're connected. Nothing is lost on refresh — everything persists in `localStorage`.

## 🚀 Running it

No installation needed — it's static HTML/CSS/JS.

**Locally:**
```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```
Or just double-click `index.html` (some browsers restrict `localStorage`/fonts on `file://`, so a local server is recommended).

**Free online hosting (GitHub Pages):**
1. Push this repo to GitHub (already done if you're reading this from the repo). Pages requires either a **public** repo, or GitHub Pro/Team/Enterprise for a private one.
2. Go to **Settings → Pages** in the repository.
3. Set **Source** to the `main` branch (or the branch you're using), root folder.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## 🔌 Connecting a real online AI (optional)

By default, Orbit's Doubt Solver, Planner and AI Summary run on a built-in offline engine, so the whole app works with **zero setup and no internet dependency** — good for a live classroom demo. The Settings page shows a clear "Connected" / "Not connected" badge without ever exposing your key.

Two genuinely free options (no credit card):

**Google AI Studio (Gemini):**
1. Go to `aistudio.google.com`, sign in, click **Get API key → Create API key**.
2. In Orbit's **Settings** tab: Endpoint = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, Model = `gemini-2.0-flash`, paste your key, **Save**.

**Groq:**
1. Go to `console.groq.com`, sign up, create an API key.
2. In Orbit's Settings: Endpoint = `https://api.groq.com/openai/v1/chat/completions`, Model = `llama-3.1-8b-instant`, paste your key, **Save**.

Your key is stored only in your browser's `localStorage` — never sent anywhere except the endpoint you configured, and never hard-coded in the source.

## 🗂️ Project structure

```
index.html             App shell: sidebar nav, topbar, and every page
css/style.css           Design tokens (5 themes), components, responsive layout
js/
  theme.js              Theme switching + persistence
  starfield.js           Animated canvas scenes: per-tab structures + per-theme motifs
  clock.js              The compact orbiting-dots clock in the topbar
  store.js                localStorage helper + activity/streak/study-time tracking
  aibridge.js              Optional online-AI connector (OpenAI-compatible)
  pins.js                  Pinned exam/assignment/event reminders
  targets.js               Long-term "Target" cards with countdown progress + edit
  goals.js                 Daily goal checklist
  subjects.js               Subject/topic CRUD (the planner's data model)
  analytics.js              Progress dashboard, time-tracking timers, difficulty matrix, charts
  srs.js                   Spaced-repetition review queue
  planner.js                Multi-subject plan generator, reasoning panel, AI summary, flowchart
  doubtsolver.js            Chat-based doubt solver (offline + online), copy/regenerate/prompts
  music.js                  Playlist + categories + YouTube search-and-play
  settings.js               AI connection settings form
  profile.js                 Display name + avatar
  app.js                    Navigation, topbar, dashboard, exam countdown, app bootstrap
```

## 🧠 How the planner thinks

Each topic gets an importance score: +2 for a trailing `*`, +1 for importance keywords (formula, theorem, law, definition, exam, PYQ, etc.), and a small penalty for very short lines. Across subjects, each active exam gets an "urgency" weight of `1 / (days left + 1)` — so a closer exam claims more of each day's study minutes automatically. A subject's last day before its exam becomes a forced revision day using its highest-weighted topics. Because the plan only ever pulls from topics not yet marked done, skipping a day requires no manual fix — the next generation simply carries those topics forward. The Study Planner's "How Orbit Thinks" panel narrates this reasoning live for your nearest exam.

This is the agent loop the activity asks you to demonstrate: **Input** (subjects, topics, exam dates, available time) → **Reasoning** (urgency, priority, difficulty, revision needs) → **Action** (schedule, priority topics, summaries, flowcharts, reminders) → **Feedback** (you complete tasks, ask doubts, rate difficulty) → **Adaptation** (the plan silently reflows around what's left).

---

*Made for a school Work Education (IT) activity — see `DOCUMENTATION_TEMPLATE.md` for a ready-to-fill project report.*
