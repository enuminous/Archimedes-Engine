// Headless DOM-contract tests. This shim does not lay out CSS or replace a browser render review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function harness(saved) {
  const all = [], byId = new Map(), storage = new Map(saved ? [['monolithic.archimedes.v0.1', saved]] : []);
  const draws = [], downloads = [], blobs = new Map(); let clock = 0, frame;
  class Element {
    constructor(tag = 'div') { this.tagName = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this.className = ''; this.textContent = ''; this.value = ''; this.hidden = false; this.checked = false; this.offsetLeft = 0; this.clientWidth = 500; this.files = []; }
    get classList() { const self = this; return {
      contains: c => self.className.split(' ').includes(c),
      add: c => { if (!self.className.split(' ').includes(c)) self.className = `${self.className} ${c}`.trim(); },
      remove: c => { self.className = self.className.split(' ').filter(x => x !== c).join(' '); },
      toggle: (c, value) => { const yes = value ?? !self.className.split(' ').includes(c); yes ? self.classList.add(c) : self.classList.remove(c); }
    }; }
    append(...items) { for (const el of items) { this.children.push(el); el.parent = this; } }
    replaceChildren(...items) { this.children = []; this.append(...items); }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    click() { if (this.tagName === 'a') downloads.push({ href: this.href, name: this.download }); if (this.onclick) return this.onclick(); }
    addEventListener(k, cb) { this[`on${k}`] = cb; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
    querySelector(selector) { return this.children.find(x => selector.startsWith('.') && x.classList.contains(selector.slice(1))) || null; }
    getBoundingClientRect() { return { width: 660, height: 440, left: 0, top: 0, right: 660, bottom: 440 }; }
    getContext() { return new Proxy({}, { get: (_, method) => (...args) => { for (const a of args) if (typeof a === 'number') assert.ok(Number.isFinite(a), `Non-finite canvas value in ${String(method)}`); draws.push(String(method)); }, set: () => true }); }
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const el = new Element(match[1]);
    for (const a of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
      const [_, k, value = ''] = a; el.attrs[k] = value;
      if (k.startsWith('data-')) el.dataset[k.slice(5)] = value;
      if (k === 'class') el.className = value;
      if (k === 'id') { assert.ok(!byId.has(value), `Duplicate HTML ID: ${value}`); el.id = value; byId.set(value, el); }
      if (k === 'value') el.value = value;
      if (['hidden', 'checked'].includes(k)) el[k] = true;
    }
    all.push(el);
  }
  for (const match of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>\s*<option value="([^"]+)"/g)) byId.get(match[1]).value = match[2];
  const document = { hidden: false, body: new Element('body'),
    getElementById: id => { assert.ok(byId.has(id), `Missing HTML control ${id}`); return byId.get(id); },
    createElement: tag => new Element(tag),
    addEventListener: (k, cb) => { document[`on${k}`] = cb; },
    querySelectorAll: selector => all.filter(el => selector.startsWith('.') ? el.classList.contains(selector.slice(1)) : Object.hasOwn(el.attrs, selector.slice(1, -1)))
  };
  const context = { document, console, Blob, performance: { now: () => clock }, devicePixelRatio: 1,
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    URL: { createObjectURL: blob => { const id = `blob:test-${blobs.size}`; blobs.set(id, blob); return id; }, revokeObjectURL() {} },
    setTimeout: (fn, delay) => { if (delay <= 20) fn(); return 1; }, clearTimeout() {},
    requestAnimationFrame: fn => { frame = fn; }, addEventListener() {}
  };
  context.window = context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'engine.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  const el = id => byId.get(id), click = id => el(id).click();
  const change = (id, value) => { el(id).value = value; return el(id).onchange?.(); };
  return { el, click, change, context, storage, draws, downloads, blobs,
    data: () => JSON.parse(storage.get('monolithic.archimedes.v0.1')).session,
    advance: (ms = 100) => { clock += ms; frame(clock); },
    nav: name => all.find(x => x.dataset.view === name).click() };
}

test('UI initializes all controls, agent cards and finite canvas drawing commands', () => {
  const h = harness(); assert.equal(h.el('metric-c').textContent, '1.000');
  assert.equal(h.el('agents').children.length, 2); assert.ok(h.draws.includes('arc'));
  assert.equal(h.el('operator-list').children.length, 6);
});
test('run, pause and step controls advance the fixed-step world', () => {
  const h = harness(); h.click('play'); h.advance(200); h.click('play');
  assert.equal(h.data().world.tick, 2); h.click('step'); assert.equal(h.data().world.tick, 3);
});
test('future exploration is isolated and applying records a chosen intention', () => {
  const h = harness(); h.click('checkpoint'); const before = h.data().world;
  h.click('explore'); assert.equal(h.el('branch-count').textContent, '28 BRANCHES / 3 LEVELS');
  assert.deepEqual(h.data().world, before); assert.equal(h.el('alternatives').children.length, 4);
  h.el('alternatives').children[3].click(); h.click('apply');
  assert.equal(h.data().world.action, 'recharge'); assert.equal(h.el('future-results').hidden, true);
});
test('restoring through the timeline permits a distinct child branch', () => {
  const h = harness(); h.click('step'); h.click('step');
  h.el('history').children[0].click(); h.change('intention', 'anchor');
  assert.equal(h.data().world.tick, 0); assert.equal(h.data().history.at(-1).parent, 0);
  assert.equal(h.data().world.action, 'anchor');
});
test('parameters, goal and literal note persist through controls', () => {
  const h = harness(); h.change('coupling', '0'); h.change('goal', 'resilience');
  h.change('note', '<script>not executable</script>');
  assert.equal(h.data().world.params.coupling, 0); assert.equal(h.data().world.goal, 'resilience');
  assert.equal(h.data().world.player.note, '<script>not executable</script>');
});
test('counterfactual button displays a paired result without advancing the live state', () => {
  const h = harness(); h.click('checkpoint'); const before = h.data().world;
  h.click('janus'); assert.equal(h.el('janus-result').hidden, false);
  assert.match(h.el('janus-result').textContent, /Both are simulated/); assert.deepEqual(h.data().world, before);
});
test('JSON download contains a valid versioned session', async () => {
  const h = harness(); h.click('step'); h.click('export');
  assert.equal(h.downloads.length, 1); const data = await h.blobs.get(h.downloads[0].href).text();
  assert.equal(JSON.parse(data).session.world.tick, 1); assert.equal(h.downloads[0].name, 'archimedes-session-1.json');
});
test('file import rejects malformed content and preserves the prior state', async () => {
  const h = harness(); h.click('step'); const prior = h.data();
  h.el('import-file').files = [{ size: 10, text: async () => '{"bad":0}' }];
  await h.el('import-file').onchange(); assert.deepEqual(h.data(), prior);
  assert.match(h.el('toast').textContent, /Import rejected/);
});
test('valid imported sessions restore through the actual input handler', async () => {
  const h = harness(); h.click('step'); const saved = h.storage.get('monolithic.archimedes.v0.1');
  h.click('step'); h.el('import-file').files = [{ size: saved.length, text: async () => saved }];
  await h.el('import-file').onchange(); assert.equal(h.data().world.tick, 1);
});
test('view navigation pauses the simulation and shows the selected content', () => {
  const h = harness(); h.click('play'); h.nav('mathematics');
  assert.equal(h.el('mathematics').hidden, false); assert.equal(h.el('laboratory').hidden, true);
  assert.equal(h.el('run-status').textContent, 'Paused'); h.nav('registry'); assert.equal(h.el('registry').hidden, false);
});
