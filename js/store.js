const Store = (() => {
  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }
  function logActivity() {
    const key = 'orbit_activity_days';
    const days = get(key, []);
    const today = todayKey();
    if (!days.includes(today)) {
      days.push(today);
      set(key, days.slice(-400));
    }
  }
  function currentStreak() {
    const days = new Set(get('orbit_activity_days', []));
    let streak = 0;
    const cursor = new Date();
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
  function logStudyMinutes(minutes) {
    if (!minutes) return;
    const key = 'orbit_daily_minutes';
    const map = get(key, {});
    const today = todayKey();
    map[today] = (map[today] || 0) + minutes;
    set(key, map);
    logActivity();
  }
  function studyMinutesOn(dateStr) {
    return get('orbit_daily_minutes', {})[dateStr] || 0;
  }
  function logSubjectStudyMinutes(subjectId, minutes) {
    if (!minutes) return;
    const key = 'orbit_subject_daily_minutes';
    const map = get(key, {});
    const today = todayKey();
    map[today] = map[today] || {};
    map[today][subjectId] = (map[today][subjectId] || 0) + minutes;
    set(key, map);
  }
  function subjectMinutesInRange(subjectId, days) {
    const map = get('orbit_subject_daily_minutes', {});
    const cursor = new Date();
    let total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(cursor);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      total += (map[key] && map[key][subjectId]) || 0;
    }
    return total;
  }
  function last7Days() {
    const out = [];
    const cursor = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(cursor);
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  return { get, set, uid, todayKey, logActivity, currentStreak, logStudyMinutes, studyMinutesOn, last7Days, logSubjectStudyMinutes, subjectMinutesInRange };
})();
