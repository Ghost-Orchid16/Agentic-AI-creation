const Scene3D = (() => {
  let renderer, scene, camera, canvas;
  let envGroup, starPoints, dustPoints, core, planetsGroup;
  let raf = null;
  let currentTheme = 'cosmos';
  let currentSection = 'dashboard';
  let reducedMotion = false;
  let lowPower = false;
  let hoveredPlanet = null;
  const clock = { t: 0 };

  const THEME_PRESETS = {
    cosmos: { bg: null, star: 0xbfd0ff, starOpacity: 0.9, dust: [0x6d8cff, 0x57e0c4], dustOpacity: 0.35, ambient: 0x2a2f55, fog: 0x0a0b12 },
    'nebula-light': { bg: null, star: 0x5361e0, starOpacity: 0.28, dust: [0x5361e0, 0x0f9e8f], dustOpacity: 0.12, ambient: 0xdadfff, fog: 0xf5f6fb },
    ocean: { bg: null, star: 0x8fe9ff, starOpacity: 0.55, dust: [0x22b8cf, 0x3ddc97], dustOpacity: 0.4, ambient: 0x0d3540, fog: 0x061a1f, rising: true },
    forest: { bg: null, star: 0x9bffb0, starOpacity: 0.25, dust: [0xc8ff78, 0x52c97a], dustOpacity: 0.55, ambient: 0x14301f, fog: 0x0b1410, firefly: true },
    sunset: { bg: null, star: 0xffd6b0, starOpacity: 0.4, dust: [0xf2825f, 0xeab15a], dustOpacity: 0.5, ambient: 0x3a1f24, fog: 0x150f16, ember: true },
  };

  const SECTION_PRESETS = {
    dashboard: { fov: 50, particleMul: 1, showPlanets: true },
    planner: { fov: 46, particleMul: 0.8, showPlanets: false },
    doubt: { fov: 42, particleMul: 0.55, showPlanets: false },
    music: { fov: 44, particleMul: 0.5, showPlanets: false },
    progress: { fov: 50, particleMul: 1, showPlanets: true },
    targets: { fov: 46, particleMul: 0.7, showPlanets: false },
    goals: { fov: 46, particleMul: 0.7, showPlanets: false },
    settings: { fov: 40, particleMul: 0.35, showPlanets: false },
  };

  function sizes() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function makeSoftSprite(color) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const hex = '#' + color.toString(16).padStart(6, '0');
    grad.addColorStop(0, hex);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function buildStars(count) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 60 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ size: 0.55, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat);
    return pts;
  }

  function buildDust(count) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 30;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      seeds[i] = Math.random() * 1000;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.userData.seeds = seeds;
    const mat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat);
    return pts;
  }

  function applyTheme(theme) {
    const p = THEME_PRESETS[theme] || THEME_PRESETS.cosmos;
    scene.fog = new THREE.FogExp2(p.fog, 0.006);
    renderer.setClearColor(p.fog, theme === 'nebula-light' ? 0 : 1);

    starPoints.material.color.setHex(p.star);
    starPoints.material.opacity = p.starOpacity;

    dustPoints.material.map = makeSoftSprite(p.dust[0]);
    dustPoints.material.color.setHex(p.dust[1]);
    dustPoints.material.opacity = p.dustOpacity;
    dustPoints.material.needsUpdate = true;

    scene.children.forEach(c => { if (c.isAmbientLight) c.color.setHex(p.ambient); });
  }

  function buildPlanetsGroup() {
    const g = new THREE.Group();
    scene.add(g);
    return g;
  }

  function clearPlanets() {
    while (planetsGroup.children.length) {
      const pivot = planetsGroup.children.pop();
      pivot.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
  }

  function colorForSubject(pct, urgencyDays) {
    // weak/urgent -> warm red-orange, strong/safe -> cool bright
    const urgency = Math.max(0, Math.min(1, 1 - urgencyDays / 14));
    const weakness = Math.max(0, Math.min(1, 1 - pct / 100));
    const t = Math.max(urgency, weakness);
    const cool = new THREE.Color(0x57e0c4);
    const warm = new THREE.Color(0xff6b57);
    return cool.lerp(warm, t);
  }

  function setPlanets(subjects) {
    clearPlanets();
    if (!subjects || subjects.length === 0) return;
    const maxDays = Math.max(1, ...subjects.map(s => Math.max(0, s.daysLeft)));
    subjects.forEach((s, i) => {
      const radius = 6 + (Math.max(0, s.daysLeft) / maxDays) * 16;
      const size = 0.9 + (s.topicCount ? Math.min(1, s.topicCount / 12) : 0) * 0.6;
      const color = colorForSubject(s.pct, s.daysLeft);

      const pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * Math.PI * 2;
      pivot.userData.speed = 0.05 + Math.random() * 0.05;
      planetsGroup.add(pivot);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2;
      pivot.add(ring);

      const planet = new THREE.Mesh(
        new THREE.IcosahedronGeometry(size, 1),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.5, metalness: 0.1, flatShading: true })
      );
      planet.position.set(radius, 0, 0);
      planet.userData.subjectId = s.id;
      planet.userData.subjectName = s.name;
      planet.userData.baseScale = 1;
      pivot.add(planet);
    });
  }

  function onResize() {
    if (!renderer) return;
    const { w, h } = sizes();
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function getPlanetMeshes() {
    const out = [];
    planetsGroup.children.forEach(pivot => pivot.children.forEach(c => { if (c.userData.subjectId) out.push(c); }));
    return out;
  }

  function initPointerEvents() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function updatePointer(e) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    canvas.addEventListener('pointermove', e => {
      if (!SECTION_PRESETS[currentSection] || !SECTION_PRESETS[currentSection].showPlanets) return;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(getPlanetMeshes());
      if (hits.length) {
        canvas.style.cursor = 'pointer';
        if (hoveredPlanet !== hits[0].object) {
          if (hoveredPlanet) hoveredPlanet.scale.setScalar(1);
          hoveredPlanet = hits[0].object;
          hoveredPlanet.scale.setScalar(1.25);
        }
      } else {
        canvas.style.cursor = '';
        if (hoveredPlanet) { hoveredPlanet.scale.setScalar(1); hoveredPlanet = null; }
      }
    });

    canvas.addEventListener('click', e => {
      if (!hoveredPlanet) return;
      document.dispatchEvent(new CustomEvent('orbit:planet-clicked', { detail: { subjectId: hoveredPlanet.userData.subjectId, subjectName: hoveredPlanet.userData.subjectName } }));
    });
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    clock.t += reducedMotion ? 0 : 0.01;

    if (!reducedMotion) {
      envGroup.rotation.y += 0.00035;
      core.rotation.y += 0.002;
      const pulse = 1 + Math.sin(clock.t * 1.6) * 0.06;
      core.scale.setScalar(pulse);

      const preset = THEME_PRESETS[currentTheme];
      if (preset.rising || preset.ember || preset.firefly) {
        const pos = dustPoints.geometry.attributes.position;
        const dir = preset.ember ? 1 : preset.rising ? -1 : 0;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) + dir * 0.01;
          if (dir !== 0) {
            if (y > 16) y = -16;
            if (y < -16) y = 16;
            pos.setY(i, y);
          }
        }
        pos.needsUpdate = true;
      }

      planetsGroup.children.forEach(pivot => { pivot.rotation.y += pivot.userData.speed * 0.01; });
    }

    renderer.render(scene, camera);
  }

  function setTheme(theme) {
    currentTheme = theme;
    applyTheme(theme);
  }

  function setSection(section) {
    currentSection = section;
    const preset = SECTION_PRESETS[section] || SECTION_PRESETS.dashboard;
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
    starPoints.material.opacity = (THEME_PRESETS[currentTheme] || THEME_PRESETS.cosmos).starOpacity * preset.particleMul;
    dustPoints.material.opacity = (THEME_PRESETS[currentTheme] || THEME_PRESETS.cosmos).dustOpacity * preset.particleMul;
    planetsGroup.visible = !!preset.showPlanets;
  }

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas || typeof THREE === 'undefined') return false;

    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lowPower = window.innerWidth < 700;

    const { w, h } = sizes();
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.3 : 2));
    renderer.setSize(w, h);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 400);
    camera.position.set(0, 3, 26);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x2a2f55, 1.1));
    const point = new THREE.PointLight(0xffffff, 1.2, 100);
    point.position.set(10, 10, 15);
    scene.add(point);

    envGroup = new THREE.Group();
    scene.add(envGroup);

    starPoints = buildStars(lowPower ? 900 : 2200);
    dustPoints = buildDust(lowPower ? 90 : 220);
    envGroup.add(starPoints, dustPoints);

    core = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xffdc8a, emissive: 0xffb35a, emissiveIntensity: 1.1, roughness: 0.3 })
    );
    envGroup.add(core);

    planetsGroup = buildPlanetsGroup();
    planetsGroup.visible = false;

    currentTheme = document.documentElement.getAttribute('data-theme') || 'cosmos';
    applyTheme(currentTheme);
    initPointerEvents();

    document.addEventListener('orbit:theme-changed', e => setTheme(e.detail.id));
    document.addEventListener('orbit:tab-changed', e => setSection(e.detail.id));

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
      else if (!raf) animate();
    });

    animate();
    return true;
  }

  return { init, setTheme, setSection, setPlanets };
})();
