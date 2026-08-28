const Profile = (() => {
  const KEY = 'orbit_profile';
  const AVATARS = ['🧑‍🎓', '👩‍🎓', '🧑‍💻', '🦉', '🚀', '🪐', '⭐', '🎯'];

  function get() { return Store.get(KEY, { name: 'Student', avatar: '🧑‍🎓' }); }
  function set(profile) { Store.set(KEY, profile); document.dispatchEvent(new CustomEvent('orbit:profile-changed')); }

  function applyToChrome() {
    const p = get();
    document.querySelectorAll('#profile-name-mini').forEach(el => el.textContent = p.name);
    document.querySelectorAll('#profile-avatar-mini, #profile-avatar-topbar').forEach(el => el.textContent = p.avatar);
  }

  function renderAvatarPicker() {
    const wrap = document.getElementById('avatar-picker');
    const p = get();
    wrap.innerHTML = AVATARS.map(a => `<button type="button" class="avatar-opt ${a === p.avatar ? 'active' : ''}" data-avatar="${a}">${a}</button>`).join('');
    wrap.querySelectorAll('.avatar-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function init() {
    const p = get();
    document.getElementById('profile-name-input').value = p.name;
    renderAvatarPicker();
    applyToChrome();

    document.getElementById('profile-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('profile-name-input').value.trim() || 'Student';
      const avatarBtn = document.querySelector('.avatar-opt.active');
      set({ name, avatar: avatarBtn ? avatarBtn.dataset.avatar : p.avatar });
      applyToChrome();
    });
  }

  return { init, get, applyToChrome };
})();
