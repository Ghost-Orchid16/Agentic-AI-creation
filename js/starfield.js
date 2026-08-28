const Starfield = (() => {
  let canvas, ctx, w, h, stars, nebulae, scrollOffset = 0, raf;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeStars(count) {
    const layers = [];
    for (let i = 0; i < count; i++) {
      layers.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        depth: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
      });
    }
    return layers;
  }

  function makeNebulae() {
    return [
      { x: 0.2, y: 0.25, r: 420, hue: 'rgba(139,123,255,', drift: 0.00015 },
      { x: 0.8, y: 0.2, r: 360, hue: 'rgba(67,224,255,', drift: 0.0002 },
      { x: 0.5, y: 0.8, r: 460, hue: 'rgba(255,107,214,', drift: 0.00012 },
    ];
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    const opacityVar = getComputedStyle(document.documentElement).getPropertyValue('--nebula-opacity').trim() || '0.4';
    const starOpacityVar = getComputedStyle(document.documentElement).getPropertyValue('--star-opacity').trim() || '1';

    nebulae.forEach((n, i) => {
      const cx = n.x * w + Math.sin(t * n.drift + i) * 60;
      const cy = n.y * h + Math.cos(t * n.drift + i) * 40 + scrollOffset * (0.02 + i * 0.01);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.r);
      grad.addColorStop(0, n.hue + opacityVar + ')');
      grad.addColorStop(1, n.hue + '0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    stars.forEach(s => {
      const twinkle = (Math.sin(t * s.speed + s.phase) + 1) / 2;
      const y = (s.y + scrollOffset * s.depth) % h;
      ctx.beginPath();
      ctx.arc(s.x, y < 0 ? y + h : y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(0.25 + twinkle * 0.75) * starOpacityVar})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  function onScroll() {
    const el = document.getElementById('main');
    scrollOffset = el ? el.scrollTop * 0.15 : window.scrollY * 0.15;
  }

  function init() {
    canvas = document.getElementById('starfield');
    ctx = canvas.getContext('2d');
    resize();
    stars = makeStars(Math.min(220, Math.floor((w * h) / 6000)));
    nebulae = makeNebulae();
    window.addEventListener('resize', resize);
    const mainEl = document.getElementById('main');
    if (mainEl) mainEl.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll);
    raf = requestAnimationFrame(draw);
  }

  return { init };
})();
