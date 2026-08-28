const AIBridge = (() => {
  const KEY = 'orbit_ai_config';

  function getConfig() {
    return Store.get(KEY, { endpoint: '', model: '', key: '' });
  }
  function setConfig(cfg) { Store.set(KEY, cfg); }
  function isConfigured() {
    const c = getConfig();
    return !!(c.endpoint && c.key);
  }

  async function chat(messages) {
    const cfg = getConfig();
    if (!cfg.endpoint || !cfg.key) return null;
    try {
      const res = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.key}`
        },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages
        })
      });
      if (!res.ok) throw new Error('AI request failed: ' + res.status);
      const data = await res.json();
      return data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;
    } catch (err) {
      console.warn('Orbit AI call failed, falling back to offline mode.', err);
      return null;
    }
  }

  async function ask(question) {
    const reply = await chat([
      { role: 'system', content: 'You are Orbit, a friendly, concise study doubt-solving assistant for a school student. Explain clearly with short steps or bullet points.' },
      { role: 'user', content: question }
    ]);
    return reply;
  }

  async function refinePlan({ subject, days, topics }) {
    const prompt = `Subject: ${subject}\nDays left: ${days}\nTopics: ${topics.join(', ')}\n\nCreate a day-by-day study plan as strict JSON (no prose, no markdown fences): an array of objects, each {"title": string, "tip": string, "topics": string[]}. Use exactly ${days} day objects, prioritise high-importance topics earlier, and make the last day a revision/mock-test day.`;
    const reply = await chat([
      { role: 'system', content: 'You output only valid JSON, nothing else.' },
      { role: 'user', content: prompt }
    ]);
    if (!reply) return null;
    try {
      const cleaned = reply.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      return JSON.parse(cleaned);
    } catch (e) {
      return null;
    }
  }

  return { getConfig, setConfig, isConfigured, ask, refinePlan };
})();
