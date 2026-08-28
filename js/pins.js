const Pins = (() => {
  const KEY = 'orbit_pins';
  const TYPE_ICON = { exam: '📝', assignment: '📄', event: '📅' };

  function load() {
    let pins = Store.get(KEY, null);
    if (!pins) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      pins = [{ id: Store.uid(), title: 'Exam', type: 'exam', date: d.toISOString().slice(0, 10) }];
      Store.set(KEY, pins);
    }
    return pins;
  }
  function save(pins) { Store.set(KEY, pins); }

  function daysLeft(dateStr) {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateStr + 'T00:00:00');
    return Math.round((target - today) / 86400000);
  }

  function urgencyClass(days) {
    if (days <= 1) return 'urgency-high';
    if (days <= 4) return 'urgency-mid';
    return 'urgency-low';
  }

  function render() {
    const pins = load().sort((a, b) => daysLeft(a.date) - daysLeft(b.date));
    const list = document.getElementById('pin-list');
    const dash = document.getElementById('dash-pins');
    list.innerHTML = '';
    dash.innerHTML = '';

    if (pins.length === 0) {
      list.innerHTML = '<p class="muted" style="font-size:.8rem">No pins yet. Add one!</p>';
    }

    pins.forEach(p => {
      const d = daysLeft(p.date);
      const label = d < 0 ? 'Past' : d === 0 ? 'Today' : `${d}d`;
      const card = document.createElement('div');
      card.className = `pin-card ${urgencyClass(d)}`;
      card.innerHTML = `
        <div class="pin-info">
          <strong>${TYPE_ICON[p.type] || '📌'} ${escapeHtml(p.title)}</strong>
          <small>${new Date(p.date + 'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small>
        </div>
        <span class="pin-days">${label}</span>
        <button class="pin-remove" data-id="${p.id}" title="Remove">✕</button>
      `;
      list.appendChild(card);

      if (d <= 4) {
        const dc = document.createElement('div');
        dc.className = `pin-card ${urgencyClass(d)}`;
        dc.style.minWidth = '220px';
        dc.innerHTML = card.innerHTML;
        dash.appendChild(dc);
      }
    });

    list.querySelectorAll('.pin-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const pins2 = load().filter(p => p.id !== btn.dataset.id);
        save(pins2);
        render();
      });
    });
    dash.querySelectorAll('.pin-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const pins2 = load().filter(p => p.id !== btn.dataset.id);
        save(pins2);
        render();
      });
    });
  }

  function add(title, type, date) {
    const pins = load();
    pins.push({ id: Store.uid(), title, type, date });
    save(pins);
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function init() {
    render();
    const backdrop = document.getElementById('pin-modal-backdrop');
    document.getElementById('add-pin-btn').addEventListener('click', () => {
      document.getElementById('pin-date').valueAsDate = new Date();
      backdrop.hidden = false;
    });
    document.getElementById('pin-cancel-btn').addEventListener('click', () => backdrop.hidden = true);
    document.getElementById('pin-form').addEventListener('submit', e => {
      e.preventDefault();
      add(
        document.getElementById('pin-title').value.trim(),
        document.getElementById('pin-type').value,
        document.getElementById('pin-date').value
      );
      e.target.reset();
      backdrop.hidden = true;
    });
  }

  return { init, render, add };
})();
