const Subjects = (() => {
  const KEY = 'orbit_subjects';
  const IMPORTANT_WORDS = [
    'important', 'exam', 'formula', 'theorem', 'law', 'derivation', 'numerical',
    'definition', 'diagram', 'pyq', 'weightage', 'proof', 'equation', 'must',
    'key', 'concept', 'graph', 'reaction', 'mechanism'
  ];

  function load() { return Store.get(KEY, []); }
  function save(v) { Store.set(KEY, v); document.dispatchEvent(new CustomEvent('orbit:subjects-changed')); }
  function saveQuiet(v) { Store.set(KEY, v); document.dispatchEvent(new CustomEvent('orbit:subjects-meta-changed')); }

  function scoreWeight(text, index) {
    let weight = 3;
    let clean = text;
    if (clean.endsWith('*')) { weight += 2; clean = clean.slice(0, -1).trim(); }
    const lower = clean.toLowerCase();
    if (IMPORTANT_WORDS.some(w => lower.includes(w))) weight += 1;
    if (clean.length < 12) weight -= 1;
    if (index === 0) weight += 1;
    weight = Math.max(1, Math.min(5, weight));
    return { text: clean, weight };
  }

  function addSubject(name, examDate) {
    const subjects = load();
    subjects.push({ id: Store.uid(), name, examDate, topics: [], createdAt: Date.now() });
    save(subjects);
  }

  function removeSubject(id) {
    save(load().filter(s => s.id !== id));
  }

  function addTopicsBulk(subjectId, rawText) {
    const subjects = load();
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach((line, i) => {
      const { text, weight } = scoreWeight(line, subj.topics.length + i);
      subj.topics.push({ id: Store.uid(), text, weight, difficulty: 0, done: false, actualMinutes: 0, plannedMinutes: 0 });
    });
    save(subjects);
  }

  function removeTopic(subjectId, topicId) {
    const subjects = load();
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    subj.topics = subj.topics.filter(t => t.id !== topicId);
    save(subjects);
  }

  function toggleDone(subjectId, topicId, done) {
    const subjects = load();
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const topic = subj.topics.find(t => t.id === topicId);
    if (!topic) return;
    topic.done = done;
    save(subjects);
    if (done) {
      Store.logActivity();
      document.dispatchEvent(new CustomEvent('orbit:topic-done', { detail: { subject: subj, topic } }));
    }
  }

  function setDifficulty(subjectId, topicId, level) {
    const subjects = load();
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const topic = subj.topics.find(t => t.id === topicId);
    if (!topic) return;
    topic.difficulty = level;
    save(subjects);
  }

  function addMinutes(subjectId, topicId, minutes) {
    const subjects = load();
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const topic = subj.topics.find(t => t.id === topicId);
    if (!topic) return;
    topic.actualMinutes = (topic.actualMinutes || 0) + minutes;
    saveQuiet(subjects);
  }

  function setPlannedMinutes(subjectId, topicId, minutes) {
    const subjects = load();
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;
    const topic = subj.topics.find(t => t.id === topicId);
    if (!topic) return;
    topic.plannedMinutes = minutes;
    saveQuiet(subjects);
  }

  function daysLeft(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    return Math.round((target - today) / 86400000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const subjects = load();
    const wrap = document.getElementById('subjects-list');
    wrap.innerHTML = '';
    if (subjects.length === 0) {
      wrap.innerHTML = '<p class="muted" style="font-size:.85rem">No subjects yet — add one above to start planning.</p>';
      return;
    }
    subjects.sort((a, b) => daysLeft(a.examDate) - daysLeft(b.examDate)).forEach(subj => {
      const dl = daysLeft(subj.examDate);
      const done = subj.topics.filter(t => t.done).length;
      const total = subj.topics.length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.innerHTML = `
        <div class="subject-head">
          <div>
            <strong>📚 ${escapeHtml(subj.name)}</strong>
            <small class="muted">Exam: ${new Date(subj.examDate + 'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})} · ${dl < 0 ? 'past' : dl === 0 ? 'today' : dl + ' days left'}</small>
          </div>
          <button class="pin-remove" data-action="remove-subject" data-id="${subj.id}">✕</button>
        </div>
        <div class="target-bar-track"><div class="target-bar-fill" style="width:${pct}%"></div></div>
        <small class="muted">${done}/${total} topics done</small>
        <div class="topic-list">
          ${subj.topics.map(t => `
            <div class="topic-row ${t.done ? 'done' : ''}">
              <input type="checkbox" data-action="toggle-topic" data-subject="${subj.id}" data-topic="${t.id}" ${t.done ? 'checked' : ''}>
              <span class="topic-text">${escapeHtml(t.text)}</span>
              <span class="diff-buttons">
                ${[1,2,3,4,5].map(n => `<button class="diff-dot ${t.difficulty >= n ? 'active' : ''}" data-action="set-diff" data-subject="${subj.id}" data-topic="${t.id}" data-level="${n}" title="Difficulty ${n}">●</button>`).join('')}
              </span>
              <button class="pin-remove" data-action="remove-topic" data-subject="${subj.id}" data-topic="${t.id}">✕</button>
            </div>
          `).join('')}
        </div>
        <form class="stack-form add-topic-form" data-subject="${subj.id}">
          <textarea rows="2" placeholder="Add topic(s) — one per line, end a line with * for must-do" data-role="topic-input"></textarea>
          <button type="submit" class="primary-btn small">Add topic(s)</button>
        </form>
      `;
      wrap.appendChild(card);
    });

    wrap.querySelectorAll('[data-action="remove-subject"]').forEach(btn =>
      btn.addEventListener('click', () => removeSubject(btn.dataset.id)));
    wrap.querySelectorAll('[data-action="toggle-topic"]').forEach(cb =>
      cb.addEventListener('change', () => toggleDone(cb.dataset.subject, cb.dataset.topic, cb.checked)));
    wrap.querySelectorAll('[data-action="set-diff"]').forEach(btn =>
      btn.addEventListener('click', () => setDifficulty(btn.dataset.subject, btn.dataset.topic, parseInt(btn.dataset.level, 10))));
    wrap.querySelectorAll('[data-action="remove-topic"]').forEach(btn =>
      btn.addEventListener('click', () => removeTopic(btn.dataset.subject, btn.dataset.topic)));
    wrap.querySelectorAll('.add-topic-form').forEach(form =>
      form.addEventListener('submit', e => {
        e.preventDefault();
        const input = form.querySelector('[data-role="topic-input"]');
        if (!input.value.trim()) return;
        addTopicsBulk(form.dataset.subject, input.value);
        input.value = '';
      }));
  }

  function init() {
    render();
    document.addEventListener('orbit:subjects-changed', render);
    document.getElementById('subject-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('subject-name').value.trim();
      const date = document.getElementById('subject-date').value;
      if (!name || !date) return;
      addSubject(name, date);
      e.target.reset();
    });
  }

  function summaries() {
    return load().map(s => ({
      id: s.id,
      name: s.name,
      examDate: s.examDate,
      daysLeft: daysLeft(s.examDate),
      topicCount: s.topics.length,
      pct: s.topics.length ? Math.round((s.topics.filter(t => t.done).length / s.topics.length) * 100) : 0,
    }));
  }

  return { init, load, daysLeft, addMinutes, setPlannedMinutes, toggleDone, summaries };
})();
