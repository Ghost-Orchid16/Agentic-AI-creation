const SRS = (() => {
  const KEY = 'orbit_review_queue';
  const INTERVALS = [1, 3, 7, 16];

  function load() { return Store.get(KEY, []); }
  function save(v) { Store.set(KEY, v); }

  function scheduleReview(subject, topic) {
    if (!topic.difficulty || topic.difficulty < 3) return;
    const queue = load();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + INTERVALS[0]);
    queue.push({
      id: Store.uid(),
      subjectId: subject.id,
      subjectName: subject.name,
      topicId: topic.id,
      topicText: topic.text,
      stage: 0,
      dueDate: dueDate.toISOString().slice(0, 10),
    });
    save(queue);
  }

  function due() {
    const today = Store.todayKey();
    return load().filter(r => r.dueDate <= today);
  }

  function markReviewed(id) {
    const queue = load();
    const item = queue.find(r => r.id === id);
    if (!item) return;
    if (item.stage + 1 < INTERVALS.length) {
      item.stage += 1;
      const d = new Date();
      d.setDate(d.getDate() + INTERVALS[item.stage]);
      item.dueDate = d.toISOString().slice(0, 10);
      save(queue);
    } else {
      save(queue.filter(r => r.id !== id));
    }
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const el = document.getElementById('review-queue');
    if (!el) return;
    const items = due();
    if (items.length === 0) {
      el.innerHTML = '<p class="muted" style="font-size:.85rem">No reviews due — nice!</p>';
      return;
    }
    el.innerHTML = items.map(r => `
      <div class="review-item">
        <span>🔁 <strong>${escapeHtml(r.topicText)}</strong> <small class="muted">(${escapeHtml(r.subjectName)})</small></span>
        <button class="primary-btn small" data-id="${r.id}">Reviewed</button>
      </div>
    `).join('');
    el.querySelectorAll('button[data-id]').forEach(btn =>
      btn.addEventListener('click', () => markReviewed(btn.dataset.id)));
  }

  function init() {
    render();
    document.addEventListener('orbit:topic-done', e => {
      scheduleReview(e.detail.subject, e.detail.topic);
      render();
    });
  }

  return { init, due };
})();
