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
  return { get, set, uid, todayKey, logActivity, currentStreak };
})();
