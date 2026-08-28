const Planner = (() => {
  function estimatedMinutes(topic) { return 15 + topic.weight * 10; }

  function pomodoroSessions(minutes) {
    if (minutes <= 30) return `${minutes}m focused study`;
    const parts = [];
    let remaining = minutes;
    while (remaining > 0) {
      const chunk = Math.min(25, remaining);
      parts.push(`${chunk}m study`);
      remaining -= chunk;
      if (remaining > 0) parts.push('5m break');
    }
    return parts.join(' → ');
  }

  function daysLeftFrom(dateStr, examDate) {
    const d = new Date(dateStr + 'T00:00:00');
    const e = new Date(examDate + 'T00:00:00');
    return Math.round((e - d) / 86400000);
  }

  function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function weightClass(w) { return w >= 4 ? 'w-high' : w === 3 ? 'w-mid' : 'w-low'; }

  function generateMasterPlan() {
    const subjects = Subjects.load().filter(s => s.topics.length > 0);
    const studyMinutesDefault = Math.max(30, parseInt(document.getElementById('planner-minutes-per-day').value, 10) || 180);
    const today = Store.todayKey();
    const horizon = Math.min(14, Math.max(1, ...subjects.map(s => Math.max(1, Subjects.daysLeft(s.examDate)))));

    const cursors = {};
    subjects.forEach(s => { cursors[s.id] = 0; });

    const days = [];
    for (let offset = 0; offset < horizon; offset++) {
      const date = addDays(today, offset);
      const active = subjects.filter(s => daysLeftFrom(date, s.examDate) >= 0);
      if (active.length === 0) continue;

      const totalMinutes = studyMinutesDefault;
      const urgencies = active.map(s => 1 / (daysLeftFrom(date, s.examDate) + 1));
      const totalUrgency = urgencies.reduce((a, b) => a + b, 0);

      const blocks = [];
      active.forEach((s, i) => {
        const share = urgencies[i] / totalUrgency;
        let minutesBudget = Math.round(share * totalMinutes);
        const isFinalDay = daysLeftFrom(date, s.examDate) === 0;
        const undone = s.topics.filter(t => !t.done);
        if (undone.length === 0) return;

        let pool;
        if (isFinalDay) {
          pool = [...undone].sort((a, b) => b.weight - a.weight);
        } else {
          pool = undone.slice(cursors[s.id]);
        }

        const chosen = [];
        let used = 0;
        for (const t of pool) {
          if (used >= minutesBudget && chosen.length > 0) break;
          const est = estimatedMinutes(t);
          chosen.push({ ...t, plannedMinutes: est });
          used += est;
          if (!isFinalDay) cursors[s.id] += 1;
          if (used >= minutesBudget) break;
        }
        if (chosen.length === 0) return;
        chosen.forEach(t => Subjects.setPlannedMinutes(s.id, t.id, t.plannedMinutes));
        blocks.push({ subjectId: s.id, subjectName: s.name, minutes: used, isFinalDay, topics: chosen });
      });

      if (blocks.length > 0) days.push({ date, blocks });
    }
    return days;
  }

  function renderDayPlan(days) {
    const el = document.getElementById('ptab-plan');
    el.innerHTML = '';
    if (days.length === 0) {
      el.innerHTML = '<p class="muted">Add at least one subject with topics and an exam date above, then hit Generate.</p>';
      return;
    }
    days.forEach(d => {
      const card = document.createElement('div');
      card.className = 'day-card';
      const dateLabel = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      card.innerHTML = `
        <h3>${d.date === Store.todayKey() ? '📍 Today' : '📘'} ${dateLabel}</h3>
        ${d.blocks.map(b => `
          <div class="subject-block">
            <div class="subject-block-head">${b.isFinalDay ? '🔁 Revision — ' : ''}${escapeHtml(b.subjectName)} <small class="muted">${b.minutes} min</small></div>
            ${b.topics.map(t => `
              <div class="plan-topic-row">
                <input type="checkbox" data-action="toggle-topic" data-subject="${b.subjectId}" data-topic="${t.id}" ${t.done ? 'checked' : ''}>
                <span class="topic-chip ${weightClass(t.weight)}">${escapeHtml(t.text)} · ${t.plannedMinutes}m</span>
                <button class="round-btn timer-btn" data-action="timer-toggle" data-subject="${b.subjectId}" data-topic="${t.id}">⏱ Start</button>
                <details class="session-detail"><summary>sessions</summary>${pomodoroSessions(t.plannedMinutes)}</details>
              </div>
            `).join('')}
          </div>
        `).join('')}
      `;
      el.appendChild(card);
    });

    el.querySelectorAll('[data-action="toggle-topic"]').forEach(cb =>
      cb.addEventListener('change', () => Subjects.toggleDone(cb.dataset.subject, cb.dataset.topic, cb.checked)));
    Analytics.wireTimers(el);
  }

  function renderSummary(days) {
    const subjects = Subjects.load();
    const el = document.getElementById('ptab-summary');
    el.innerHTML = subjects.map(s => `
      <div class="summary-block">
        <h3>${escapeHtml(s.name)} — Outline</h3>
        <ul>${s.topics.map(t => `<li>${t.done ? '✅' : '⬜'} ${escapeHtml(t.text)}${t.weight >= 4 ? ' ⭐' : ''}</li>`).join('') || '<li class="muted">No topics yet</li>'}</ul>
      </div>
    `).join('') || '<p class="muted">Add subjects to see a summary.</p>';
  }

  function renderFlow(days) {
    const el = document.getElementById('ptab-flow');
    el.innerHTML = '';
    if (days.length === 0) { el.innerHTML = '<p class="muted">Generate a plan to see the flowchart.</p>'; return; }
    const wrap = document.createElement('div');
    wrap.className = 'flowchart';
    days.slice(0, 8).forEach((d, i) => {
      const node = document.createElement('div');
      node.className = 'flow-node';
      const label = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      node.innerHTML = `<h4>${label}</h4><p>${d.blocks.map(b => `${escapeHtml(b.subjectName)} (${b.minutes}m)`).join(', ')}</p>`;
      wrap.appendChild(node);
      const arrow = document.createElement('div');
      arrow.className = 'flow-arrow';
      arrow.textContent = '⬇';
      wrap.appendChild(arrow);
    });
    const exams = document.createElement('div');
    exams.className = 'flow-node';
    exams.innerHTML = `<h4>🎓 Exams</h4><p>${Subjects.load().map(s => `${escapeHtml(s.name)} — ${new Date(s.examDate + 'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}`).join('<br>') || 'None yet'}</p>`;
    wrap.appendChild(exams);
    el.appendChild(wrap);
  }

  async function generateAndRender() {
    const days = generateMasterPlan();
    document.getElementById('planner-output').hidden = false;
    renderDayPlan(days);
    renderSummary(days);
    renderFlow(days);
    Analytics.render();
  }

  async function aiTips() {
    const days = generateMasterPlan();
    if (days.length === 0) { alert('Generate a plan first.'); return; }
    const todayBlocks = days[0].blocks.map(b => `${b.subjectName}: ${b.topics.map(t => t.text).join(', ')}`).join(' | ');
    const box = document.getElementById('planner-ai-tip');
    box.hidden = false;
    box.textContent = 'Thinking…';
    const reply = await AIBridge.ask(`I have this study plan for today across subjects: ${todayBlocks}. Give me 3 short, practical tips (bullet style, no headers) to study this most effectively today.`);
    box.textContent = reply || 'Connect an AI key in Settings to get personalised tips here — showing the heuristic plan only for now.';
  }

  function init() {
    document.addEventListener('orbit:subjects-changed', generateAndRender);
    document.getElementById('planner-generate-btn').addEventListener('click', generateAndRender);
    document.getElementById('planner-ai-btn').addEventListener('click', aiTips);

    document.querySelectorAll('.ptab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ptab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ptab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ptab-' + btn.dataset.ptab).classList.add('active');
      });
    });

    generateAndRender();
  }

  return { init, generateAndRender };
})();
