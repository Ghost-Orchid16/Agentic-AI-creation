const OrbitCalendar = (() => {
  const CFG_KEY = 'orbit_calendar_config';
  let accessToken = null;
  let busyEvents = [];
  let tokenClient = null;

  function getConfig() { return Store.get(CFG_KEY, { clientId: '' }); }
  function setConfig(cfg) { Store.set(CFG_KEY, cfg); }
  function isConnected() { return !!accessToken; }

  function loadGis() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) return resolve();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function connect() {
    const cfg = getConfig();
    if (!cfg.clientId) {
      alert('Add your Google OAuth Client ID in Settings first (see README for free setup steps).');
      return;
    }
    await loadGis();
    return new Promise((resolve) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: cfg.clientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: async (resp) => {
          if (resp.error) {
            alert('Google sign-in failed: ' + resp.error);
            resolve(false);
            return;
          }
          accessToken = resp.access_token;
          await fetchEvents();
          document.dispatchEvent(new CustomEvent('orbit:calendar-connected'));
          resolve(true);
        },
      });
      tokenClient.requestAccessToken();
    });
  }

  function disconnect() {
    accessToken = null;
    busyEvents = [];
    document.dispatchEvent(new CustomEvent('orbit:calendar-connected'));
  }

  async function fetchEvents() {
    if (!accessToken) return;
    const now = new Date();
    const timeMin = new Date(now); timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date(now); timeMax.setDate(timeMax.getDate() + 7);
    const url = `https://www.googleapis.com/calendar/v3/events?calendarId=primary&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Calendar fetch failed: ' + res.status);
      const data = await res.json();
      busyEvents = (data.items || [])
        .filter(ev => ev.start && (ev.start.dateTime || ev.start.date))
        .map(ev => ({
          title: ev.summary || 'Busy',
          start: new Date(ev.start.dateTime || ev.start.date),
          end: new Date(ev.end.dateTime || ev.end.date),
        }));
    } catch (err) {
      console.warn('Orbit Calendar fetch failed', err);
      busyEvents = [];
    }
  }

  function eventsOnDate(dateStr) {
    return busyEvents.filter(ev => ev.start.toISOString().slice(0, 10) === dateStr);
  }

  function freeMinutesOnDate(dateStr, dayStartHour, dayEndHour, defaultMinutes) {
    if (!isConnected()) return defaultMinutes;
    const events = eventsOnDate(dateStr).sort((a, b) => a.start - b.start);
    if (events.length === 0) return defaultMinutes;
    const dayStart = new Date(dateStr + 'T00:00:00'); dayStart.setHours(dayStartHour, 0, 0, 0);
    const dayEnd = new Date(dateStr + 'T00:00:00'); dayEnd.setHours(dayEndHour, 0, 0, 0);
    let freeMs = 0;
    let cursor = dayStart;
    events.forEach(ev => {
      const s = ev.start < dayStart ? dayStart : ev.start;
      const e = ev.end > dayEnd ? dayEnd : ev.end;
      if (s > cursor) freeMs += s - cursor;
      if (e > cursor) cursor = e;
    });
    if (dayEnd > cursor) freeMs += dayEnd - cursor;
    return Math.max(30, Math.round(freeMs / 60000));
  }

  function init() {
    const cfg = getConfig();
    document.getElementById('calendar-client-id').value = cfg.clientId || '';
    document.getElementById('calendar-connect-btn').addEventListener('click', async () => {
      const clientId = document.getElementById('calendar-client-id').value.trim();
      setConfig({ clientId });
      await connect();
    });
    document.getElementById('calendar-disconnect-btn').addEventListener('click', disconnect);
    document.addEventListener('orbit:calendar-connected', renderStatus);
    renderStatus();
  }

  function renderStatus() {
    const statusEl = document.getElementById('calendar-status');
    if (!statusEl) return;
    statusEl.textContent = isConnected()
      ? `Connected — ${busyEvents.length} event(s) found in the next 7 days.`
      : 'Not connected.';
    statusEl.classList.toggle('online', isConnected());

    const widget = document.getElementById('calendar-today-widget');
    if (!widget) return;
    if (!isConnected()) { widget.hidden = true; return; }
    widget.hidden = false;
    const today = Store.todayKey();
    const events = eventsOnDate(today).sort((a, b) => a.start - b.start);
    widget.innerHTML = `<h2>📅 Today's Calendar</h2>` + (events.length
      ? `<ul class="cal-events">${events.map(e => `<li>${e.start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}–${e.end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — ${e.title}</li>`).join('')}</ul>`
      : `<p class="muted">No events today — your whole study window is free.</p>`);
  }

  return { init, connect, disconnect, isConnected, freeMinutesOnDate, getConfig, setConfig };
})();
