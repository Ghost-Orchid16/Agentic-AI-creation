const AIBridge = (() => {
  const KEY = 'orbit_backend_url';
  let statusCache = null; // { configured: bool } | null

  function getBackendUrl() { return (Store.get(KEY, '') || '').replace(/\/$/, ''); }
  function setBackendUrl(url) { Store.set(KEY, (url || '').replace(/\/$/, '')); statusCache = null; }
  function isConfigured() { return !!getBackendUrl(); }

  async function checkStatus() {
    const base = getBackendUrl();
    if (!base) { statusCache = { configured: false, reachable: false }; return statusCache; }
    try {
      const res = await fetch(base + '/api/status', { method: 'GET' });
      if (!res.ok) throw new Error('status ' + res.status);
      const data = await res.json();
      statusCache = { configured: !!data.configured, reachable: true };
    } catch (err) {
      statusCache = { configured: false, reachable: false };
    }
    return statusCache;
  }

  async function chat(messages) {
    const base = getBackendUrl();
    if (!base) return null;
    try {
      const res = await fetch(base + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('Orbit backend error:', data.error || res.status);
        return null;
      }
      return data.content || null;
    } catch (err) {
      console.warn('Orbit AI call failed, falling back to offline mode.', err);
      return null;
    }
  }

  async function ask(question, { imageDataUrl, systemPrompt } = {}) {
    const userContent = imageDataUrl
      ? [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: imageDataUrl } }]
      : question;
    const reply = await chat([
      { role: 'system', content: systemPrompt || 'You are Orbit, a friendly, concise study assistant for a school student. Explain clearly with short steps or bullet points.' },
      { role: 'user', content: userContent },
    ]);
    return reply;
  }

  async function refinePlan({ subject, days, topics }) {
    const prompt = `Subject: ${subject}\nDays left: ${days}\nTopics: ${topics.join(', ')}\n\nCreate a day-by-day study plan as strict JSON (no prose, no markdown fences): an array of objects, each {"title": string, "tip": string, "topics": string[]}. Use exactly ${days} day objects, prioritise high-importance topics earlier, and make the last day a revision/mock-test day.`;
    const reply = await chat([
      { role: 'system', content: 'You output only valid JSON, nothing else.' },
      { role: 'user', content: prompt },
    ]);
    if (!reply) return null;
    try {
      const cleaned = reply.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      return JSON.parse(cleaned);
    } catch (e) {
      return null;
    }
  }

  return { getBackendUrl, setBackendUrl, isConfigured, checkStatus, chat, ask, refinePlan, get statusCache() { return statusCache; } };
})();
