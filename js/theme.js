const Theme = (() => {
  const THEMES = [
    { id: 'cosmos', label: 'Cosmos', preview: 'linear-gradient(135deg,#06070f,#241a5e)' },
    { id: 'nebula-light', label: 'Nebula', preview: 'linear-gradient(135deg,#f3f2ff,#c9c2ff)' },
    { id: 'ocean', label: 'Ocean', preview: 'linear-gradient(135deg,#041418,#0d5b66)' },
    { id: 'forest', label: 'Forest', preview: 'linear-gradient(135deg,#0b1410,#215c3a)' },
    { id: 'sunset', label: 'Sunset', preview: 'linear-gradient(135deg,#170a17,#8a2f5e)' },
  ];
  const KEY = 'orbit_theme';

  function apply(id) {
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(KEY, id);
    document.querySelectorAll('.theme-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === id);
    });
    document.dispatchEvent(new CustomEvent('orbit:theme-changed', { detail: { id } }));
  }

  function init() {
    const grid = document.getElementById('theme-grid');
    THEMES.forEach(t => {
      const el = document.createElement('div');
      el.className = 'theme-swatch';
      el.dataset.theme = t.id;
      el.style.background = t.preview;
      el.title = t.label;
      el.innerHTML = `<span>${t.label}</span>`;
      el.addEventListener('click', () => apply(t.id));
      grid.appendChild(el);
    });
    const saved = localStorage.getItem(KEY) || 'cosmos';
    apply(saved);
  }

  return { init, apply, THEMES };
})();
