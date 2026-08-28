const Planner = (() => {
  const DAY_START_HOUR = 16; // 4pm — a realistic after-school study start
  let lastDays = [];

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
    const minutesInput = document.getElementById('planner-minutes-per-day');
    const studyMinutesDefault = Math.max(30, parseInt(minutesInput ? minutesInput.value : 180, 10) || 180);
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

  /** Flat, clock-time-sequenced list of today's sessions — used by the Dashboard timeline.
   *  Reuses the last generated plan rather than recomputing (recomputing here would
   *  re-trigger the writes generateMasterPlan performs, which is wasteful and risks
   *  re-entrant event loops if a caller refreshes on the events those writes emit). */
  function getTodayTimeline() {
    const today = lastDays.find(d => d.date === Store.todayKey());
    if (!today) return [];
    const items = [];
    let cursorMinutes = DAY_START_HOUR * 60;
    today.blocks.forEach(b => {
      b.topics.forEach(t => {
        const h = Math.floor(cursorMinutes / 60) % 24;
        const m = cursorMinutes % 60;
        items.push({
          time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          subjectName: b.subjectName,
          subjectId: b.subjectId,
          topicId: t.id,
          topicText: t.text,
          minutes: t.plannedMinutes,
          weight: t.weight,
          done: t.done,
        });
        cursorMinutes += t.plannedMinutes;
      });
    });
    return items;
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

  function renderSummary() {
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

    const shown = days.slice(0, 6);
    const nodeW = 220, nodeH = 66, gapY = 34;
    const totalNodes = shown.length + 1;
    const width = nodeW + 40;
    const height = totalNodes * (nodeH + gapY) - gapY + 20;
    const cx = width / 2;

    let svg = `<svg class="flowchart-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="fcArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--border-strong)"></path></marker></defs>`;

    shown.forEach((d, i) => {
      const y = i * (nodeH + gapY) + 10;
      const label = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const sub = d.blocks.map(b => `${b.subjectName} (${b.minutes}m)`).join(', ');
      svg += `<g>
        <rect class="fc-node-rect" x="${cx - nodeW / 2}" y="${y}" width="${nodeW}" height="${nodeH}" rx="10"></rect>
        <text class="fc-node-title" x="${cx}" y="${y + 24}" text-anchor="middle">${escapeHtml(label)}</text>
        <text class="fc-node-sub" x="${cx}" y="${y + 44}" text-anchor="middle">${escapeHtml(truncate(sub, 34))}</text>
      </g>`;
      if (i < shown.length) {
        const y2 = y + nodeH;
        svg += `<path class="fc-arrow" d="M${cx},${y2} L${cx},${y2 + gapY - 4}" marker-end="url(#fcArrow)"></path>`;
      }
    });

    const examY = shown.length * (nodeH + gapY) + 10;
    const examLabel = Subjects.load().map(s => `${s.name} ${new Date(s.examDate + 'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}`).join(', ') || 'No exams yet';
    svg += `<g>
      <rect class="fc-node-rect exam" x="${cx - nodeW / 2}" y="${examY}" width="${nodeW}" height="${nodeH}" rx="10"></rect>
      <text class="fc-node-title" x="${cx}" y="${examY + 24}" text-anchor="middle">🎓 Exam Day</text>
      <text class="fc-node-sub" x="${cx}" y="${examY + 44}" text-anchor="middle">${escapeHtml(truncate(examLabel, 34))}</text>
    </g></svg>`;

    el.innerHTML = svg;
  }

  function truncate(str, n) { return str.length > n ? str.slice(0, n - 1) + '…' : str; }

  function renderReasoningPanel() {
    const el = document.getElementById('reasoning-panel');
    const subjects = Subjects.load().filter(s => s.topics.length > 0);
    if (subjects.length === 0) {
      el.innerHTML = '<p class="muted">Add a subject with topics and an exam date to see Orbit\'s reasoning here.</p>';
      return;
    }
    const nearest = subjects.reduce((a, b) => Subjects.daysLeft(a.examDate) < Subjects.daysLeft(b.examDate) ? a : b);
    const dl = Subjects.daysLeft(nearest.examDate);

    let mode, flow;
    if (dl <= 1) {
      mode = `<strong>${escapeHtml(nearest.name)}</strong> is ${dl <= 0 ? 'today' : 'in 1 day'} — Orbit switches to <strong>Last-Day Mode</strong>: no long schedule, just the highest-yield topics (must-do topics, formulas, definitions) for rapid revision and practice.`;
      flow = ['Priority concepts', 'Formulas / definitions', 'Weak topics', 'Rapid revision', 'Practice questions'];
    } else if (dl <= 3) {
      mode = `<strong>${escapeHtml(nearest.name)}</strong> is in ${dl} days — Orbit uses a <strong>Learn → Practice → Revise</strong> pattern, one phase per day.`;
      flow = ['Day 1: Learn', 'Day 2: Practice', 'Day 3: Revise'];
    } else {
      mode = `<strong>${escapeHtml(nearest.name)}</strong> is in ${dl} days — with more runway, Orbit spreads topics chronologically across the days you have, then reserves the final day for full revision + a mock test.`;
      flow = ['Learn', 'Practice', 'Review', 'Spaced revision', 'Mock test'];
    }
    if (subjects.length > 1) {
      mode += ` Across your ${subjects.length} subjects, each day's study time is split by urgency — whichever exam is closer claims more minutes automatically.`;
    }
    el.innerHTML = `
      <h3>Reasoning for ${escapeHtml(nearest.name)}</h3>
      <p class="muted" style="margin:0">${mode}</p>
      <div class="reasoning-flow">${flow.map((f, i) => `<span class="rf-step">${escapeHtml(f)}</span>${i < flow.length - 1 ? '<span class="rf-arrow">→</span>' : ''}`).join('')}</div>
    `;
  }

  function populateSummaryTopicSelect() {
    const select = document.getElementById('ai-summary-topic-select');
    if (!select) return;
    const subjects = Subjects.load();
    const prevValue = select.value;
    select.innerHTML = subjects.flatMap(s => s.topics.map(t =>
      `<option value="${t.id}" data-subject="${escapeHtml(s.name)}">${escapeHtml(s.name)} — ${escapeHtml(t.text)}</option>`
    )).join('') || '<option value="">Add topics first</option>';
    if (prevValue) select.value = prevValue;
  }

  async function generateAiSummary() {
    const select = document.getElementById('ai-summary-topic-select');
    const option = select.selectedOptions[0];
    if (!option || !option.value) { alert('Add a topic first.'); return; }
    const topicText = option.textContent;
    const box = document.getElementById('ai-summary-output');
    box.hidden = false;
    box.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span>';

    if (!AIBridge.isConfigured()) {
      box.innerHTML = `<h4>Offline mode</h4><p>Connect an AI key in Settings to generate a real summary, key points, formulas and common mistakes for <strong>${escapeHtml(topicText)}</strong>. For now, use the Doubt Solver for quick maths, or revisit your notes for this topic.</p>`;
      return;
    }
    const reply = await AIBridge.ask(`Give me a concise study summary for the topic "${topicText}". Structure your answer with these exact section headers on their own line: "Key Points", "Formulas / Definitions", "Common Mistakes". Use short bullet points (lines starting with "- ") under each. Keep it exam-focused and brief.`);
    box.innerHTML = reply ? formatSummary(reply) : '<p class="muted">Could not reach the AI right now — try again in a moment.</p>';
  }

  function formatSummary(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^(key points|formulas|formulas \/ definitions|common mistakes)/i.test(trimmed)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h4>${escapeHtml(trimmed.replace(/[:*#]/g, ''))}</h4>`;
      } else if (/^[-*]\s/.test(trimmed)) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${escapeHtml(trimmed.replace(/^[-*]\s/, ''))}</li>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p>${escapeHtml(trimmed)}</p>`;
      }
    });
    if (inList) html += '</ul>';
    return html;
  }

  async function generateAndRender() {
    const days = generateMasterPlan();
    lastDays = days;
    document.getElementById('planner-output').hidden = false;
    renderDayPlan(days);
    renderSummary();
    renderFlow(days);
    renderReasoningPanel();
    populateSummaryTopicSelect();
    Analytics.render();
    document.dispatchEvent(new CustomEvent('orbit:plan-updated'));
  }

  async function aiTips() {
    const days = generateMasterPlan();
    if (days.length === 0) { alert('Generate a plan first.'); return; }
    const todayBlocks = days[0].blocks.map(b => `${b.subjectName}: ${b.topics.map(t => t.text).join(', ')}`).join(' | ');
    const box = document.getElementById('planner-ai-tip');
    box.hidden = false;
    box.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span>';
    const reply = await AIBridge.ask(`I have this study plan for today across subjects: ${todayBlocks}. Give me 3 short, practical tips (bullet style, no headers) to study this most effectively today.`);
    box.textContent = reply || 'Connect an AI key in Settings to get personalised tips here — showing the heuristic plan only for now.';
  }

  function init() {
    document.addEventListener('orbit:subjects-changed', generateAndRender);
    document.getElementById('planner-generate-btn').addEventListener('click', generateAndRender);
    document.getElementById('planner-ai-btn').addEventListener('click', aiTips);
    document.getElementById('ai-summary-btn').addEventListener('click', generateAiSummary);

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

  return { init, generateAndRender, getTodayTimeline };
})();
