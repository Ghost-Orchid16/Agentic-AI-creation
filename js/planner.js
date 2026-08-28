const Planner = (() => {
  const IMPORTANT_WORDS = [
    'important', 'exam', 'formula', 'theorem', 'law', 'derivation', 'numerical',
    'definition', 'diagram', 'pyq', 'weightage', 'proof', 'equation', 'must',
    'key', 'concept', 'graph', 'reaction', 'mechanism'
  ];

  function parseTopics(raw) {
    return raw
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((line, idx) => {
        let text = line;
        let weight = 3;
        if (text.endsWith('*')) {
          weight += 2;
          text = text.slice(0, -1).trim();
        }
        const lower = text.toLowerCase();
        if (IMPORTANT_WORDS.some(w => lower.includes(w))) weight += 1;
        if (text.length < 12) weight -= 1;
        if (idx === 0) weight += 1;
        weight = Math.max(1, Math.min(5, weight));
        return { text, weight, order: idx };
      });
  }

  function weightClass(w) {
    if (w >= 4) return 'w-high';
    if (w === 3) return 'w-mid';
    return 'w-low';
  }

  function buildPlan(subject, days, topics) {
    const sorted = [...topics].sort((a, b) => b.weight - a.weight || a.order - b.order);

    if (days <= 1) {
      const cutoff = Math.max(3, Math.ceil(topics.length * 0.45));
      const mustDo = sorted.slice(0, cutoff).sort((a, b) => a.order - b.order);
      return [{
        title: `🚨 Day 1 (Today) — High-Yield Revision: ${subject}`,
        topics: mustDo,
        tip: 'Only 1 day left: skip anything not on this list. Do active recall (write from memory), not just re-reading. Solve 2-3 previous-year style questions per must-do topic, then take one full mock/self-test before you sleep.'
      }];
    }

    const revisionDay = {
      title: `🔁 Day ${days} (Final Day) — Full Revision + Mock Test: ${subject}`,
      topics: sorted.slice(0, Math.max(3, Math.ceil(topics.length * 0.5))).sort((a, b) => a.order - b.order),
      tip: 'Rapid-fire revise everything, attempt a timed mock test, and only re-check topics you got wrong.'
    };

    const studyDays = days - 1;
    const chronological = [...topics].sort((a, b) => a.order - b.order);
    const chunkSize = Math.ceil(chronological.length / studyDays) || 1;
    const dayPlans = [];
    for (let i = 0; i < studyDays; i++) {
      const chunk = chronological.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length === 0) continue;
      const hasHigh = chunk.some(t => t.weight >= 4);
      dayPlans.push({
        title: `📘 Day ${i + 1} — ${subject}`,
        topics: chunk,
        tip: hasHigh
          ? 'This day has must-do topics — start with those while your mind is fresh, then move to lighter ones.'
          : 'Lighter load today — pair it with revising one topic from a previous day.'
      });
    }
    dayPlans.push(revisionDay);
    return dayPlans;
  }

  function renderPlan(dayPlans) {
    const el = document.getElementById('ptab-plan');
    el.innerHTML = '';
    dayPlans.forEach(dp => {
      const card = document.createElement('div');
      card.className = 'day-card';
      const chips = dp.topics.map(t =>
        `<span class="topic-chip ${weightClass(t.weight)}">${escapeHtml(t.text)}</span>`
      ).join('');
      card.innerHTML = `<h3>${dp.title}</h3>${chips}<div class="tip">💡 ${dp.tip}</div>`;
      el.appendChild(card);
    });
  }

  function renderSummary(subject, topics) {
    const el = document.getElementById('ptab-summary');
    const sorted = [...topics].sort((a, b) => a.order - b.order);
    const must = sorted.filter(t => t.weight >= 4);
    el.innerHTML = `
      <div class="summary-block">
        <h3>${escapeHtml(subject)} — Quick Outline</h3>
        <ul>${sorted.map(t => `<li><strong>${escapeHtml(t.text)}</strong>${t.weight >= 4 ? ' ⭐ must-do' : ''}</li>`).join('')}</ul>
        ${must.length ? `<p class="muted">⭐ ${must.length} topic(s) flagged as must-do based on your <code>*</code> marks and keyword importance (formula, theorem, definition, etc.).</p>` : ''}
      </div>
    `;
  }

  function renderFlow(subject, dayPlans) {
    const el = document.getElementById('ptab-flow');
    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'flowchart';
    dayPlans.forEach((dp, i) => {
      const node = document.createElement('div');
      node.className = 'flow-node';
      node.innerHTML = `<h4>${dp.title.replace(subject, '').trim()}</h4><p>${dp.topics.slice(0, 3).map(t => t.text).join(', ')}${dp.topics.length > 3 ? '&hellip;' : ''}</p>`;
      wrap.appendChild(node);
      if (i < dayPlans.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'flow-arrow';
        arrow.textContent = '⬇';
        wrap.appendChild(arrow);
      }
    });
    const finish = document.createElement('div');
    finish.className = 'flow-arrow';
    finish.textContent = '⬇';
    wrap.appendChild(finish);
    const exam = document.createElement('div');
    exam.className = 'flow-node';
    exam.innerHTML = `<h4>🎓 Exam Day</h4><p>Stay calm, trust your revision.</p>`;
    wrap.appendChild(exam);
    el.appendChild(wrap);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function generate(useAI) {
    const subject = document.getElementById('planner-subject').value.trim() || 'Study Plan';
    const days = Math.max(1, parseInt(document.getElementById('planner-days').value, 10) || 1);
    const raw = document.getElementById('planner-topics').value;
    const topics = parseTopics(raw);
    if (topics.length === 0) {
      alert('Please add at least one topic.');
      return;
    }

    let dayPlans = buildPlan(subject, days, topics);

    if (useAI) {
      const aiResult = await AIBridge.refinePlan({ subject, days, topics: topics.map(t => t.text) });
      if (aiResult) {
        try {
          dayPlans = aiResult.map(d => ({
            title: d.title,
            tip: d.tip,
            topics: (d.topics || []).map((txt, i) => ({ text: txt, weight: 4, order: i }))
          }));
        } catch (e) { /* fall back to heuristic plan already built */ }
      }
    }

    document.getElementById('planner-output').hidden = false;
    renderPlan(dayPlans);
    renderSummary(subject, topics);
    renderFlow(subject, dayPlans);
  }

  function init() {
    document.getElementById('planner-form').addEventListener('submit', e => {
      e.preventDefault();
      generate(false);
    });
    document.getElementById('planner-ai-btn').addEventListener('click', () => generate(true));

    document.querySelectorAll('.ptab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ptab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ptab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ptab-' + btn.dataset.ptab).classList.add('active');
      });
    });
  }

  return { init };
})();
