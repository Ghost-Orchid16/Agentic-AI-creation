const Settings = (() => {
  function loadForm() {
    const cfg = AIBridge.getConfig();
    document.getElementById('api-endpoint').value = cfg.endpoint || '';
    document.getElementById('api-model').value = cfg.model || '';
    document.getElementById('api-key').value = cfg.key || '';
  }

  function init() {
    loadForm();
    document.getElementById('settings-form').addEventListener('submit', e => {
      e.preventDefault();
      AIBridge.setConfig({
        endpoint: document.getElementById('api-endpoint').value.trim(),
        model: document.getElementById('api-model').value.trim(),
        key: document.getElementById('api-key').value.trim(),
      });
      document.dispatchEvent(new CustomEvent('orbit:ai-config-changed'));
      alert('Saved! Orbit will now try to use your AI endpoint.');
    });
    document.getElementById('clear-api-btn').addEventListener('click', () => {
      AIBridge.setConfig({ endpoint: '', model: '', key: '' });
      loadForm();
      document.dispatchEvent(new CustomEvent('orbit:ai-config-changed'));
    });
  }

  return { init };
})();
