const Achievements = (() => {
  const DEFS = [
    { id: 'first-mission', icon: '🚀', name: 'First Mission', desc: 'Complete your first mission.', check: (s, m) => m.some(x => x.items.length > 0 && x.items.every(i => i.done)) },
    { id: 'seven-day-orbit', icon: '🔥', name: '7-Day Orbit', desc: 'Study 7 days in a row.', check: () => Store.currentStreak() >= 7 },
    { id: 'subject-master', icon: '🪐', name: 'Subject Master', desc: 'Finish every topic in a subject.', check: s => s.some(x => x.topics.length > 0 && x.topics.every(t => t.done)) },
    { id: 'crunch-survivor', icon: '⏱', name: 'Crunch Survivor', desc: 'Finish all topics for a subject by its exam day.', check: s => s.some(x => x.topics.length > 0 && x.topics.every(t => t.done) && new Date(x.examDate + 'T00:00:00') >= new Date(new Date().toDateString())) },
  ];

  function render() {
    const el = document.getElementById('achievements-body');
    if (!el) return;
    const subjects = Subjects.load();
    const missions = Targets.load();
    el.innerHTML = DEFS.map(d => {
      const unlocked = d.check(subjects, missions);
      return `<div class="achievement ${unlocked ? 'unlocked' : ''}"><span class="ach-icon">${d.icon}</span><span class="ach-name">${d.name}</span><span class="ach-desc">${d.desc}</span></div>`;
    }).join('');
  }

  function init() {
    render();
    document.addEventListener('orbit:plan-updated', render);
    document.addEventListener('orbit:missions-changed', render);
  }

  return { init, render };
})();
