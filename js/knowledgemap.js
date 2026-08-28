const KnowledgeMap = (() => {
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function stateFor(topic) {
    if (topic.done) return { icon: '✓', cls: 'mastered', label: 'Mastered' };
    if (topic.difficulty >= 4) return { icon: '●', cls: 'weak', label: 'Weak' };
    if (topic.actualMinutes > 0) return { icon: '◐', cls: 'learning', label: 'Learning' };
    return { icon: '○', cls: 'not-started', label: 'Not started' };
  }

  function render() {
    const el = document.getElementById('ptab-knowledge');
    if (!el) return;
    const subjects = Subjects.load();
    if (subjects.length === 0) { el.innerHTML = '<p class="muted">Add subjects and topics to see your knowledge map.</p>'; return; }

    el.innerHTML = subjects.map(s => `
      <div class="knowledge-subject">
        <h4>${escapeHtml(s.name)}</h4>
        <ul class="knowledge-tree">
          ${s.topics.map(t => {
            const st = stateFor(t);
            return `<li class="k-${st.cls}" data-subject="${s.id}" data-topic="${t.id}" tabindex="0" title="${st.label}"><span class="k-icon">${st.icon}</span>${escapeHtml(t.text)}</li>`;
          }).join('') || '<li class="muted">No topics yet</li>'}
        </ul>
      </div>
    `).join('');

    el.querySelectorAll('.knowledge-tree li[data-topic]').forEach(li => {
      const open = () => document.dispatchEvent(new CustomEvent('orbit:open-topic-tools', { detail: { subjectId: li.dataset.subject, topicId: li.dataset.topic } }));
      li.addEventListener('click', open);
      li.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    });
  }

  function init() {
    render();
    document.addEventListener('orbit:plan-updated', render);
  }

  return { init, render };
})();
