(() => {
  const TAB_META = {
    dashboard: ['Command Center', 'Your mission control for today.'],
    planner: ['Study Planner', 'Plan every subject together, prioritised by urgency.'],
    doubt: ['AI Tutor', 'Ask anything — get an instant, clear answer.'],
    music: ['Focus Lab', 'Search any song, or press play on your playlist.'],
    targets: ['Missions', 'Longer-term objectives you are working toward.'],
    goals: ["Today's Objectives", "Today's checklist."],
    progress: ['Progress', 'Your study universe, and how it\'s actually going.'],
    settings: ['Settings', 'Profile, AI connection, and about Orbit.'],
  };

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function switchTab(tabId) {
    document.querySelectorAll('.nav-item[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
    window.scrollTo(0, 0);
    const meta = TAB_META[tabId];
    if (meta) {
      document.getElementById('topbar-title').textContent = meta[0];
      document.getElementById('topbar-desc').textContent = meta[1];
    }
    document.dispatchEvent(new CustomEvent('orbit:tab-changed', { detail: { id: tabId } }));
  }

  function initNav() {
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  }

  function initSidebarToggle() {
    document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  }

  function initPopovers() {
    const pairs = [['notif-btn', 'notif-popover'], ['theme-btn', 'theme-popover']];
    pairs.forEach(([btnId, popId]) => {
      const btn = document.getElementById(btnId);
      const pop = document.getElementById(popId);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const willOpen = pop.hidden;
        pairs.forEach(([, otherId]) => document.getElementById(otherId).hidden = true);
        pop.hidden = !willOpen;
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
    document.addEventListener('click', e => {
      pairs.forEach(([btnId, popId]) => {
        const pop = document.getElementById(popId);
        if (!pop.hidden && !pop.contains(e.target) && e.target.id !== btnId) pop.hidden = true;
      });
    });
    document.getElementById('topbar-profile-btn').addEventListener('click', () => switchTab('settings'));
  }

  function initQuickActions() {
    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'goto-planner') { switchTab('planner'); document.getElementById('subject-name').focus(); }
        if (action === 'goto-doubt') { switchTab('doubt'); document.getElementById('chat-input').focus(); }
        if (action === 'goto-music') { switchTab('music'); }
        if (action === 'goto-goals') { switchTab('goals'); document.getElementById('goal-text').focus(); }
      });
    });
  }

  function nearestExamPin() {
    const exams = Pins.load().filter(p => p.type === 'exam').filter(p => Pins.daysLeft(p.date) >= 0);
    if (exams.length === 0) return null;
    return exams.reduce((a, b) => (Pins.daysLeft(a.date) < Pins.daysLeft(b.date) ? a : b));
  }

  function examStateFor(days) {
    if (days <= 0) return 'critical';
    if (days <= 2) return 'urgent';
    if (days <= 6) return 'attention';
    return 'normal';
  }

  function renderHeroMission() {
    const el = document.getElementById('hero-mission');
    const pin = nearestExamPin();
    if (!pin) { el.innerHTML = '<p class="muted">Pin an exam to see your next mission here.</p>'; document.getElementById('notif-dot').hidden = true; return; }
    const days = Pins.daysLeft(pin.date);
    const state = examStateFor(days);
    document.getElementById('notif-dot').hidden = !(state === 'urgent' || state === 'critical');
    el.className = `hero-mission state-${state}`;
    el.innerHTML = `
      <span class="hero-eyebrow">${state === 'critical' ? 'Exam Today' : 'Your Next Mission'}</span>
      <span class="hero-subject">${escapeHtml(pin.title)}</span>
      <span class="hero-days">${days === 0 ? 'TODAY' : days + ' DAY' + (days === 1 ? '' : 'S') + ' LEFT'}</span>
    `;
  }

  function renderRecommendation() {
    const el = document.getElementById('recommendation-body');
    const rec = Recommendation.bestNext();
    if (!rec) { el.innerHTML = '<p class="muted">Add a subject with topics in Study Planner, and Orbit will recommend what to study next.</p>'; return; }
    el.innerHTML = `
      <div class="rec-topic">${escapeHtml(rec.topicText)}</div>
      <div class="rec-meta">${escapeHtml(rec.subjectName)} · ${rec.minutes} minutes</div>
      <p class="rec-reason">${escapeHtml(rec.reason)}</p>
      <button class="btn primary-btn" id="start-rec-session-btn">Start Recommended Session</button>
    `;
    document.getElementById('start-rec-session-btn').addEventListener('click', () => {
      switchTab('music');
      document.dispatchEvent(new CustomEvent('orbit:start-focus-session', { detail: { subjectId: rec.subjectId, topicId: rec.topicId } }));
    });
  }

  function renderExamRadarWidget() {
    const el = document.getElementById('exam-radar');
    const radar = Recommendation.examRadar();
    if (radar.length === 0) { el.innerHTML = '<p class="muted">Add subjects with exam dates in Study Planner to see them here.</p>'; return; }
    el.innerHTML = radar.map(r => `
      <div class="radar-row" data-subject="${r.id}">
        <span class="radar-name">${escapeHtml(r.name)}</span>
        <span class="radar-days">${r.daysLeft}d</span>
        <span class="radar-tag tag-${r.urgency.toLowerCase()}">${r.urgency}</span>
      </div>
    `).join('');
    el.querySelectorAll('.radar-row').forEach(row => row.addEventListener('click', () => switchTab('planner')));
  }

  function renderBriefingWidget() {
    const el = document.getElementById('briefing-body');
    const b = Recommendation.briefing();
    el.innerHTML = `
      ${b.pressure.map(p => `<div class="briefing-row"><span>${escapeHtml(p.name)}</span><span class="radar-tag tag-${p.urgency.toLowerCase()}">${p.urgency}</span></div>`).join('') || '<p class="muted">No active subjects.</p>'}
      <div class="briefing-divider"></div>
      <div class="briefing-row"><span>Today's priority</span><strong>${b.priority ? escapeHtml(b.priority.topicText) : '—'}</strong></div>
      <div class="briefing-row"><span>Available time</span><strong>${b.availableMinutes} min</strong></div>
    `;
  }

  function renderCrunchBanner() {
    const el = document.getElementById('crunch-banner');
    const subjects = Recommendation.crunchSubjects();
    if (subjects.length === 0) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = subjects.map(s => {
      const plan = Recommendation.crunchPlan(s);
      const list = (arr, label) => arr.length ? `<div class="crunch-cat"><span class="crunch-cat-label">${label}</span>${arr.map(t => `<span class="topic-chip w-high">${escapeHtml(t.text)}</span>`).join('')}</div>` : '';
      return `
        <div class="crunch-header">🚨 CRUNCH MODE — ${escapeHtml(plan.subjectName)}</div>
        <p class="muted" style="margin:4px 0 10px">Your exam is imminent. Orbit has prioritized the highest-value material.</p>
        ${list(plan.mustKnow, 'MUST KNOW')}
        ${list(plan.shouldKnow, 'SHOULD KNOW')}
        ${list(plan.ifTime, 'IF TIME REMAINS')}
      `;
    }).join('<hr style="border-color:var(--border);margin:14px 0">');
  }

  function renderTodayTimeline() {
    const el = document.getElementById('today-timeline');
    if (!el) return;
    const items = Planner.getTodayTimeline();
    if (items.length === 0) { el.innerHTML = '<p class="muted">No study sessions planned for today yet — add a subject in Study Planner and generate a plan.</p>'; return; }
    el.innerHTML = items.map(it => `
      <div class="timeline-item ${it.done ? 'done' : ''}">
        <div class="timeline-time">${it.time}</div>
        <div class="timeline-body">
          <div class="t-subject">${escapeHtml(it.subjectName)}</div>
          <div class="t-topic">${escapeHtml(it.topicText)} · ${it.minutes} min</div>
        </div>
        <div class="timeline-meta">
          <span class="diff-tag ${it.weight >= 4 ? 'w-high' : it.weight === 3 ? 'w-mid' : 'w-low'}">${it.weight >= 4 ? 'High' : it.weight === 3 ? 'Med' : 'Low'}</span>
          <input type="checkbox" class="check-circle" data-subject="${it.subjectId}" data-topic="${it.topicId}" ${it.done ? 'checked' : ''} aria-label="Mark ${escapeHtml(it.topicText)} complete">
        </div>
      </div>
    `).join('');
    el.querySelectorAll('.check-circle').forEach(cb => cb.addEventListener('change', () => Subjects.toggleDone(cb.dataset.subject, cb.dataset.topic, cb.checked)));
  }

  function renderStatRow() {
    const studyMin = Store.studyMinutesOn(Store.todayKey());
    document.getElementById('stat-study-time').textContent = studyMin >= 60 ? `${Math.floor(studyMin / 60)}h ${studyMin % 60}m` : `${studyMin}m`;
    document.getElementById('stat-streak').textContent = Store.currentStreak();
    const goals = Goals.todays();
    document.getElementById('stat-tasks').textContent = `${goals.filter(g => g.done).length}/${goals.length}`;
    const pin = nearestExamPin();
    if (pin) {
      const days = Pins.daysLeft(pin.date);
      document.getElementById('stat-next-exam').textContent = days === 0 ? 'Today' : `${days}d`;
      document.getElementById('stat-next-exam-sub').textContent = pin.title;
    } else {
      document.getElementById('stat-next-exam').textContent = '—';
      document.getElementById('stat-next-exam-sub').textContent = 'no exams pinned';
    }
  }

  function renderGreeting() {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    document.getElementById('greeting-title').textContent = `Good ${part}, ${escapeHtml(Profile.get().name)} 👋`;
  }

  function renderInsights() {
    const el = document.getElementById('insights-body');
    if (!el) return;
    el.innerHTML = Recommendation.insights().map(i => `<p class="insight-line">✦ ${escapeHtml(i)}</p>`).join('');
  }

  function updatePlanets() {
    if (typeof Scene3D !== 'undefined') Scene3D.setPlanets(Subjects.summaries());
  }

  function refreshDashboardData() {
    renderStatRow();
    renderTodayTimeline();
    renderRecommendation();
    renderExamRadarWidget();
    renderBriefingWidget();
    renderCrunchBanner();
    renderInsights();
    updatePlanets();
  }

  document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    if (typeof THREE !== 'undefined') Scene3D.init('scene3d-canvas');
    Clock.init();
    Profile.init();
    Pins.init();
    Targets.init();
    Goals.init();
    Subjects.init();
    Analytics.init();
    SRS.init();
    KnowledgeMap.init();
    Quiz.init();
    FocusSession.init();
    Achievements.init();
    Planner.init();
    DoubtSolver.init();
    Music.init();
    Settings.init();
    initNav();
    initSidebarToggle();
    initPopovers();
    initQuickActions();

    document.getElementById('optimize-week-btn')?.addEventListener('click', () => {
      Planner.generateAndRender();
      switchTab('planner');
    });

    document.addEventListener('orbit:planet-clicked', e => switchTab('planner'));

    renderGreeting();
    renderHeroMission();
    refreshDashboardData();
    setInterval(renderHeroMission, 1000);
    document.addEventListener('orbit:pins-changed', () => { renderHeroMission(); refreshDashboardData(); });
    document.addEventListener('orbit:plan-updated', refreshDashboardData);
    document.addEventListener('orbit:profile-changed', renderGreeting);

    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
})();
