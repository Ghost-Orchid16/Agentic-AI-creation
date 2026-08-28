(() => {
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        document.getElementById('sidebar').classList.remove('open');
        document.dispatchEvent(new CustomEvent('orbit:tab-changed', { detail: { id: btn.dataset.tab } }));
      });
    });
  }

  function initSidebarToggle() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  function renderExamCountdown() {
    const hero = document.getElementById('exam-countdown-hero');
    const pins = Store.get('orbit_pins', []);
    const exams = pins.filter(p => p.type === 'exam');
    if (exams.length === 0) { hero.hidden = true; return; }
    const soonest = exams.reduce((a, b) => {
      const da = new Date(a.date + 'T00:00:00') - Date.now();
      const db = new Date(b.date + 'T00:00:00') - Date.now();
      return db < da ? b : a;
    });
    const target = new Date(soonest.date + 'T23:59:59');
    const diff = target - Date.now();
    if (diff < 0) { hero.hidden = true; return; }
    hero.hidden = false;
    const urgent = diff < 3 * 86400000;
    hero.classList.toggle('urgent', urgent);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    hero.innerHTML = `
      <div class="exam-hero-label">${urgent ? '🚨 EXAM COUNTDOWN' : '📝 Upcoming Exam'} — ${soonest.title}</div>
      <div class="exam-hero-timer">${days}d ${hours}h ${mins}m ${secs}s</div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Starfield.init();
    Clock.init();
    Quotes.init();
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
    initTabs();
    initSidebarToggle();

    renderExamCountdown();
    setInterval(renderExamCountdown, 1000);
    document.addEventListener('orbit:pins-changed', renderExamCountdown);
  });
})();
