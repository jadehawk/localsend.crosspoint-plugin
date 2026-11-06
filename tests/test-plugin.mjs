import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(root, 'localsend.crosspoint-plugin', 'plugin.js'), 'utf8');
const definition = JSON.parse(readFileSync(path.join(root, 'localsend.crosspoint-plugin', 'device.json'), 'utf8'));

function setup(existing = null, { writeFailure = false } = {}) {
  const nodes = new Map();
  const writes = [];
  let registrations = 0;
  class Element {
    constructor() {
      this.value = '';
      this.textContent = '';
      this.style = {};
      this.disabled = false;
      this.children = [];
      this.handlers = {};
    }
    replaceChildren() { this.children = []; }
    appendChild(value) { this.children.push(value); }
    addEventListener(event, callback) { this.handlers[event] = callback; }
    async click() { return this.handlers.click(); }
  }
  const container = {
    innerHTML: '',
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, new Element());
      return nodes.get(selector);
    },
  };
  const get = (id) => container.querySelector('#' + id);
  let registered;
  const ctx = {
    CrossPoint: {
      registerPlugin(fn) {
        registrations += 1;
        registered = fn;
      },
    },
    TextEncoder,
    btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
    document: { createElement: () => new Element() },
    fetch: async (url) => {
      const address = String(url);
      if (address === '/mock/device.json') return { ok: true, json: async () => definition };
      if (address.startsWith('/download?path=')) {
        if (existing === null) return { ok: false };
        return { ok: true, json: async () => existing };
      }
      throw new Error('Unexpected request: ' + address);
    },
  };
  runInNewContext(source, ctx, { timeout: 1500 });
  assert.equal(registrations, 1, 'plugin must register synchronously');
  const api = {
    pluginFile: () => '/mock/device.json',
    async writeFile(filepath, data) {
      writes.push({ filepath, state: JSON.parse(Buffer.from(data, 'base64').toString('utf8')) });
      return writeFailure ? { ok: false } : { ok: true, bytes: data.length };
    },
  };
  registered(container, api);
  return { get, writes, container };
}
async function tick() {
  // Allow promises in the initial fire-and-forget reload() to settle.
  await new Promise((resolve) => setImmediate(resolve));
}

test('browser plugin registers synchronously and loads six real native destination choices', async () => {
  const ui = setup();
  await tick();
  assert.equal(ui.get('localsend-folder').children.length, 6);
  assert.equal(ui.get('localsend-folder').value, '/Books/LocalSend');
  assert.equal(ui.get('localsend-device-id').value, '');
  assert.match(ui.get('localsend-status').textContent, /ready/i);
});

test('loads shared state and saves folder/ID preserving Razor-Crest layout settings', async () => {
  const ui = setup({
    destination: '/Books', device_id: 'X3-Old', layout: 'grid',
    list_thumbnails: true, grid_columns: 3, grid_rows: 2,
  });
  await tick();
  assert.equal(ui.get('localsend-folder').value, '/Books');
  assert.equal(ui.get('localsend-device-id').value, 'X3-Old');
  ui.get('localsend-folder').value = '/Books/LocalSend';
  ui.get('localsend-device-id').value = 'Living_Room';
  await ui.get('localsend-save').click();
  assert.equal(ui.writes.length, 1);
  assert.equal(ui.writes[0].filepath, '/.crosspoint/localsend/localsend.json');
  assert.equal(ui.writes[0].state.destination, '/Books/LocalSend');
  assert.equal(ui.writes[0].state.device_id, 'Living_Room');
  assert.equal(ui.writes[0].state.layout, 'grid');
  assert.equal(ui.writes[0].state.list_thumbnails, true);
  assert.equal(ui.writes[0].state.grid_columns, 3);
});

test('empty custom ID removes override and keeps other preferences intact', async () => {
  const ui = setup({ device_id: 'Custom', destination: '/', layout: 'list' });
  await tick();
  ui.get('localsend-device-id').value = '';
  await ui.get('localsend-save').click();
  assert.equal(ui.writes.length, 1);
  assert.equal('device_id' in ui.writes[0].state, false);
  assert.equal(ui.writes[0].state.layout, 'list');
});

test('bad custom IDs and invalid folders are rejected before any write', async () => {
  const ui = setup();
  await tick();
  for (const id of [' spaces', '../unsafe', 'bad()', 'x'.repeat(33), 'trail ']) {
    ui.get('localsend-device-id').value = id;
    await ui.get('localsend-save').click();
    assert.equal(ui.writes.length, 0, id);
  }
  ui.get('localsend-device-id').value = 'Normal';
  ui.get('localsend-folder').value = '/NotAllowed';
  await ui.get('localsend-save').click();
  assert.equal(ui.writes.length, 0);
});

test('save errors appear to user without disabling further attempts', async () => {
  const ui = setup(null, { writeFailure: true });
  await tick();
  await ui.get('localsend-save').click();
  assert.match(ui.get('localsend-status').textContent, /Save failed/i);
  assert.equal(ui.get('localsend-save').disabled, false);
});

test('browser UI does not claim it can run the native receiver', async () => {
  const ui = setup();
  await tick();
  assert.match(ui.container.innerHTML, /does not start a receiver/i);
  assert.match(ui.container.innerHTML, /native LocalSend receiver/i);
});
