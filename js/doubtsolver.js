const DoubtSolver = (() => {
  const DEFS = {
    photosynthesis: 'Photosynthesis is the process by which green plants use sunlight, water and CO₂ to make glucose and release oxygen. Equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.',
    newton: "Newton's Laws: 1) An object stays at rest/motion unless acted on by a force. 2) F = ma. 3) Every action has an equal and opposite reaction.",
    photosynthesis2: '',
  };

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
      if (DEFS[key] && lower.includes(key)) return DEFS[key];
    }

    if (/how (do|can) i study|how to study/.test(lower)) {
      return "Try this: 1) Skim the topic once for the big picture. 2) Read actively and make short notes. 3) Close the book and recall what you remember (active recall). 4) Solve a few practice questions. 5) Revisit anything you got wrong after a few hours.";
    }
    if (/what is|define|meaning of|explain/.test(lower)) {
      return `I don't have internet AI connected right now, so I can't fetch a full explanation for "${text}". Try rephrasing as a maths expression, or go to Settings and add a free/your own AI API key to unlock full answers — I'll search the internet for you then.`;
    }
    return "I'm running in offline mode, so I can handle basic maths and a few common topics directly. For open-ended doubts, add an API key in Settings so I can think it through using an online AI model.";
  }

  function addMessage(text, who) {
    const win = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
  }

  function updateBadge() {
    const badge = document.getElementById('ai-mode-badge');
    if (AIBridge.isConfigured()) {
      badge.textContent = 'AI Online';
      badge.classList.add('online');
    } else {
      badge.textContent = 'Offline Assistant';
      badge.classList.remove('online');
    }
  }

  async function handleAsk(text) {
    addMessage(text, 'user');
    if (AIBridge.isConfigured()) {
      addMessage('Thinking…', 'bot');
      const win = document.getElementById('chat-window');
      const thinkingEl = win.lastChild;
      const reply = await AIBridge.ask(text);
      if (reply) {
        thinkingEl.textContent = reply;
      } else {
        thinkingEl.textContent = offlineAnswer(text) + '\n\n(AI request failed, showed an offline fallback instead.)';
      }
      win.scrollTop = win.scrollHeight;
    } else {
      addMessage(offlineAnswer(text), 'bot');
    }
  }

  function init() {
    addMessage("Hi! I'm Orbit's Doubt Solver. Ask me a question, or try a maths expression like 12*(4+3).", 'bot');
    updateBadge();
    document.addEventListener('orbit:ai-config-changed', updateBadge);

    document.getElementById('chat-form').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      handleAsk(val);
    });
  }

  return { init };
})();
