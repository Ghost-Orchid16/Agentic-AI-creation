const Goals = (() => {
  const KEY = 'orbit_goals';

  function loadAll() { return Store.get(KEY, {}); }
  function saveAll(v) { Store.set(KEY, v); }
  function todays() {
    const all = loadAll();
    return all[Store.todayKey()] || [];
  }
  function setTodays(list) {
    const all = loadAll();
    all[Store.todayKey()] = list;
    saveAll(all);
  }

  function render() {
    const list = todays();
    const ul = document.getElementById('goal-list');
    ul.innerHTML = '';
    list.forEach(g => {
      const li = document.createElement('li');
      li.className = 'goal-item' + (g.done ? ' done' : '');
      li.innerHTML = `
        <input type="checkbox" ${g.done ? 'checked' : ''} data-id="${g.id}">
        <span class="g-text">${escapeHtml(g.text)}</span>
        <button class="goal-remove" data-id="${g.id}">✕</button>
      `;
      ul.appendChild(li);
    });

    ul.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const l = todays();
        const g = l.find(x => x.id === cb.dataset.id);
        if (g) g.done = cb.checked;
        if (cb.checked) Store.logActivity();
        setTodays(l);
        render();
      });
    });
    ul.querySelectorAll('.goal-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        setTodays(todays().filter(x => x.id !== btn.dataset.id));
        render();
      });
    });

    const total = list.length;
    const done = list.filter(g => g.done).length;
    document.getElementById('goal-progress-bar').style.width = total ? `${(done / total) * 100}%` : '0%';
  }

  function add(text) {
    const list = todays();
    list.push({ id: Store.uid(), text, done: false });
    setTodays(list);
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function init() {
    render();
    document.getElementById('goal-form').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('goal-text');
      const val = input.value.trim();
      if (!val) return;
      add(val);
      input.value = '';
    });
  }

  return { init };
})();
