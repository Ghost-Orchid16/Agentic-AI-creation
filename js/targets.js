const Targets = (() => {
  const KEY = 'orbit_missions';

  function load() { return Store.get(KEY, []); }
  function save(v) { Store.set(KEY, v); document.dispatchEvent(new CustomEvent('orbit:missions-changed')); }

  function daysLeft(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((new Date(dateStr + 'T00:00:00') - today) / 86400000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const missions = load();
    const list = document.getElementById('target-list');
    list.innerHTML = '';

    missions.sort((a, b) => daysLeft(a.deadline) - daysLeft(b.deadline)).forEach((m, idx) => {
      const done = m.items.filter(i => i.done).length;
      const pct = m.items.length ? Math.round((done / m.items.length) * 100) : 0;
      const dl = daysLeft(m.deadline);
      const complete = pct === 100;

      const card = document.createElement('div');
      card.className = 'mission-card' + (complete ? ' complete' : '');
      card.innerHTML = `
        <div class="mission-head">
          <span class="mission-number">MISSION ${String(idx + 1).padStart(2, '0')}</span>
          <button class="icon-remove" data-id="${m.id}" data-action="remove" title="Abandon mission">✕</button>
        </div>
        <h3 class="mission-title">${escapeHtml(m.name)}</h3>
        <div class="mission-stats">
          <span class="mission-pct">${pct}% COMPLETE</span>
          <span class="mission-days">${dl < 0 ? 'Deadline passed' : dl === 0 ? 'Due today' : dl + ' days remaining'}</span>
        </div>
        <div class="target-bar-track"><div class="target-bar-fill" style="width:${pct}%"></div></div>
        <ul class="mission-items">
          ${m.items.map(item => `
            <li class="${item.done ? 'done' : ''}">
              <input type="checkbox" data-action="toggle-item" data-mission="${m.id}" data-item="${item.id}" ${item.done ? 'checked' : ''}>
              <span>${escapeHtml(item.text)}</span>
            </li>
          `).join('') || '<li class="muted">No steps yet.</li>'}
        </ul>
        ${complete ? '<div class="mission-complete-badge">🏆 MISSION COMPLETE</div>' : ''}
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('[data-action="remove"]').forEach(btn =>
      btn.addEventListener('click', () => save(load().filter(m => m.id !== btn.dataset.id))));
    list.querySelectorAll('[data-action="toggle-item"]').forEach(cb =>
      cb.addEventListener('change', () => {
        const missions = load();
        const m = missions.find(x => x.id === cb.dataset.mission);
        const item = m && m.items.find(i => i.id === cb.dataset.item);
        if (item) item.done = cb.checked;
        if (cb.checked) Store.logActivity();
        save(missions);
      }));
  }

  function add(name, deadline, itemsText) {
    const items = itemsText.split('\n').map(l => l.trim()).filter(Boolean).map(text => ({ id: Store.uid(), text, done: false }));
    const missions = load();
    missions.push({ id: Store.uid(), name, deadline, items, createdAt: Date.now() });
    save(missions);
  }

  function init() {
    render();
    document.addEventListener('orbit:missions-changed', render);
    document.getElementById('target-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('target-name').value.trim();
      const deadline = document.getElementById('target-deadline').value;
      const items = document.getElementById('target-items').value;
      if (!name || !deadline) return;
      add(name, deadline, items);
      e.target.reset();
    });
  }

  return { init, load };
})();
