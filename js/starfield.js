const Starfield = (() => {
  let canvas, ctx, w, h, stars, nebulae, fireflies, bubbles, embers, scrollOffset = 0, raf, t0;
  let currentTheme = 'cosmos';
  let currentTab = 'dashboard';

  const SPACE_STRUCTURES = {
    dashboard: 'solar-system',
    planner: 'blackhole',
    doubt: 'cluster',
    music: 'meteors',
    progress: 'rings',
    targets: 'rings',
    goals: 'cluster',
    settings: 'wormhole',
  };

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeStars(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        depth: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
      });
    }
    return arr;
  }

  function makeNebulae() {
    return [
      { x: 0.2, y: 0.25, r: 420, hue: 'rgba(139,123,255,', drift: 0.00015 },
      { x: 0.8, y: 0.2, r: 360, hue: 'rgba(67,224,255,', drift: 0.0002 },
      { x: 0.5, y: 0.8, r: 460, hue: 'rgba(255,107,214,', drift: 0.00012 },
    ];
  }

  function makeFireflies(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ x: Math.random() * w, y: Math.random() * h, phase: Math.random() * Math.PI * 2, speed: 0.0006 + Math.random() * 0.0008, sway: 20 + Math.random() * 30 });
    }
    return arr;
  }

  function makeBubbles(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ x: Math.random() * w, y: Math.random() * h, r: 2 + Math.random() * 5, speed: 0.02 + Math.random() * 0.04, sway: Math.random() * Math.PI * 2 });
    }
    return arr;
  }

  function makeEmbers(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 3, speed: 0.015 + Math.random() * 0.03, sway: Math.random() * Math.PI * 2, hue: Math.random() > 0.5 ? '255,140,90' : '255,200,120' });
    }
    return arr;
  }

  function readVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function drawSpaceBase(t) {
    const nebOp = readVar('--nebula-opacity', '0.4');
    const starOp = readVar('--star-opacity', '1');
    nebulae.forEach((n, i) => {
      const cx = n.x * w + Math.sin(t * n.drift + i) * 60;
      const cy = n.y * h + Math.cos(t * n.drift + i) * 40 + scrollOffset * (0.02 + i * 0.01);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.r);
      grad.addColorStop(0, n.hue + nebOp + ')');
      grad.addColorStop(1, n.hue + '0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });
    stars.forEach(s => {
      const twinkle = (Math.sin(t * s.speed + s.phase) + 1) / 2;
      const y = (s.y + scrollOffset * s.depth) % h;
      ctx.beginPath();
      ctx.arc(s.x, y < 0 ? y + h : y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(0.25 + twinkle * 0.75) * starOp})`;
      ctx.fill();
    });
  }

  function drawSolarSystem(t) {
    const cx = w / 2, cy = h * 0.42;
    ctx.save();
    const sunR = 22;
    const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 3.2);
    sunGrad.addColorStop(0, 'rgba(255,214,120,0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255,160,90,0.35)');
    sunGrad.addColorStop(1, 'rgba(255,160,90,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath(); ctx.arc(cx, cy, sunR * 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffdc8a';
    ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fill();

    const planets = [
      { r: 60, size: 3, speed: 0.00055, color: '138,150,255' },
      { r: 92, size: 5, speed: 0.00038, color: '120,220,200' },
      { r: 128, size: 4, speed: 0.00027, color: '255,140,140' },
      { r: 168, size: 7, speed: 0.00018, color: '255,200,120' },
      { r: 212, size: 4.5, speed: 0.00012, color: '190,150,255' },
    ];
    planets.forEach((p, i) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.ellipse(cx, cy, p.r, p.r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
      const ang = t * p.speed + i * 2;
      const px = cx + Math.cos(ang) * p.r;
      const py = cy + Math.sin(ang) * p.r * 0.4;
      ctx.fillStyle = `rgba(${p.color},0.9)`;
      ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawBlackHole(t) {
    const cx = w / 2, cy = h * 0.4;
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const rad = 70 + i * 26;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad, rad * 0.32, t * 0.0004 + i, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(cx - rad, cy, cx + rad, cy);
      grad.addColorStop(0, 'rgba(255,150,80,0)');
      grad.addColorStop(0.5, `rgba(255,${150 - i * 20},80,${0.5 - i * 0.12})`);
      grad.addColorStop(1, 'rgba(140,90,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    coreGrad.addColorStop(0, 'rgba(0,0,0,1)');
    coreGrad.addColorStop(0.8, 'rgba(10,5,20,0.9)');
    coreGrad.addColorStop(1, 'rgba(10,5,20,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCluster(t) {
    const cx = w * 0.7, cy = h * 0.3;
    for (let i = 0; i < 40; i++) {
      const ang = i * 2.4 + t * 0.0001;
      const rad = (i % 8) * 22 + Math.sin(t * 0.0003 + i) * 6;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * 0.6;
      const tw = (Math.sin(t * 0.002 + i) + 1) / 2;
      ctx.beginPath();
      ctx.arc(x, y, 1 + tw, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${0.3 + tw * 0.6})`;
      ctx.fill();
    }
  }

  function drawMeteors(t) {
    for (let i = 0; i < 4; i++) {
      const cycle = (t * 0.00025 + i * 0.7) % 1.6;
      if (cycle > 1) continue;
      const startX = w * (0.1 + i * 0.25) + w * 0.3;
      const startY = -20;
      const x = startX - cycle * w * 0.5;
      const y = startY + cycle * h * 0.7;
      const grad = ctx.createLinearGradient(x, y, x + 60, y - 60);
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y - 60); ctx.stroke();
    }
  }

  function drawRings(t) {
    const cx = w / 2, cy = h * 0.4;
    for (let i = 0; i < 5; i++) {
      const rad = 20 + i * 34 + Math.sin(t * 0.0004 + i) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(139,123,255,${0.28 - i * 0.045})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawWormhole(t) {
    const cx = w / 2, cy = h * 0.4;
    for (let i = 0; i < 10; i++) {
      const prog = ((t * 0.0003) + i / 10) % 1;
      const rad = prog * 260;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad, rad * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(67,224,255,${(1 - prog) * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawForest() {
    ctx.save();
    ctx.fillStyle = 'rgba(5,15,10,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    let x = 0;
    while (x < w) {
      const th = 60 + Math.sin(x * 0.01) * 30 + (x % 137 < 20 ? 40 : 0);
      ctx.lineTo(x, h - th);
      x += 18;
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    fireflies.forEach(f => {
      const y = (f.y - (performance.now() * f.speed) % h + h) % h;
      const x = f.x + Math.sin(performance.now() * 0.001 + f.phase) * f.sway;
      const glow = (Math.sin(performance.now() * 0.003 + f.phase) + 1) / 2;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,255,120,${0.3 + glow * 0.7})`;
      ctx.fill();
    });
  }

  function drawOcean() {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * (0.3 + i * 0.25));
      for (let x = 0; x <= w; x += 20) {
        ctx.lineTo(x, h * (0.3 + i * 0.25) + Math.sin(x * 0.01 + performance.now() * 0.0006 + i) * 14);
      }
      ctx.strokeStyle = `rgba(67,224,255,${0.08 - i * 0.02})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    bubbles.forEach(b => {
      b.y -= b.speed;
      if (b.y < -10) { b.y = h + 10; b.x = Math.random() * w; }
      const x = b.x + Math.sin(b.y * 0.02 + b.sway) * 8;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,240,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawSunset() {
    const cx = w / 2, cy = h * 0.75;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
    grad.addColorStop(0, 'rgba(255,170,90,0.5)');
    grad.addColorStop(1, 'rgba(255,90,150,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    embers.forEach(e => {
      e.y -= e.speed;
      if (e.y < -10) { e.y = h + 10; e.x = Math.random() * w; }
      const x = e.x + Math.sin(e.y * 0.015 + e.sway) * 10;
      ctx.beginPath();
      ctx.arc(x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${e.hue},0.6)`;
      ctx.fill();
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    if (currentTheme === 'forest') {
      drawForest();
    } else if (currentTheme === 'ocean') {
      drawOcean();
    } else if (currentTheme === 'sunset') {
      drawSunset();
    } else {
      drawSpaceBase(t);
      const structure = SPACE_STRUCTURES[currentTab] || 'solar-system';
      if (structure === 'solar-system') drawSolarSystem(t);
      else if (structure === 'blackhole') drawBlackHole(t);
      else if (structure === 'cluster') drawCluster(t);
      else if (structure === 'meteors') drawMeteors(t);
      else if (structure === 'rings') drawRings(t);
      else if (structure === 'wormhole') drawWormhole(t);
    }
    raf = requestAnimationFrame(draw);
  }

  function onScroll() {
    const el = document.getElementById('main');
    scrollOffset = el ? el.scrollTop * 0.15 : window.scrollY * 0.15;
  }

  function setTab(tabId) { currentTab = tabId; }
  function setTheme(id) { currentTheme = id; }

  function init() {
    canvas = document.getElementById('starfield');
    ctx = canvas.getContext('2d');
    resize();
    stars = makeStars(Math.min(220, Math.floor((w * h) / 6000)));
    nebulae = makeNebulae();
    fireflies = makeFireflies(30);
    bubbles = makeBubbles(35);
    embers = makeEmbers(30);
    window.addEventListener('resize', resize);
    const mainEl = document.getElementById('main');
    if (mainEl) mainEl.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll);
    document.addEventListener('orbit:theme-changed', e => setTheme(e.detail.id));
    document.addEventListener('orbit:tab-changed', e => setTab(e.detail.id));
    currentTheme = document.documentElement.getAttribute('data-theme') || 'cosmos';
    raf = requestAnimationFrame(draw);
  }

  return { init, setTab, setTheme };
})();
