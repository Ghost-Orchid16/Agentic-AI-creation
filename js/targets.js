const Targets = (() => {
  const KEY = 'orbit_targets';

  function load() { return Store.get(KEY, []); }
  function save(v) { Store.set(KEY, v); }

  function render() {
    const targets = load();
    const list = document.getElementById('target-list');
    list.innerHTML = '';
    const now = Date.now();

    targets.forEach(t => {
      const total = t.minutes * 60000;
      const elapsed = now - t.createdAt;
      const pct = t.done ? 100 : Math.min(100, (elapsed / total) * 100);
      const remainingMs = Math.max(0, total - elapsed);
      const remainingMin = Math.ceil(remainingMs / 60000);
      const overdue = !t.done && elapsed >= total;

      const card = document.createElement('div');
      card.className = 'target-card' + (t.done ? ' done' : '');
      card.innerHTML = `
        <div class="t-top">
          <span>🎯 ${escapeHtml(t.name)}</span>
          <button class="pin-remove" data-id="${t.id}" data-action="remove">✕</button>
        </div>
        <div class="target-bar-track"><div class="target-bar-fill" style="width:${pct}%"></div></div>
        <small>${t.done ? 'Completed 🎉' : overdue ? 'Time is up — mark done or extend' : remainingMin + ' min left'}</small>
        ${!t.done ? `<div style="margin-top:6px"><button class="ghost-btn small" data-id="${t.id}" data-action="done" style="padding:4px 10px;font-size:.75rem">Mark done</button></div>` : ''}
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', () => {
        save(load().filter(t => t.id !== btn.dataset.id));
        render();
      });
    });
    list.querySelectorAll('[data-action="done"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ts = load();
        const t = ts.find(x => x.id === btn.dataset.id);
        if (t) t.done = true;
        save(ts);
        render();
      });
    });
  }

  function add(name, minutes) {
    const targets = load();
    targets.push({ id: Store.uid(), name, minutes, createdAt: Date.now(), done: false });
    save(targets);
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function init() {
    render();
    setInterval(render, 15000);
    document.getElementById('target-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('target-name').value.trim();
      const minutes = parseInt(document.getElementById('target-minutes').value, 10);
      if (!name || !minutes) return;
      add(name, minutes);
      e.target.reset();
    });
  }

  return { init };
})();
