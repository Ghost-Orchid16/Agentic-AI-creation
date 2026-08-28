const Analytics = (() => {
  const activeTimers = {};

  function timerKey(subjectId, topicId) { return subjectId + ':' + topicId; }

  function wireTimers(container) {
    container.querySelectorAll('[data-action="timer-toggle"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = timerKey(btn.dataset.subject, btn.dataset.topic);
        if (activeTimers[key]) {
          clearInterval(activeTimers[key].handle);
          const elapsedMin = Math.round((Date.now() - activeTimers[key].start) / 60000);
          if (elapsedMin > 0) Subjects.addMinutes(btn.dataset.subject, btn.dataset.topic, elapsedMin);
          delete activeTimers[key];
          btn.textContent = '⏱ Start';
          btn.classList.remove('timer-running');
        } else {
          activeTimers[key] = { start: Date.now() };
          btn.textContent = '⏸ 0:00';
          btn.classList.add('timer-running');
          activeTimers[key].handle = setInterval(() => {
            const secs = Math.floor((Date.now() - activeTimers[key].start) / 1000);
            const m = Math.floor(secs / 60);
            const s = (secs % 60).toString().padStart(2, '0');
            btn.textContent = `⏸ ${m}:${s}`;
          }, 1000);
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const subjects = Subjects.load();
    const allTopics = subjects.flatMap(s => s.topics.map(t => ({ ...t, subjectName: s.name })));
    const totalDone = allTopics.filter(t => t.done).length;
    const totalPct = allTopics.length ? Math.round((totalDone / allTopics.length) * 100) : 0;

    document.getElementById('progress-overall-bar').style.width = totalPct + '%';
    document.getElementById('progress-overall-label').textContent = `${totalDone}/${allTopics.length} topics complete (${totalPct}%)`;
    document.getElementById('progress-streak').textContent = `🔥 ${Store.currentStreak()} day streak`;

    const perSubjectEl = document.getElementById('progress-subjects');
    perSubjectEl.innerHTML = subjects.map(s => {
      const done = s.topics.filter(t => t.done).length;
      const pct = s.topics.length ? Math.round((done / s.topics.length) * 100) : 0;
      return `
        <div class="target-card">
          <div class="t-top"><span>📚 ${escapeHtml(s.name)}</span><small>${done}/${s.topics.length}</small></div>
          <div class="target-bar-track"><div class="target-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('') || '<p class="muted">Add subjects in Study Planner to see progress here.</p>';

    const timeRows = allTopics.filter(t => t.actualMinutes > 0 || t.plannedMinutes > 0);
    const timeEl = document.getElementById('progress-time-table');
    if (timeRows.length === 0) {
      timeEl.innerHTML = '<p class="muted">No time tracked yet — hit the ⏱ button on a topic in your Day Plan to start timing a study session.</p>';
    } else {
      timeEl.innerHTML = `
        <table class="time-table">
          <thead><tr><th>Topic</th><th>Subject</th><th>Planned</th><th>Actual</th></tr></thead>
          <tbody>
            ${timeRows.map(t => `
              <tr>
                <td>${escapeHtml(t.text)}</td>
                <td>${escapeHtml(t.subjectName)}</td>
                <td>${t.plannedMinutes ? t.plannedMinutes + 'm' : '—'}</td>
                <td>${t.actualMinutes ? t.actualMinutes + 'm' : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

    const matrixEl = document.getElementById('ptab-matrix');
    if (matrixEl) renderMatrix(matrixEl, allTopics);
  }

  function renderMatrix(el, allTopics) {
    const rated = allTopics.filter(t => t.difficulty > 0 && !t.done);
    const quadrants = {
      focus: rated.filter(t => t.weight >= 4 && t.difficulty >= 4),
      build: rated.filter(t => t.weight >= 4 && t.difficulty < 4),
      polish: rated.filter(t => t.weight < 4 && t.difficulty >= 4),
      later: rated.filter(t => t.weight < 4 && t.difficulty < 4),
    };
    const box = (title, tip, list) => `
      <div class="matrix-box">
        <h4>${title}</h4>
        <p class="tip">${tip}</p>
        ${list.length ? list.map(t => `<span class="topic-chip w-high">${escapeHtml(t.text)}</span>`).join('') : '<span class="muted" style="font-size:.8rem">Nothing here</span>'}
      </div>`;
    el.innerHTML = `
      <div class="matrix-grid">
        ${box('🔥 Focus First', 'High importance, low understanding', quadrants.focus)}
        ${box('💪 Build Mastery', 'High importance, already comfortable', quadrants.build)}
        ${box('✨ Quick Polish', 'Lower importance, still tricky', quadrants.polish)}
        ${box('🕒 Later', 'Lower importance, already comfortable', quadrants.later)}
      </div>
      <p class="muted" style="margin-top:10px">Rate a topic's difficulty (the dots next to it in Study Planner) to place it here.</p>
    `;
  }

  function init() {
    render();
    document.addEventListener('orbit:subjects-changed', render);
    document.addEventListener('orbit:subjects-meta-changed', render);
    document.addEventListener('orbit:topic-done', render);
  }

  return { init, render, wireTimers };
})();
