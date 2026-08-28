const Clock = (() => {
  function buildTicks() {
    const g = document.getElementById('clock-ticks');
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const x1 = 100 + Math.sin(angle) * 84;
      const y1 = 100 - Math.cos(angle) * 84;
      const x2 = 100 + Math.sin(angle) * 94;
      const y2 = 100 - Math.cos(angle) * 94;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      g.appendChild(line);
    }
  }

  function tick() {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    document.getElementById('hand-hour').style.transform = `rotate(${h * 30 + m * 0.5}deg)`;
    document.getElementById('hand-min').style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
    document.getElementById('hand-sec').style.transform = `rotate(${s * 6}deg)`;

    document.getElementById('digital-time').textContent = now.toLocaleTimeString();
    document.getElementById('digital-date').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function init() {
    buildTicks();
    tick();
    setInterval(tick, 1000);
  }

  return { init };
})();
