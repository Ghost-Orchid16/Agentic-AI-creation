const Clock = (() => {
  function polar(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function tick() {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    const secAngle = (s + ms / 1000) * 6;
    const minAngle = m * 6 + s * 0.1;
    const hourAngle = h * 30 + m * 0.5;

    const hourPos = polar(100, 100, 40, hourAngle);
    const minPos = polar(100, 100, 65, minAngle);
    const secPos = polar(100, 100, 90, secAngle);

    document.getElementById('orbit-hour').setAttribute('cx', hourPos.x);
    document.getElementById('orbit-hour').setAttribute('cy', hourPos.y);
    document.getElementById('orbit-min').setAttribute('cx', minPos.x);
    document.getElementById('orbit-min').setAttribute('cy', minPos.y);
    document.getElementById('orbit-sec').setAttribute('cx', secPos.x);
    document.getElementById('orbit-sec').setAttribute('cy', secPos.y);

    const timeStr = now.toLocaleTimeString();
    document.getElementById('digital-time').textContent = timeStr;
    document.getElementById('digital-date').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function init() {
    tick();
    setInterval(tick, 200);
  }

  return { init };
})();
