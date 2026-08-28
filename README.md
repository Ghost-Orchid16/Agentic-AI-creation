# 🪐 Orbit — Study Planner AI Agent

Orbit is a browser-based AI study agent built for a school **Work Education** activity (IT subject). It plans study time across *all* your subjects at once, solves doubts instantly, plays focus music (including searching any song on demand), and tracks your progress — all in one dynamic, themeable dashboard.

Built with plain **HTML, CSS and JavaScript** (no framework, no build step, no C/C++/Java), so it runs directly in any browser and can be hosted online for free with GitHub Pages.

## ✨ Features

- **Multi-subject AI Study Planner** — add every subject you have an exam for (with its own exam date and topic list). Orbit plans them *together*: subjects with a closer exam automatically get more of each day's study time, and a subject switches to pure revision on its last day before the exam. Includes:
  - **Task breakdown** — each topic gets an estimated time and is split into Pomodoro-style study/break sessions.
  - **Smart rescheduling** — the plan is generated live from whatever topics are still unfinished, so a missed day just rolls forward automatically, no manual re-planning needed.
  - **Spaced repetition** — rating a topic "hard" when you finish it schedules automatic review reminders (1/3/7/16 days later) in the sidebar Review Queue.
  - **Urgency/Difficulty Matrix** — a 2×2 view (Focus First / Build Mastery / Quick Polish / Later) built from each topic's importance score and your own difficulty rating.
  - **Summary** and **Flowchart** views auto-generated from your plan.
- **Instant Doubt Solver** — a chat panel that solves maths expressions and common study questions offline, and can optionally call a real online AI model for full answers.
- **Search & play any song** — a built-in YouTube-powered search box plays music instantly through YouTube's own embedded player (nothing downloads), plus a separate custom playlist for direct audio links.
- **Exam Countdown Mode** — a live, second-by-second countdown banner for your nearest pinned exam that turns urgent (and pulses) inside the final 3 days.
- **Pinned Reminders** — creative countdown pins (e.g. "Exam in 3 days") that change color and pulse as the date gets closer.
- **Progress Dashboard** — overall and per-subject completion bars, a study streak counter, and a planned-vs-actual time table.
- **Time Analytics** — a ⏱ timer on every topic in your Day Plan logs real study time against the plan's estimate.
- **Targets & Goals** — set a *Target* (a task + a time limit, with a live countdown/progress bar) and track your day's *Goals* as a checklist with a progress bar.
- **A different motivational quote** every time you open Orbit.
- **Creative "Orbit" clock** — a glowing core with three dots orbiting it like planets (hour/minute/second), instead of a plain clock face.
- **Dynamic, theme-aware backgrounds** — an animated `<canvas>` scene that changes with *both* the tab you're on and the theme you pick: a solar system on the Dashboard, a black hole on the Study Planner, a star cluster on Doubt Solver, a meteor shower on Music, orbit rings on Progress, and a wormhole on Settings — all in the Cosmos/Nebula themes. Switch to **Forest** and it becomes a firefly-lit treeline; **Ocean** becomes rising bubbles and waves; **Sunset** becomes drifting embers under a warm glow. 5 themes total, remembered per browser.
- **Works fully offline by default**, with optional online AI and music search for when you're connected.

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

By default, Orbit's Doubt Solver and Planner run on a built-in offline engine, so the whole app works with **zero setup and no internet dependency** — good for a live classroom demo.

Two genuinely free options (no credit card):

**Google AI Studio (Gemini):**
1. Go to `aistudio.google.com`, sign in, click **Get API key → Create API key**.
2. In Orbit's **Settings** tab: Endpoint = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, Model = `gemini-2.0-flash`, paste your key, **Save**.

**Groq:**
1. Go to `console.groq.com`, sign up, create an API key.
2. In Orbit's Settings: Endpoint = `https://api.groq.com/openai/v1/chat/completions`, Model = `llama-3.1-8b-instant`, paste your key, **Save**.

Your key is stored only in your browser's `localStorage` — never sent anywhere except the endpoint you configured.

## 🗂️ Project structure

```
index.html            Main page & layout
css/style.css          Theme system, scene overlays, animations, responsive layout
js/
  theme.js             Theme switching (5 themes) + persistence
  starfield.js          Animated canvas scenes: per-tab structures + per-theme motifs
  clock.js             The orbiting-dots clock
  quotes.js             Daily motivational quote picker
  store.js               localStorage helper + activity/streak tracking
  aibridge.js             Optional online-AI connector (OpenAI-compatible)
  pins.js                 Pinned exam/assignment/event reminders
  targets.js              "Target" cards with countdown progress bars
  goals.js                Daily goal checklist
  subjects.js              Subject/topic CRUD (the planner's data model)
  analytics.js             Progress dashboard, time tracking timers, difficulty matrix
  srs.js                  Spaced-repetition review queue
  planner.js               Multi-subject master plan generator (day plan/summary/flowchart)
  doubtsolver.js           Chat-based doubt solver (offline + online)
  music.js                 YouTube search-and-play + custom playlist
  settings.js              AI connection settings form
  app.js                  Tab navigation, exam countdown, app bootstrap
```

## 🧠 How the planner thinks

Each topic gets an importance score: +2 for a trailing `*`, +1 for importance keywords (formula, theorem, law, definition, exam, PYQ, etc.), and a small penalty for very short lines. Across subjects, each active exam gets an "urgency" weight of `1 / (days left + 1)` — so a closer exam claims more of each day's study minutes automatically. A subject's last day before its exam becomes a forced revision day using its highest-weighted topics. Because the plan only ever pulls from topics not yet marked done, skipping a day requires no manual fix — the next generation simply carries those topics forward.

If an online AI key is configured, "✨ Get AI tips for today" asks the connected model for extra practical tips on top of the heuristic plan.

---

*Made for a school Work Education (IT) activity — see `DOCUMENTATION_TEMPLATE.md` for a ready-to-fill project report.*
