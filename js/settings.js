const Settings = (() => {
  async function refreshStatusBadge() {
    const badge = document.getElementById('ai-status-badge');
    const detail = document.getElementById('ai-status-detail');
    if (!badge) return;
    if (!AIBridge.isConfigured()) {
      badge.textContent = '○ Not connected';
      badge.classList.remove('online');
      if (detail) detail.textContent = 'Add your backend URL below to connect Orbit AI.';
      document.dispatchEvent(new CustomEvent('orbit:ai-config-changed'));
      return;
    }
    badge.textContent = '⋯ Checking…';
    badge.classList.remove('online');
    const status = await AIBridge.checkStatus();
    if (status.reachable && status.configured) {
      badge.textContent = '● ORBIT AI ONLINE';
      badge.classList.add('online');
      if (detail) detail.textContent = 'Your backend is reachable and has an AI key configured.';
    } else if (status.reachable && !status.configured) {
      badge.textContent = '○ Backend has no AI key';
      badge.classList.remove('online');
      if (detail) detail.textContent = 'Reached your backend, but it has no AI_API_KEY set yet — add one in its environment variables.';
    } else {
      badge.textContent = '○ AI connection unavailable';
      badge.classList.remove('online');
      if (detail) detail.textContent = "Could not reach that backend URL. Check it's deployed and running (see BACKEND.md).";
    }
    document.dispatchEvent(new CustomEvent('orbit:ai-config-changed'));
  }

  function init() {
    document.getElementById('backend-url').value = AIBridge.getBackendUrl();
    refreshStatusBadge();

    document.getElementById('settings-form').addEventListener('submit', e => {
      e.preventDefault();
      AIBridge.setBackendUrl(document.getElementById('backend-url').value.trim());
      refreshStatusBadge();
    });
    document.getElementById('clear-api-btn').addEventListener('click', () => {
      AIBridge.setBackendUrl('');
      document.getElementById('backend-url').value = '';
      refreshStatusBadge();
    });
  }

  return { init, refreshStatusBadge };
})();
