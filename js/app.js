(() => {
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        document.getElementById('sidebar').classList.remove('open');
      });
    });
  }

  function initSidebarToggle() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Starfield.init();
    Clock.init();
    Pins.init();
    Targets.init();
    Goals.init();
    Planner.init();
    DoubtSolver.init();
    Music.init();
    Settings.init();
    initTabs();
    initSidebarToggle();
  });
})();
