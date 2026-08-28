const Music = (() => {
  const KEY = 'orbit_playlist';
  const DEFAULT_TRACKS = [
    { name: 'Deep Focus', artist: 'Demo Track', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: 'Lo-fi Orbit', artist: 'Demo Track', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: 'Night Study', artist: 'Demo Track', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'Calm Waves', artist: 'Demo Track', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ];

  let audio, current = -1, tracks = [];

  function load() {
    tracks = Store.get(KEY, null) || DEFAULT_TRACKS.map(t => ({ ...t, id: Store.uid() }));
    Store.set(KEY, tracks);
  }
  function save() { Store.set(KEY, tracks); }

  function fmtTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderList() {
    const ul = document.getElementById('playlist');
    ul.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = i === current ? 'playing' : '';
      li.innerHTML = `<span>🎧 ${escapeHtml(t.name)} <small style="opacity:.6">— ${escapeHtml(t.artist || '')}</small></span><button class="p-remove" data-i="${i}">✕</button>`;
      li.addEventListener('click', e => {
        if (e.target.classList.contains('p-remove')) return;
        playTrack(i);
      });
      ul.appendChild(li);
    });
    ul.querySelectorAll('.p-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.i, 10);
        if (i === current) { audio.pause(); current = -1; }
        tracks.splice(i, 1);
        save();
        renderList();
      });
    });
  }

  function playTrack(i) {
    if (!tracks[i]) return;
    current = i;
    audio.src = tracks[i].url;
    audio.play().catch(() => {});
    document.getElementById('now-title').textContent = tracks[i].name;
    document.getElementById('now-artist').textContent = tracks[i].artist || 'Custom track';
    renderList();
  }

  function togglePlay() {
    if (current === -1 && tracks.length) { playTrack(0); return; }
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function initSearch() {
    const form = document.getElementById('yt-search-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('yt-search-input').value.trim();
      if (!q) return;
      const frame = document.getElementById('yt-embed');
      const link = document.getElementById('yt-open-link');
      frame.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}`;
      link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      document.getElementById('yt-embed-wrap').hidden = false;
    });
  }

  function init() {
    audio = document.getElementById('audio');
    load();
    renderList();
    initSearch();

    const btnPlay = document.getElementById('btn-play');
    const eq = document.getElementById('eq');
    const seek = document.getElementById('seek');
    const volume = document.getElementById('volume');

    btnPlay.addEventListener('click', togglePlay);
    document.getElementById('btn-next').addEventListener('click', () => playTrack((current + 1 + tracks.length) % tracks.length));
    document.getElementById('btn-prev').addEventListener('click', () => playTrack((current - 1 + tracks.length) % tracks.length));

    audio.addEventListener('play', () => { btnPlay.textContent = '⏸'; eq.classList.add('playing'); });
    audio.addEventListener('pause', () => { btnPlay.textContent = '▶'; eq.classList.remove('playing'); });
    audio.addEventListener('timeupdate', () => {
      seek.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      document.getElementById('time-cur').textContent = fmtTime(audio.currentTime);
      document.getElementById('time-dur').textContent = fmtTime(audio.duration);
    });
    audio.addEventListener('ended', () => playTrack((current + 1) % tracks.length));

    seek.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
    });
    volume.addEventListener('input', () => { audio.volume = parseFloat(volume.value); });
    audio.volume = parseFloat(volume.value);

    document.getElementById('add-track-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('track-name').value.trim() || 'Untitled track';
      const url = document.getElementById('track-url').value.trim();
      if (!url) return;
      tracks.push({ id: Store.uid(), name, artist: 'Added by you', url });
      save();
      renderList();
      e.target.reset();
    });
  }

  return { init };
})();
