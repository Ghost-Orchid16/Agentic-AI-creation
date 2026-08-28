const DoubtSolver = (() => {
  const DEFS = {
    photosynthesis: 'Photosynthesis is the process by which green plants use sunlight, water and CO₂ to make glucose and release oxygen. Equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.',
    newton: "Newton's Laws: 1) An object stays at rest/motion unless acted on by a force. 2) F = ma. 3) Every action has an equal and opposite reaction.",
  };

  let lastQuestion = '';
  let socratic = false;
  let pendingImage = null;

  function tryMath(text) {
    const cleaned = text.replace(/[^0-9+\-*/().\s]/g, '');
    if (!cleaned.trim() || !/[0-9]/.test(cleaned)) return null;
    if (cleaned.replace(/[0-9+\-*/().\s]/g, '') !== '') return null;
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${cleaned})`)();
      if (typeof result === 'number' && isFinite(result)) return `${cleaned.trim()} = ${result}`;
    } catch (e) { /* not a valid expression */ }
    return null;
  }

  function offlineAnswer(text) {
    const math = tryMath(text);
    if (math) return `🧮 ${math}`;
    const lower = text.toLowerCase();
    for (const key in DEFS) {
      if (lower.includes(key)) return DEFS[key];
    }
    if (/how (do|can) i study|how to study/.test(lower)) {
      return "Try this: 1) Skim the topic once for the big picture. 2) Read actively and make short notes. 3) Close the book and recall what you remember (active recall). 4) Solve a few practice questions. 5) Revisit anything you got wrong after a few hours.";
    }
    return `I don't have an online AI connected right now, so I can't fully answer "${text}". I can still solve maths expressions directly — or connect a backend in Settings for full answers.`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatBotText(text) {
    const parts = text.split(/```([\s\S]*?)```/g);
    return parts.map((part, i) => i % 2 === 1
      ? `<pre><code>${escapeHtml(part.trim())}</code></pre>`
      : escapeHtml(part).replace(/\n/g, '<br>')
    ).join('');
  }

  function addUserMessage(text, hasImage) {
    const win = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = 'msg user';
    div.textContent = (hasImage ? '📷 ' : '') + text;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
  }

  function addBotMessage(text, { thinking } = {}) {
    const win = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = 'msg bot';
    if (thinking) div.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span>';
    else renderBotContent(div, text);
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
    return div;
  }

  function renderBotContent(div, text) {
    div.innerHTML = `<div class="msg-text">${formatBotText(text)}</div>
      <div class="msg-actions">
        <button type="button" data-action="copy" title="Copy">⧉ Copy</button>
        <button type="button" data-action="regenerate" title="Regenerate">↻ Regenerate</button>
      </div>`;
    div.querySelector('[data-action="copy"]').addEventListener('click', () => navigator.clipboard?.writeText(text).catch(() => {}));
    div.querySelector('[data-action="regenerate"]').addEventListener('click', () => { if (lastQuestion) handleAsk(lastQuestion, { replace: div }); });
  }

  function updateBadge() {
    const badge = document.getElementById('ai-mode-badge');
    const online = AIBridge.statusCache && AIBridge.statusCache.reachable && AIBridge.statusCache.configured;
    badge.textContent = online ? '● Orbit AI Online' : '○ Offline Assistant';
    badge.classList.toggle('online', !!online);
  }

  function currentContext() {
    const subjectSel = document.getElementById('context-subject');
    const topicSel = document.getElementById('context-topic');
    const subjects = Subjects.load();
    const subject = subjects.find(s => s.id === subjectSel.value);
    const topic = subject && subject.topics.find(t => t.id === topicSel.value);
    return { subject, topic };
  }

  function buildSystemPrompt() {
    let prompt = 'You are Orbit, a friendly, concise AI study tutor for a school student. Explain clearly with short steps or bullet points.';
    const { subject, topic } = currentContext();
    if (subject) prompt += ` The student is currently focused on ${subject.name}${topic ? `, topic "${topic.text}"` : ''}. Use this context if relevant.`;
    if (socratic) prompt += ' SOCRATIC MODE: do not give the direct answer immediately. Instead, ask one guiding question at a time to help the student reach the answer themselves, and only reveal the full answer if they explicitly ask you to or have clearly struggled after a couple of tries.';
    return prompt;
  }

  async function handleAsk(text, { replace } = {}) {
    lastQuestion = text;
    const imageToSend = replace ? null : pendingImage;
    if (!replace) { addUserMessage(text, !!imageToSend); pendingImage = null; renderImagePreview(); }

    const target = replace ? (replace.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span>', replace) : addBotMessage('', { thinking: true });

    let reply = null;
    if (AIBridge.isConfigured()) {
      reply = await AIBridge.ask(text, { imageDataUrl: imageToSend, systemPrompt: buildSystemPrompt() });
    }
    const finalText = reply || (AIBridge.isConfigured()
      ? offlineAnswer(text) + '\n\n(AI request failed, showed an offline fallback instead.)'
      : offlineAnswer(text));
    renderBotContent(target, finalText);
    document.getElementById('chat-window').scrollTop = 999999;
  }

  function clearChat() {
    document.getElementById('chat-window').innerHTML = '';
    addBotMessage("Hi! I'm your AI Tutor. Ask me a question, attach a photo of a problem, or try a maths expression like 12*(4+3).");
  }

  function renderImagePreview() {
    const row = document.getElementById('image-preview-row');
    if (!pendingImage) { row.hidden = true; row.innerHTML = ''; return; }
    row.hidden = false;
    row.innerHTML = `<img src="${pendingImage}" alt="Attached question"><button type="button" id="image-remove-btn">✕ remove</button>`;
    document.getElementById('image-remove-btn').addEventListener('click', () => { pendingImage = null; renderImagePreview(); });
  }

  function populateContextSelects() {
    const subjectSel = document.getElementById('context-subject');
    const topicSel = document.getElementById('context-topic');
    const subjects = Subjects.load();
    const prevSubject = subjectSel.value;
    subjectSel.innerHTML = '<option value="">Any</option>' + subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if (prevSubject) subjectSel.value = prevSubject;

    function fillTopics() {
      const subject = subjects.find(s => s.id === subjectSel.value);
      topicSel.innerHTML = '<option value="">Any</option>' + (subject ? subject.topics.map(t => `<option value="${t.id}">${t.text}</option>`).join('') : '');
    }
    fillTopics();
    subjectSel.onchange = fillTopics;
  }

  function init() {
    clearChat();
    updateBadge();
    document.addEventListener('orbit:ai-config-changed', updateBadge);
    document.addEventListener('orbit:subjects-changed', populateContextSelects);
    populateContextSelects();

    document.getElementById('chat-form').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const val = input.value.trim() || (pendingImage ? 'What does this show, and how do I solve it?' : '');
      if (!val) return;
      input.value = '';
      handleAsk(val);
    });

    document.getElementById('chat-clear-btn').addEventListener('click', clearChat);

    document.getElementById('socratic-toggle').addEventListener('click', () => {
      socratic = !socratic;
      document.getElementById('socratic-toggle').setAttribute('aria-pressed', String(socratic));
      document.getElementById('socratic-toggle').classList.toggle('active', socratic);
      document.getElementById('socratic-note').hidden = !socratic;
    });

    document.getElementById('image-upload-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { pendingImage = reader.result; renderImagePreview(); };
      reader.readAsDataURL(file);
    });

    document.querySelectorAll('#suggested-prompts button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'quiz-me') {
          const { subject, topic } = currentContext();
          if (!topic) { alert('Pick a topic in the Context panel first.'); return; }
          Quiz.start(subject.id, topic.id, topic.text);
          return;
        }
        const input = document.getElementById('chat-input');
        input.value = lastQuestion ? `${btn.dataset.prompt}: ${lastQuestion}` : btn.dataset.prompt;
        input.focus();
      });
    });

    document.addEventListener('orbit:open-topic-tools', e => {
      document.querySelector('.nav-item[data-tab="doubt"]').click();
      const subjectSel = document.getElementById('context-subject');
      subjectSel.value = e.detail.subjectId;
      subjectSel.onchange();
      document.getElementById('context-topic').value = e.detail.topicId;
    });
  }

  return { init };
})();
