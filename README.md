# 🪐 Orbit — Study Planner AI Agent

Orbit is a browser-based AI study agent built for a school **Work Education** activity (IT subject). It combines an AI-style study planner, an instant doubt solver, a focus music player, exam pin reminders, a goals/targets tracker, a live clock, and a switchable dark "cosmos" theme — all in one dashboard.

Built with plain **HTML, CSS and JavaScript** (no framework, no build step, no C/C++/Java), so it runs directly in any browser and can be hosted online for free with GitHub Pages.

## ✨ Features

- **AI Study Planner** — paste your syllabus/topic list and tell Orbit how many days are left. It scores topics by importance (keywords like "formula", "theorem", "definition", or a trailing `*` you add) and builds a day-by-day plan. If only 1 day is left, it outputs a focused "high-yield" list of must-do topics instead of spreading things out. Also generates an auto **Summary** outline and a visual **Flowchart** of the study workflow.
- **Instant Doubt Solver** — a chat panel that solves maths expressions and common study questions offline, and can optionally call a real online AI model (see below) for full answers.
- **Focus Music Zone** — a built-in audio player with a starter playlist, play/pause/seek/volume, and the ability to add your own track URL — so you never have to leave the app to listen to music while studying.
- **Pinned Reminders** — creative countdown pins (e.g. "Exam in 3 days") that change color and pulse as the date gets closer.
- **Targets & Goals** — set a *Target* (a specific task + a time limit, with a live countdown/progress bar) and track your day's *Goals* as a simple checklist with a progress bar.
- **Fancy analog + digital clock** on the sidebar.
- **Dynamic cosmos background** — an animated starfield with twinkling stars and drifting nebula clouds on a `<canvas>`, with a parallax shift as you scroll — plus 5 switchable themes (Cosmos, Nebula Light, Ocean, Forest, Sunset), remembered per browser.
- **Works fully offline by default**, with an optional online AI connection for the Doubt Solver and Planner.

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
1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to **Settings → Pages** in the repository.
3. Set **Source** to the `main` branch (or the branch you're using), root folder.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## 🔌 Connecting a real online AI (optional)

By default, Orbit's Doubt Solver and Planner run on a built-in offline engine (maths solving + rule-based tips + the topic-scoring algorithm), so the whole app works with **zero setup and no internet dependency** — good for a live classroom demo.

If you want the Doubt Solver to answer *any* question using a real internet AI model:
1. Get an API key from an OpenAI-compatible provider.
2. Open the **Settings** tab in Orbit.
3. Enter the API endpoint (e.g. `https://api.openai.com/v1/chat/completions`), your model name, and your API key.
4. Save. The key is stored only in your browser's `localStorage` — it is never sent anywhere except the endpoint you typed.

## 🗂️ Project structure

```
index.html          Main page & layout
css/style.css        Cosmos theme system, animations, responsive layout
js/
  theme.js           Theme switching (5 themes) + persistence
  starfield.js        Animated canvas starfield with scroll parallax
  clock.js           Analog + digital clock
  store.js            Small localStorage helper
  aibridge.js          Optional online-AI connector (OpenAI-compatible)
  pins.js              Pinned exam/assignment/event reminders
  targets.js           "Target" cards with countdown progress bars
  goals.js             Daily goal checklist
  planner.js            The AI study-plan / summary / flowchart generator
  doubtsolver.js        Chat-based doubt solver (offline + online)
  music.js              Focus music player + playlist
  settings.js           AI connection settings form
  app.js               Tab navigation & app bootstrap
```

## 🧠 How the "AI" planner thinks

Since this activity is meant to explore how an agent plans and reasons, the planner uses a transparent, explainable heuristic (rather than a black box):

1. Each topic line gets a base importance score.
2. Score **+2** if you mark it with a trailing `*`.
3. Score **+1** if it contains an importance keyword (formula, theorem, law, definition, exam, PYQ, etc.).
4. Very short lines are scored slightly lower (likely not a full concept).
5. Topics are then either compressed into a single "high-yield" list (if you have 1 day left) or spread chronologically across the days you have, always reserving the final day for revision + a mock test.

If an online AI key is configured, the "✨ Refine with AI" button instead asks the connected model to produce the plan directly, and falls back to the heuristic if that call fails.

---

*Made for a school Work Education (IT) activity — see `DOCUMENTATION_TEMPLATE.md` for a ready-to-fill project report.*
