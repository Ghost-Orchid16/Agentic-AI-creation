const FocusSession = (() => {
  const SESSION_SECONDS = 25 * 60;
  let remaining = SESSION_SECONDS;
  let handle = null;
  let running = false;
  let selectedSubjectId = null;
  let selectedTopicId = null;

  function fmt(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function populateSelect() {
    const select = document.getElementById('focus-topic-select');
    if (!select) return;
    const prev = select.value;
    const subjects = Subjects.load();
    select.innerHTML = subjects.flatMap(s => s.topics.filter(t => !t.done).map(t =>
      `<option value="${s.id}::${t.id}">${escapeHtml(s.name)} — ${escapeHtml(t.text)}</option>`
    )).join('') || '<option value="">Add topics first</option>';
    if (prev) select.value = prev;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateDisplay() {
    document.getElementById('focus-timer-display').textContent = fmt(remaining);
  }

  function tick() {
    remaining -= 1;
    updateDisplay();
    if (remaining <= 0) complete();
  }

  function start() {
    const select = document.getElementById('focus-topic-select');
    const [subjectId, topicId] = (select.value || '').split('::');
    if (!subjectId) { alert('Add a topic in Study Planner first.'); return; }
    selectedSubjectId = subjectId;
    selectedTopicId = topicId;
    running = true;
    document.getElementById('focus-start-btn').hidden = true;
    document.getElementById('focus-pause-btn').hidden = false;
    document.getElementById('focus-end-btn').hidden = false;
    document.getElementById('focus-timer-topic').textContent = select.selectedOptions[0].textContent;
    handle = setInterval(tick, 1000);
  }

  function pause() {
    running = false;
    clearInterval(handle);
    document.getElementById('focus-pause-btn').textContent = 'Resume';
    document.getElementById('focus-pause-btn').onclick = resume;
  }

  function resume() {
    running = true;
    handle = setInterval(tick, 1000);
    document.getElementById('focus-pause-btn').textContent = 'Pause';
    document.getElementById('focus-pause-btn').onclick = pause;
  }

  function logAndReset(minutes) {
    if (minutes > 0 && selectedSubjectId && selectedTopicId) {
      Subjects.addMinutes(selectedSubjectId, selectedTopicId, minutes);
      Store.logStudyMinutes(minutes);
      Store.logSubjectStudyMinutes(selectedSubjectId, minutes);
    }
    clearInterval(handle);
    running = false;
    remaining = SESSION_SECONDS;
    updateDisplay();
    document.getElementById('focus-start-btn').hidden = false;
    document.getElementById('focus-pause-btn').hidden = true;
    document.getElementById('focus-pause-btn').textContent = 'Pause';
    document.getElementById('focus-pause-btn').onclick = pause;
    document.getElementById('focus-end-btn').hidden = true;
  }

  function complete() {
    const minutes = Math.round((SESSION_SECONDS - 0) / 60);
    document.getElementById('focus-timer-topic').textContent = `Session complete — +${minutes} minutes logged`;
    logAndReset(minutes);
  }

  function endEarly() {
    const elapsedMin = Math.round((SESSION_SECONDS - remaining) / 60);
    document.getElementById('focus-timer-topic').textContent = elapsedMin > 0 ? `Session ended — +${elapsedMin} minutes logged` : 'Session ended';
    logAndReset(elapsedMin);
  }

  function preselect(subjectId, topicId) {
    const select = document.getElementById('focus-topic-select');
    if (select) select.value = `${subjectId}::${topicId}`;
  }

  function init() {
    populateSelect();
    updateDisplay();
    document.addEventListener('orbit:subjects-changed', populateSelect);
    document.getElementById('focus-start-btn').addEventListener('click', start);
    document.getElementById('focus-pause-btn').addEventListener('click', pause);
    document.getElementById('focus-end-btn').addEventListener('click', endEarly);
    document.addEventListener('orbit:start-focus-session', e => { preselect(e.detail.subjectId, e.detail.topicId); start(); });
  }

  return { init, preselect };
})();
