const Quiz = (() => {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function start(subjectId, topicId, topicText) {
    const backdrop = document.getElementById('quiz-modal-backdrop');
    const body = document.getElementById('quiz-body');
    backdrop.hidden = false;

    if (!AIBridge.isConfigured()) {
      body.innerHTML = `<p class="muted">Quiz generation needs a connected AI (Orbit doesn't fake quiz questions). Connect a backend in Settings, then try again.</p>
        <button class="btn ghost-btn small" id="quiz-close-btn">Close</button>`;
      document.getElementById('quiz-close-btn').addEventListener('click', () => backdrop.hidden = true);
      return;
    }

    body.innerHTML = '<p class="muted">Orbit is writing your quiz…</p><span class="thinking-dots"><span></span><span></span><span></span></span>';

    const reply = await AIBridge.ask(
      `Write a 3-question multiple-choice quiz to check understanding of "${topicText}". Respond with ONLY strict JSON: an array of {"question": string, "options": [string,string,string,string], "correctIndex": number}. No prose, no markdown fences.`,
      { systemPrompt: 'You output only valid JSON, nothing else.' }
    );

    let questions;
    try {
      const cleaned = (reply || '').trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('empty');
    } catch (e) {
      body.innerHTML = `<p class="muted">Orbit couldn't generate a quiz right now — try again in a moment.</p>
        <button class="btn ghost-btn small" id="quiz-close-btn">Close</button>`;
      document.getElementById('quiz-close-btn').addEventListener('click', () => backdrop.hidden = true);
      return;
    }

    renderQuiz(questions, subjectId, topicId, topicText);
  }

  function renderQuiz(questions, subjectId, topicId, topicText) {
    const body = document.getElementById('quiz-body');
    body.innerHTML = `
      <form id="quiz-form">
        ${questions.map((q, qi) => `
          <div class="quiz-question">
            <p><strong>${qi + 1}. ${escapeHtml(q.question)}</strong></p>
            ${q.options.map((opt, oi) => `
              <label class="quiz-option">
                <input type="radio" name="q${qi}" value="${oi}" required>
                ${escapeHtml(opt)}
              </label>
            `).join('')}
          </div>
        `).join('')}
        <button type="submit" class="btn primary-btn" style="margin-top:10px">Submit Quiz</button>
      </form>
    `;
    document.getElementById('quiz-form').addEventListener('submit', e => {
      e.preventDefault();
      let correct = 0;
      questions.forEach((q, qi) => {
        const picked = document.querySelector(`input[name="q${qi}"]:checked`);
        if (picked && parseInt(picked.value, 10) === q.correctIndex) correct += 1;
      });
      const pct = Math.round((correct / questions.length) * 100);
      if (pct < 70 && subjectId && topicId) {
        Subjects.setDifficulty(subjectId, topicId, 4);
      }
      body.innerHTML = `
        <div class="quiz-result">
          <h3>${correct}/${questions.length} correct (${pct}%)</h3>
          <p class="muted">${pct >= 70 ? "Nice — you've got a solid handle on this." : "This one's flagged as weak now, and will come up in your revision queue once you mark it studied."}</p>
          <button class="btn primary-btn small" id="quiz-close-btn">Done</button>
        </div>`;
      document.getElementById('quiz-close-btn').addEventListener('click', () => document.getElementById('quiz-modal-backdrop').hidden = true);
    });
  }

  function init() {
    // modal has no static close button until content renders; nothing to bind at load time.
  }

  return { init, start };
})();
