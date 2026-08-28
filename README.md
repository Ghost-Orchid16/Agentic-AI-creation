# 🪐 Orbit — Your AI Study Universe

Orbit is an AI study command center built for a school **Work Education** activity (IT subject). It treats studying as a small solar system: **subjects are planets**, closer to the core when their exam is sooner and warmer-colored when they need attention; **Orbit's Analysis** engine reasons over your real data — exam dates, topic priority, difficulty, time available — to recommend exactly what to study next and why; and a full agent loop (input → reasoning → action → feedback → adaptation) runs through every page, not just the planner.

Built with **HTML, CSS, JavaScript and Three.js** on the frontend (no framework, no build step — deploys free on GitHub Pages), plus a small **Node/Express backend** that holds your AI API key server-side so it's never exposed in the browser or the repo.

## ✨ Features

**Command Center (dashboard)**
- A personal greeting and "Your Next Mission" hero pulled from your nearest pinned exam.
- **Orbit's Analysis** — the single best topic to study right now, computed from exam urgency, topic priority and your difficulty ratings, with a plain-language reason and a one-click **Start Recommended Session**.
- **Orbit's Briefing** — exam pressure (High/Medium/Low) per subject, today's priority, and available study time.
- **Exam Radar** — every subject's urgency at a glance, click through to plan it.
- **Crunch Mode** — automatically appears when an exam is ≤1 day away, splitting remaining topics into Must Know / Should Know / If Time Remains.
- A clock-time-sequenced **Today's Plan** timeline and one-click quick actions.

**Study Planner** — add every subject you have an exam for; Orbit plans them *together*, giving more of each day to whichever exam is closer. Includes a **"How Orbit Thinks"** panel narrating the active mode (Last-Day Mode / Learn→Practice→Revise / the full 7+-day spaced pattern), Pomodoro task breakdown, smart self-rescheduling, spaced repetition, an urgency/difficulty Matrix, an auto Summary, a real SVG node-and-arrow Flowchart, an AI Topic Summary generator, and a **Knowledge Map** (✓ mastered / ◐ learning / ○ not started / ● weak) you can click into.

**AI Tutor** — a chat tutor with a context panel (pick the subject/topic you're on), **Socratic Mode** (guides with questions instead of answers), photo-of-a-problem upload for vision-capable models, suggested actions (Explain simply, Step-by-step, **Quiz me**, Find my mistake…), copy/regenerate on any answer, and code-block formatting.

**Focus Lab** — a standalone 25-minute **Focus Session** timer tied to a real topic (auto-fills from Orbit's recommendation), a categorized playlist (Deep Focus / Lo-Fi / Ambient / Classical / Nature), and a YouTube-powered search-and-play box.

**Missions** (long-term goals) — a title, a deadline, and a checklist of steps, with live % complete and a mission-complete celebration. **Today's Objectives** (daily checklist) rounds out personal tracking.

**Progress** — your subjects rendered as an interactive 3D **Study Universe**, **Orbit Insights** (real week-over-week deltas — "Physics study time up 18%", not fabricated praise), a weekly activity chart, subject distribution, and meaningful **Achievements** computed from your actual history.

**5 environments** (Cosmos, Nebula, Ocean, Forest, Sunset) — a real, continuously-rendered Three.js scene (not a static wallpaper): starfield + nebula dust, a pulsing Orbit Core, and — on the Command Center and Progress pages — clickable subject planets, all reduced-motion- and low-power-aware.

## 🚀 Running it

**Frontend (static, no build step):**
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
Or just double-click `index.html`. Free hosting: push to GitHub, enable **Settings → Pages** (public repo, or GitHub Pro/Team for private), source = `main` branch, root folder.

**Backend (optional, for real AI):** see [`backend/BACKEND.md`](backend/BACKEND.md) — a few minutes to deploy free on Render.

## 🔌 Connecting real AI

Orbit works fully offline out of the box (maths solving, the whole recommendation/planning engine, everything except free-text chat and AI-generated summaries/quizzes). To connect a real model:

1. Deploy `backend/` (see `backend/BACKEND.md`) to a free host like Render, with your own API key from an OpenAI-compatible provider (Google AI Studio's Gemini and Groq both have genuinely free tiers) set as a **server-side** environment variable.
2. In Orbit's **Settings** tab, paste your backend's URL.

Your API key lives only on that backend — never in the browser, never in `localStorage`, never in this repository. Settings shows a clear **● Orbit AI Online** / **○ AI connection unavailable** status, and every AI feature (Doubt Solver, AI Summary, planner tips, Quiz) fails gracefully to an honest offline message rather than faking a response when AI isn't connected.

## 🎨 Environment / asset strategy

All visuals — the starfield, nebula dust, the Orbit Core, subject planets, and each theme's motif (rising ocean particles, forest fireflies, drifting sunset embers) — are procedurally generated in `js/scene3d.js` with Three.js. No photographic or third-party image assets are used, so there are no licensing concerns to track. External libraries loaded via CDN: [Three.js](https://threejs.org/) (MIT license) for the 3D scene, [Lucide](https://lucide.dev/) (ISC license) for the icon system.

## 🗂️ Project structure

```
index.html               App shell: sidebar nav, topbar, every page
css/style.css              Design tokens (5 themes), glass panels, responsive layout
backend/                  Node/Express AI proxy (see BACKEND.md) — separate deployment
js/
  theme.js                Theme switching + persistence
  scene3d.js                Three.js environment: starfield, core, subject planets
  clock.js                 Compact orbiting-dots clock in the topbar
  store.js                   localStorage helper + activity/streak/study-time tracking
  aibridge.js                 Calls the backend's /api/chat — no key in the frontend
  pins.js                     Pinned exam/assignment/event reminders
  targets.js                  Missions: deadline + checklist, % complete
  goals.js                    Today's Objectives (daily checklist)
  subjects.js                  Subject/topic CRUD — the planner's core data model
  analytics.js                 Progress charts, time-tracking timers, difficulty matrix
  srs.js                      Spaced-repetition review queue
  recommendation.js             Orbit's Analysis / Briefing / Exam Radar / Crunch Mode / Insights
  knowledgemap.js               Per-subject topic tree with mastery states
  quiz.js                      AI-generated quiz (honestly gated on a real AI connection)
  focussession.js                Standalone Focus Session timer
  achievements.js                Achievements computed from real state
  planner.js                    Multi-subject plan generator, reasoning panel, flowchart
  doubtsolver.js                 AI Tutor: chat, Socratic mode, image upload, context
  music.js                      Focus Lab playlist + categories + YouTube search
  settings.js                   Backend URL + AI status
  profile.js                     Display name + avatar
  app.js                        Navigation, dashboard rendering, app bootstrap
```

## 🧠 The agent loop

This is the concept the activity asks you to demonstrate, made literal in the product:

**Input** — subjects, topics, exam dates, available time, difficulty ratings, goals.
**Reasoning** — `recommendation.js` scores every undone topic by exam urgency (`1/(daysLeft+1)`), importance weight, and difficulty; `planner.js` narrates the active strategy live in "How Orbit Thinks".
**Action** — a day-by-day schedule, a single best-next-topic recommendation, AI summaries, a flowchart, reminders, Crunch Mode.
**Feedback** — you complete sessions, ask doubts, take quizzes, rate difficulty.
**Adaptation** — the plan and recommendation are recomputed live from whatever's still undone, so nothing needs manual re-planning; a poor quiz score bumps a topic to "weak" and queues it for revision automatically.

---

*Made for a school Work Education (IT) activity — see `DOCUMENTATION_TEMPLATE.md` for a ready-to-fill project report.*
