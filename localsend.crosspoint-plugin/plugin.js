/* LocalSend browser settings companion.
 * The receiver/listener is a native firmware capability, not a JavaScript server.
 * Register synchronously, per CrossPoint's browser-plugin contract.
 */
CrossPoint.registerPlugin((container, api) => {
  'use strict';

  const STATE_PATH = '/.crosspoint/localsend/localsend.json';
  const DEFAULT_FOLDER = '/Books/LocalSend';
  const FALLBACK_FOLDERS = [
    { title: 'SD Root', path: '/' },
    { title: 'Books', path: '/Books' },
    { title: 'LocalSend', path: '/LocalSend' },
    { title: 'Books/LocalSend', path: '/Books/LocalSend' },
    { title: '.sleep', path: '/.sleep' },
    { title: '.sleep-overlay', path: '/.sleep-overlay' },
  ];
  const safeId = (value) =>
    value === '' || (/^[A-Za-z0-9_ -]{1,32}$/.test(value) && value.trim() === value);
  const status = (text, isError = false) => {
    const node = container.querySelector('#localsend-status');
    node.textContent = text;
    node.style.color = isError ? '#b42318' : '';
  };
  const element = (id) => container.querySelector('#' + id);

  container.innerHTML =
    '<h2>Local Send</h2>' +
    '<p>Configure the native LocalSend receiver. Firmware support is required to accept files; this page does not start a receiver.</p>' +
    '<div class="setting-row"><label class="setting-name" for="localsend-folder">Target download folder</label>' +
    '<span class="setting-control"><select id="localsend-folder"></select></span></div>' +
    '<div class="setting-row"><label class="setting-name" for="localsend-device-id">Device ID</label>' +
    '<span class="setting-control"><input type="text" id="localsend-device-id" maxlength="32" placeholder="Optional custom ID"></span></div>' +
    '<p>Leave Device ID empty for the firmware\'s model-based name (for example, Razor-Crest(X3) on Razor-Crest). ' +
    'Custom IDs appear inside the firmware\'s advertised device name. Letters, numbers, spaces, dashes and underscores only.</p>' +
    '<div class="setting-row"><button type="button" class="btn-small btn-add" id="localsend-save">Save settings</button> ' +
    '<button type="button" class="btn-small" id="localsend-reload">Reload</button></div>' +
    '<p id="localsend-status" role="status">Loading settings...</p>' +
    '<p>Changes take effect the next time you open LocalSend on the reader. ' +
    'Razor-Crest also provides the native Receive, History, and Settings screens; vanilla CrossPoint requires the receiver firmware port.</p>';

  let loaded = {};
  let folders = FALLBACK_FOLDERS;

  async function readJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  }

  function normalizeFolders(value) {
    if (!Array.isArray(value) || value.length === 0 || value.length > 6) return FALLBACK_FOLDERS;
    const found = [];
    for (const entry of value) {
      if (!entry || typeof entry.path !== 'string' || typeof entry.title !== 'string') return FALLBACK_FOLDERS;
      if (!FALLBACK_FOLDERS.some((allowed) => allowed.path === entry.path)) return FALLBACK_FOLDERS;
      if (found.some((existing) => existing.path === entry.path)) return FALLBACK_FOLDERS;
      found.push({ path: entry.path, title: entry.title.slice(0, 48) });
    }
    return found;
  }

  async function reload() {
    status('Loading settings...');
    try {
      if (api && typeof api.pluginFile === 'function') {
        try {
          const definition = await readJson(api.pluginFile('device.json'));
          if (definition) folders = normalizeFolders(definition.native?.folders);
        } catch (_) {
          folders = FALLBACK_FOLDERS;
        }
      }
      const selector = element('localsend-folder');
      selector.replaceChildren();
      for (const entry of folders) {
        const option = document.createElement('option');
        option.value = entry.path;
        option.textContent = entry.title + ' (' + entry.path + ')';
        selector.appendChild(option);
      }
      let config = null;
      try {
        config = await readJson('/download?path=' + encodeURIComponent(STATE_PATH));
      } catch (_) {
        // A fresh installation has no settings file yet.
      }
      loaded = config && typeof config === 'object' && !Array.isArray(config) ? config : {};
      const destination = loaded.destination;
      selector.value = folders.some((entry) => entry.path === destination)
        ? destination
        : folders.some((entry) => entry.path === DEFAULT_FOLDER) ? DEFAULT_FOLDER : folders[0].path;
      element('localsend-device-id').value =
        typeof loaded.device_id === 'string' && safeId(loaded.device_id) ? loaded.device_id : '';
      status('Settings ready. The receiver starts when LocalSend opens on the device.');
    } catch (error) {
      status('Unable to load settings: ' + error.message, true);
    }
  }

  function utf8Base64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  async function save() {
    const destination = element('localsend-folder').value;
    const id = element('localsend-device-id').value;
    if (!folders.some((entry) => entry.path === destination)) {
      status('Choose one of the supported download folders.', true);
      return;
    }
    if (!safeId(id)) {
      status('Device ID must have 1–32 letters, digits, spaces, dashes or underscores, without edge spaces.', true);
      return;
    }
    if (!api || typeof api.writeFile !== 'function') {
      status('This firmware does not expose the browser plugin file-write API.', true);
      return;
    }
    const next = { ...loaded, destination };
    if (id) next.device_id = id;
    else delete next.device_id; // Native firmware falls back to the model.
    const json = JSON.stringify(next);
    if (new TextEncoder().encode(json).length > 4096) {
      status('Settings file is too large.', true);
      return;
    }
    element('localsend-save').disabled = true;
    status('Saving settings...');
    try {
      const result = await api.writeFile(STATE_PATH, utf8Base64(json));
      if (!result || result.ok !== true) throw new Error(result?.error || 'File write failed');
      loaded = next;
      status('Saved. Reopen LocalSend on the reader to apply the changes.');
    } catch (error) {
      status('Save failed: ' + error.message, true);
    } finally {
      element('localsend-save').disabled = false;
    }
  }

  element('localsend-save').addEventListener('click', save);
  element('localsend-reload').addEventListener('click', reload);
  reload();
});
