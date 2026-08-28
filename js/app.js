(() => {
  const TAB_META = {
    dashboard: ['Dashboard', 'Your mission control for today.'],
    planner: ['Study Planner', 'Plan every subject together, prioritised by urgency.'],
    doubt: ['Doubt Solver', 'Ask anything — get an instant, clear answer.'],
    music: ['Focus Music', 'Search any song, or press play on your playlist.'],
    targets: ['Targets', 'Longer-term objectives you are working toward.'],
    goals: ['Daily Goals', "Today's checklist."],
    progress: ['Progress', 'How your studying is actually going.'],
    settings: ['Settings', 'Profile, AI connection, and about Orbit.'],
  };

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
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function initSidebarToggle() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  function initPopovers() {
    const pairs = [
      ['notif-btn', 'notif-popover'],
      ['theme-btn', 'theme-popover'],
    ];
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
        if (action === 'goto-music') {
          switchTab('music');
          const playBtn = document.getElementById('btn-play');
          if (playBtn && playBtn.textContent.trim() === '▶') playBtn.click();
        }
        if (action === 'goto-goals') { switchTab('goals'); document.getElementById('goal-text').focus(); }
      });
    });
  }

  function nearestExamPin() {
    const exams = Pins.load().filter(p => p.type === 'exam').filter(p => Pins.daysLeft(p.date) >= 0);
    if (exams.length === 0) return null;
    return exams.reduce((a, b) => Pins.daysLeft(a.date) < Pins.daysLeft(b.date) ? a : b);
  }

  function examStateFor(days) {
    if (days <= 0) return 'critical';
    if (days <= 2) return 'urgent';
    if (days <= 6) return 'attention';
    return 'normal';
  }

  function renderExamCountdown() {
    const hero = document.getElementById('exam-countdown-hero');
    const alertEl = document.getElementById('pinned-alert');
    const pin = nearestExamPin();
    if (!pin) { hero.hidden = true; alertEl.hidden = true; document.getElementById('notif-dot').hidden = true; return; }

    const target = new Date(pin.date + 'T23:59:59');
    const diff = target - Date.now();
    const days = Math.max(0, Math.floor(diff / 86400000));
    const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000));
    const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const state = examStateFor(days);

    hero.hidden = false;
    hero.className = `exam-hero state-${state}`;
    document.getElementById('notif-dot').hidden = !(state === 'urgent' || state === 'critical');

    const subjects = Subjects.load();
    const matched = subjects.find(s => pin.title.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(pin.title.toLowerCase()));
    let progressPct, progressLabel;
    if (matched && matched.topics.length) {
      progressPct = Math.round((matched.topics.filter(t => t.done).length / matched.topics.length) * 100);
      progressLabel = `${progressPct}% of ${matched.name} topics covered`;
    } else {
      progressPct = Math.max(4, Math.min(100, Math.round(100 - (days / 14) * 100)));
      progressLabel = `${days} day${days === 1 ? '' : 's'} remaining`;
    }

    hero.innerHTML = `
      <div class="exam-hero-left">
        <div class="exam-hero-eyebrow">${state === 'critical' ? 'Exam Today' : 'Next Exam'}</div>
        <div class="exam-hero-subject">${escapeHtml(pin.title)}</div>
        <div class="exam-hero-meta">${new Date(pin.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>
      <div style="min-width:200px">
        <div class="exam-hero-timer">${days.toString().padStart(2,'0')}d ${hours.toString().padStart(2,'0')}h ${mins.toString().padStart(2,'0')}m</div>
        <div class="exam-hero-bar-track"><div class="exam-hero-bar-fill" style="width:${progressPct}%"></div></div>
        <div class="muted" style="font-size:0.72rem;margin-top:4px">${progressLabel}</div>
      </div>
    `;

    if (state === 'urgent' || state === 'critical') {
      alertEl.hidden = false;
      alertEl.className = 'pinned-alert' + (state === 'critical' ? ' critical' : '');
      alertEl.innerHTML = `<span>📌</span><span><strong>${state === 'critical' ? 'Exam today' : `Exam in ${days} day${days === 1 ? '' : 's'}`}</strong> — "${escapeHtml(pin.title)}". High-priority revision recommended.</span><span class="spacer"></span>`;
      const cta = document.createElement('button');
      cta.className = 'btn primary-btn small';
      cta.textContent = 'View Study Plan';
      cta.addEventListener('click', () => switchTab('planner'));
      alertEl.appendChild(cta);
    } else {
      alertEl.hidden = true;
    }
  }

  function renderTodayTimeline() {
    const el = document.getElementById('today-timeline');
    if (!el) return;
    const items = Planner.getTodayTimeline();
    if (items.length === 0) {
      el.innerHTML = '<p class="muted">No study sessions planned for today yet — add a subject in Study Planner and generate a plan.</p>';
      return;
    }
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
    el.querySelectorAll('.check-circle').forEach(cb =>
      cb.addEventListener('change', () => Subjects.toggleDone(cb.dataset.subject, cb.dataset.topic, cb.checked)));
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
    const name = Profile.get().name;
    document.getElementById('greeting-title').textContent = `Good ${part}, ${name} 👋`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function refreshDashboardData() {
    renderStatRow();
    renderTodayTimeline();
  }

  document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Starfield.init();
    Clock.init();
    Profile.init();
    Pins.init();
    Targets.init();
    Goals.init();
    Subjects.init();
    Analytics.init();
    SRS.init();
    Planner.init();
    DoubtSolver.init();
    Music.init();
    Settings.init();
    initNav();
    initSidebarToggle();
    initPopovers();
    initQuickActions();

    renderGreeting();
    renderExamCountdown();
    refreshDashboardData();
    setInterval(renderExamCountdown, 1000);
    document.addEventListener('orbit:pins-changed', () => { renderExamCountdown(); refreshDashboardData(); });
    document.addEventListener('orbit:plan-updated', refreshDashboardData);
    document.addEventListener('orbit:profile-changed', renderGreeting);
  });
})();
