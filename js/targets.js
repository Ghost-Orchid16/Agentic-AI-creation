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
          <span class="t-actions">
            ${!t.done ? `<button class="icon-remove" data-id="${t.id}" data-action="edit" title="Edit">✎</button>` : ''}
            <button class="icon-remove" data-id="${t.id}" data-action="remove" title="Delete">✕</button>
          </span>
        </div>
        <div class="target-bar-track"><div class="target-bar-fill" style="width:${pct}%"></div></div>
        <small>${t.done ? 'Completed 🎉' : overdue ? 'Time is up — mark done or extend' : remainingMin + ' min left'}</small>
        ${!t.done ? `<div style="margin-top:6px"><button class="ghost-btn small" data-id="${t.id}" data-action="done" style="padding:4px 10px;font-size:.75rem">Mark done</button></div>` : ''}
        <form class="target-edit-form" data-id="${t.id}" hidden>
          <input type="text" value="${escapeHtml(t.name)}" data-role="edit-name" required>
          <input type="number" value="${t.minutes}" min="1" data-role="edit-minutes" style="width:90px" required>
          <button type="submit" class="primary-btn small">Save</button>
        </form>
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
    list.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const form = list.querySelector(`.target-edit-form[data-id="${btn.dataset.id}"]`);
        if (form) form.hidden = !form.hidden;
      });
    });
    list.querySelectorAll('.target-edit-form').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const ts = load();
        const t = ts.find(x => x.id === form.dataset.id);
        if (t) {
          t.name = form.querySelector('[data-role="edit-name"]').value.trim() || t.name;
          t.minutes = parseInt(form.querySelector('[data-role="edit-minutes"]').value, 10) || t.minutes;
          t.createdAt = Date.now();
        }
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
