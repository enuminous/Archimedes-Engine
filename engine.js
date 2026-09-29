/* Archimedes Engine 0.1.0 — deterministic, dependency-free simulation kernel. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Archimedes = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.1.0', W = 24, H = 16, DT = 0.1, EPS = 1e-9;
  const ACTIONS = ['survey', 'anchor', 'exchange', 'recharge'];
  const GOALS = ['balance', 'discovery', 'resilience'];
  const DEFAULTS = Object.freeze({ coupling: 0.8, learning: 1.8, diffusion: 0.65, noise: 0.025, sensorEvery: 5 });
  const OBJECTS = Object.freeze([
    { id: 'source', x: 3.5, y: 8, r: 1.15, kind: 'station' },
    { id: 'relay', x: 12, y: 8, r: 0.8, kind: 'station' },
    { id: 'archive', x: 20.5, y: 8, r: 0.9, kind: 'station' },
    { id: 'obstacle-a', x: 8, y: 5.7, r: 1.1, kind: 'solid' },
    { id: 'obstacle-b', x: 16, y: 10.3, r: 1.1, kind: 'solid' }
  ]);
  const WEIGHTS = Object.freeze({
    balance: [1.0, 0.45, 3.0, 0.3, 0.07],
    discovery: [0.45, 0.2, 8.0, 0.2, 0.10],
    resilience: [2.4, 0.65, 0.8, 0.6, 0.03]
  });
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const norm = a => Math.hypot(...a);
  const clone = x => JSON.parse(JSON.stringify(x));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  function random(w) {
    let x = w.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    w.rng = x >>> 0; return w.rng / 4294967296;
  }
  function parameters(overrides = {}) {
    assert(overrides && typeof overrides === 'object' && !Array.isArray(overrides), 'Parameters must be an object.');
    const p = { ...DEFAULTS };
    const limits = { coupling: [0, 2], learning: [0.1, 5], diffusion: [0, 1], noise: [0, 0.15], sensorEvery: [1, 20] };
    for (const [k, v] of Object.entries(overrides)) {
      assert(Object.hasOwn(limits, k), `Unknown parameter: ${k}`);
      assert(Number.isFinite(v) && v >= limits[k][0] && v <= limits[k][1], `Invalid ${k}.`);
      if (k === 'sensorEvery') assert(Number.isInteger(v), 'sensorEvery must be an integer.');
      p[k] = v;
    }
    return p;
  }
  function sample(w, x, y) {
    const ix = clamp(Math.floor(x), 0, W - 1), iy = clamp(Math.floor(y), 0, H - 1);
    return w.field[iy * W + ix];
  }
  function features(w, a) { return [a.x / W, a.y / H, a.energy, sample(w, a.x, a.y)]; }
  function coverage(w) { return w.visited.filter(Boolean).length / (W * H); }
  function observeCell(w, a) { w.visited[clamp(Math.floor(a.y), 0, H - 1) * W + clamp(Math.floor(a.x), 0, W - 1)] = 1; }
  function log(w, type, text) {
    w.events.push({ tick: w.tick, type, text });
    if (w.events.length > 64) w.events.shift();
  }
  function createWorld(seed = 'ARCHIMEDES-001', overrides = {}) {
    assert(typeof seed === 'string' && seed.length > 0 && seed.length <= 80, 'Seed must contain 1–80 characters.');
    const w = { version: VERSION, seed, tick: 0, rng: parseInt(hash(seed), 16) || 1,
      params: parameters(overrides), action: 'survey', goal: 'balance', sourceOn: true,
      blackout: 0, field: [], agents: [], visited: Array(W * H).fill(0),
      events: [], traces: [], evidence: [], counters: { fieldClips: 0, phiClips: 0, collisions: 0 },
      player: { interventions: 0, note: '' } };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      w.field.push(0.12 + 0.5 * Math.exp(-((x + 0.5 - 3.5) ** 2 + (y + 0.5 - 8) ** 2) / 25));
    }
    ['ADA', 'NOETHER'].forEach((name, i) => {
      const a = { id: i, name, x: 4.8, y: 6 + 4 * i, vx: 0, vy: 0, energy: 0.78,
        m: [], previous: [], sensed: 0, lastSeen: 0, phi: 0.8, C: 1, D: 0, R: 0, I: 0,
        residual: 0, baseline: 0, trail: [] };
      a.y += (random(w) - 0.5) * 0.5;
      a.m = features(w, a); a.previous = a.m.slice(); a.sensed = a.m[3];
      w.agents.push(a); observeCell(w, a);
    });
    log(w, 'origin', `Room initialized from seed ${seed}.`);
    trace(w); return w;
  }
  function target(w, a) {
    if (a.energy < 0.22 || w.action === 'recharge') return { x: 3.5, y: 7 + a.id * 2 };
    if (w.action === 'anchor') return a.id ? { x: 20.5, y: 8 } : { x: 12, y: 8 };
    if (w.action === 'exchange') return a.id ? { x: 3.5, y: 8 } : { x: 20.5, y: 8 };
    // Survey path phase is tied to simulation time, so a restored snapshot replays it exactly.
    const points = [[20, 3], [20, 13], [4, 13], [4, 3]];
    const p = points[(Math.floor(w.tick / 180) + 2 * a.id) % points.length];
    return { x: p[0], y: p[1] };
  }
  function updateField(w) {
    const next = new Array(W * H), d = w.params.diffusion;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const j = y * W + x, u = w.field[j];
      // Repeated boundary cell implements zero normal flux.
      const lap = w.field[y * W + Math.max(0, x - 1)] + w.field[y * W + Math.min(W - 1, x + 1)]
        + w.field[Math.max(0, y - 1) * W + x] + w.field[Math.min(H - 1, y + 1) * W + x] - 4 * u;
      const source = w.sourceOn ? 0.16 * Math.exp(-((x + 0.5 - 3.5) ** 2 + (y + 0.5 - 8) ** 2) / 8) : 0;
      const value = u + DT * (d * lap + source - 0.055 * u);
      next[j] = clamp(value);
      if (value !== next[j]) w.counters.fieldClips++;
    }
    w.field = next;
  }
  function move(w, a) {
    const t = target(w, a), dx = t.x - a.x, dy = t.y - a.y, distance = Math.hypot(dx, dy);
    const speed = 1.7 * clamp(a.energy / 0.3, 0.12, 1) * Math.min(1, distance);
    const desired = distance > EPS ? [speed * dx / distance, speed * dy / distance] : [0, 0];
    // Local recursive correction: a lagged self-model acts as a memory-dependent restoring force.
    const memory = [W * a.m[0] - a.x, H * a.m[1] - a.y];
    let ax = 2.2 * (desired[0] - a.vx) + w.params.coupling * a.phi * memory[0];
    let ay = 2.2 * (desired[1] - a.vy) + w.params.coupling * a.phi * memory[1];
    for (const o of OBJECTS.filter(o => o.kind === 'solid')) {
      const ox = a.x - o.x, oy = a.y - o.y, r = Math.hypot(ox, oy);
      if (r < o.r + 1.2 && r > EPS) { const push = 5 * (o.r + 1.2 - r); ax += push * ox / r; ay += push * oy / r; }
    }
    const accel = Math.hypot(ax, ay);
    if (accel > 5) { ax *= 5 / accel; ay *= 5 / accel; }
    a.vx += DT * ax; a.vy += DT * ay;
    const v = Math.hypot(a.vx, a.vy);
    if (v > 2) { a.vx *= 2 / v; a.vy *= 2 / v; }
    a.x += DT * a.vx; a.y += DT * a.vy;
    if (a.x < 0.3 || a.x > W - 0.3) { a.x = clamp(a.x, 0.3, W - 0.3); a.vx = 0; w.counters.collisions++; }
    if (a.y < 0.3 || a.y > H - 0.3) { a.y = clamp(a.y, 0.3, H - 0.3); a.vy = 0; w.counters.collisions++; }
    for (const o of OBJECTS.filter(o => o.kind === 'solid')) {
      const r = dist(a, o), safe = o.r + 0.3;
      if (r < safe) { const ux = r > EPS ? (a.x - o.x) / r : 1, uy = r > EPS ? (a.y - o.y) / r : 0;
        a.x = o.x + safe * ux; a.y = o.y + safe * uy; a.vx = 0; a.vy = 0; w.counters.collisions++; }
    }
    const charge = w.sourceOn && dist(a, OBJECTS[0]) < 2.2 ? 0.075 : 0;
    a.energy = clamp(a.energy + DT * (charge - 0.003 - 0.005 * (a.vx ** 2 + a.vy ** 2)));
    a.trail.push([a.x, a.y]); if (a.trail.length > 100) a.trail.shift();
    observeCell(w, a);
  }
  function updateModel(w, a) {
    const x = features(w, a), old = a.m.slice();
    if (w.blackout === 0 && w.tick % w.params.sensorEvery === 0) {
      a.sensed = clamp(x[3] + w.params.noise * (2 * random(w) - 1)); a.lastSeen = w.tick;
      w.evidence.push({ tick: w.tick, agent: a.id, kind: 'simulated-sensor', value: a.sensed });
      if (w.evidence.length > 40) w.evidence.shift();
    }
    const y = [x[0], x[1], x[2], a.sensed], gain = 1 - Math.exp(-w.params.learning * DT);
    a.m = old.map((v, i) => v + gain * (y[i] - v));
    const dm = a.m.map((v, i) => (v - old[i]) / DT), dx = x.map((v, i) => (v - a.previous[i]) / DT);
    const gap = x.map((v, i) => v - a.m[i]), delta = dx.map((v, i) => v - dm[i]);
    // R is an explicitly local, vector-valued alignment surrogate, not the ambiguous source Jacobian contraction.
    const g = [old[0] - x[0], old[1] - x[1], 0, 0];
    a.R = g.reduce((s, v, i) => s + v * dm[i], 0) / (norm(g) * norm(dm) + EPS);
    a.residual = norm(gap) ** 2 + 0.02 * norm(delta) ** 2;
    a.D = a.residual - 0.06 * a.R;
    a.C = clamp(1 - norm(gap) / (norm(x) + norm(a.m) + EPS));
    const rawPhi = a.phi + DT / 2 * (0.9 * a.phi - 0.9 * a.phi ** 3
      - 1.5 * a.phi * norm(gap) ** 2 - 0.02 * a.phi * norm(delta) ** 2 + 0.1 * a.R);
    a.phi = clamp(rawPhi, 0, 1.5); if (a.phi !== rawPhi) w.counters.phiClips++;
    a.I += DT * a.C; a.baseline = 0.97 * a.baseline + 0.03 * Math.abs(x[3] - a.sensed);
    a.previous = x;
  }
  function metrics(w) {
    const C = mean(w.agents.map(a => a.C)), D = mean(w.agents.map(a => a.D));
    const phi = mean(w.agents.map(a => a.phi)), energy = mean(w.agents.map(a => a.energy));
    const baseline = mean(w.agents.map(a => a.baseline)), residual = mean(w.agents.map(a => a.residual));
    let regime = 'tracking';
    if (energy < 0.25) regime = 'depleted';
    else if (w.blackout > 0) regime = 'occluded';
    else if (C < 0.92 || residual > 0.035) regime = 'divergent';
    else if (w.agents.every(a => Math.hypot(a.vx, a.vy) < 0.12)) regime = 'settled';
    return { C, D, phi, energy, coverage: coverage(w), baseline, residual, regime,
      alarm: D >= 0.09 || phi <= 0.45, time: w.tick * DT };
  }
  function trace(w) {
    w.traces.push({ tick: w.tick, ...metrics(w) }); if (w.traces.length > 180) w.traces.shift();
  }
  function tick(w) {
    w.tick++; updateField(w);
    for (const a of w.agents) { move(w, a); updateModel(w, a); }
    if (w.blackout > 0) w.blackout--;
    if (w.tick % 5 === 0) trace(w);
  }
  function step(input, ticks = 1) {
    assert(Number.isInteger(ticks) && ticks >= 0 && ticks <= 10000, 'Ticks must be an integer from 0 to 10000.');
    const w = clone(input); for (let i = 0; i < ticks; i++) tick(w); return w;
  }
  function setAction(input, action) {
    assert(ACTIONS.includes(action), 'Unknown intention.');
    const w = clone(input); if (w.action !== action) log(w, 'intention', `Intention changed to ${action}.`);
    w.action = action; return w;
  }
  function intervene(input, kind) {
    assert(['pulse', 'blackout', 'source', 'reset-model'].includes(kind), 'Unknown intervention.');
    const w = clone(input); w.player.interventions++;
    if (kind === 'pulse') {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const j = y * W + x, raw = w.field[j] + 0.75 * Math.exp(-((x + 0.5 - 12) ** 2 + (y + 0.5 - 8) ** 2) / 16);
        w.field[j] = clamp(raw); if (raw !== w.field[j]) w.counters.fieldClips++;
      }
    } else if (kind === 'blackout') w.blackout = 80;
    else if (kind === 'source') w.sourceOn = !w.sourceOn;
    else for (const a of w.agents) a.m = [0.5, 0.5, 0.5, 0.5];
    log(w, 'intervention', { pulse: 'Field pulse injected at the relay.', blackout: 'Field sensors occluded for 8 simulation seconds.',
      source: `Source ${w.sourceOn ? 'enabled' : 'disabled'}.`, 'reset-model': 'Self-models reset to a neutral vector.' }[kind]);
    return w;
  }
  function utility(w, origin, previousAction) {
    const m = metrics(w), weight = WEIGHTS[w.goal];
    return weight[0] * m.energy + weight[1] * m.C + weight[2] * (m.coverage - origin)
      - weight[3] * Math.max(0, m.D) - weight[4] * Number(w.action === previousAction);
  }
  function plan(input, options = {}) {
    const depth = options.depth ?? 3, width = options.width ?? 3, horizon = options.horizon ?? 20;
    assert(Number.isInteger(depth) && depth >= 1 && depth <= 4, 'Depth must be 1–4.');
    assert(Number.isInteger(width) && width >= 1 && width <= 4, 'Beam width must be 1–4.');
    assert(Number.isInteger(horizon) && horizon >= 1 && horizon <= 50, 'Horizon must be 1–50 ticks.');
    const origin = coverage(input); let count = 0;
    let beam = [{ world: clone(input), sequence: [], score: 0, path: [] }];
    const nodes = [], alternatives = [];
    for (let level = 0; level < depth; level++) {
      const candidates = [];
      for (const parent of beam) for (const action of ACTIONS) {
        const world = step(setAction(parent.world, action), horizon);
        const sequence = [...parent.sequence, action], id = ++count;
        const score = parent.score + 0.9 ** level * utility(world, origin, parent.world.action);
        const candidate = { world, sequence, score, path: [...parent.path, id] };
        const node = { id, parent: parent.path.at(-1) ?? 0, level: level + 1, action, score, metrics: metrics(world) };
        nodes.push(node); candidates.push(candidate);
        if (level === 0) alternatives.push({ ...node, positions: world.agents.map(a => [a.x, a.y]) });
      }
      candidates.sort((a, b) => b.score - a.score || a.path.at(-1) - b.path.at(-1));
      beam = candidates.slice(0, width);
    }
    const best = beam[0];
    return { depth, width, horizon, evaluated: count, simulatedTicks: count * horizon,
      sequence: best.sequence, score: best.score, path: best.path, nodes, alternatives,
      prediction: metrics(best.world), positions: best.world.agents.map(a => [a.x, a.y]),
      originTick: input.tick, originChecksum: checksum(input), goal: input.goal };
  }
  function counterfactual(input) {
    const branch = intervene(input, 'source');
    return { factual: metrics(step(input, 80)), counterfactual: metrics(step(branch, 80)),
      intervention: 'toggle-source', ticks: 80, provenance: 'paired deterministic simulation; not independent evidence' };
  }
  function checksum(w) { return hash(JSON.stringify(w)); }
  function createSession(seed, p) {
    const world = createWorld(seed, p);
    return { world, cursor: 0, nextId: 1, history: [{ id: 0, parent: null, label: 'Origin', world: clone(world) }] };
  }
  function checkpoint(session, label = 'Checkpoint') {
    assert(typeof label === 'string' && label.length <= 160, 'Checkpoint label too long.');
    const s = clone(session), id = s.nextId++;
    s.history.push({ id, parent: s.cursor, label, world: clone(s.world) }); s.cursor = id;
    if (s.history.length > 96) {
      s.history.shift(); const ids = new Set(s.history.map(n => n.id));
      for (const node of s.history) if (!ids.has(node.parent)) node.parent = null;
    }
    return s;
  }
  function restore(session, id) {
    const s = clone(session), node = s.history.find(n => n.id === id);
    assert(node, 'Checkpoint not found.'); s.world = clone(node.world); s.cursor = id; return s;
  }
  function finiteTree(value, depth = 0) {
    assert(depth < 24, 'Import exceeds nesting limit.');
    if (typeof value === 'number') assert(Number.isFinite(value), 'Non-finite number.');
    else if (Array.isArray(value)) { assert(value.length <= 1000, 'Oversized array.'); value.forEach(v => finiteTree(v, depth + 1)); }
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) {
      assert(!['__proto__', 'prototype', 'constructor'].includes(k), 'Forbidden property.'); finiteTree(v, depth + 1);
    } else assert(value === null || typeof value === 'boolean' || typeof value === 'string', 'Unsupported value.');
    if (typeof value === 'string') assert(value.length <= 1000, 'Oversized string.');
  }
  function number(x, min, max, name) { assert(typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max, `Invalid ${name}.`); }
  function vector(a, length, min, max, name) { assert(Array.isArray(a) && a.length === length, `Invalid ${name}.`); a.forEach(x => number(x, min, max, name)); }
  function validateWorld(w) {
    assert(w && w.version === VERSION, 'Unsupported world version.');
    assert(typeof w.seed === 'string' && w.seed.length > 0 && w.seed.length <= 80, 'Invalid seed.');
    number(w.tick, 0, 1e9, 'tick'); assert(Number.isInteger(w.tick), 'Tick must be integral.');
    number(w.rng, 1, 4294967295, 'random state'); assert(Number.isInteger(w.rng), 'Invalid random state.');
    assert(JSON.stringify(Object.keys(w.params).sort()) === JSON.stringify(Object.keys(DEFAULTS).sort()), 'Missing parameters.'); parameters(w.params);
    assert(ACTIONS.includes(w.action) && GOALS.includes(w.goal), 'Invalid action or goal.');
    assert(typeof w.sourceOn === 'boolean', 'Invalid source state.'); number(w.blackout, 0, 80, 'blackout');
    assert(Number.isInteger(w.blackout), 'Invalid blackout ticks.');
    vector(w.field, W * H, 0, 1, 'field'); vector(w.visited, W * H, 0, 1, 'visited');
    assert(w.visited.every(v => v === 0 || v === 1), 'Invalid visited grid.');
    assert(Array.isArray(w.agents) && w.agents.length === 2, 'Exactly two agents are required.');
    w.agents.forEach((a, i) => {
      assert(a.id === i && a.name === ['ADA', 'NOETHER'][i], 'Invalid agent identity.');
      number(a.x, 0.3, W - 0.3, 'position'); number(a.y, 0.3, H - 0.3, 'position');
      number(a.vx, -2, 2, 'velocity'); number(a.vy, -2, 2, 'velocity');
      for (const k of ['energy', 'C', 'sensed']) number(a[k], 0, 1, k);
      number(a.phi, 0, 1.5, 'phi'); number(a.R, -1, 1, 'R'); number(a.I, 0, 1e9, 'I');
      number(a.D, -1, 100, 'D'); number(a.residual, 0, 100, 'residual'); number(a.baseline, 0, 1, 'baseline');
      number(a.lastSeen, 0, w.tick, 'lastSeen');
      vector(a.m, 4, 0, 1, 'model'); vector(a.previous, 4, 0, 1, 'previous features');
      assert(Array.isArray(a.trail) && a.trail.length <= 100, 'Invalid trail.');
      a.trail.forEach(p => vector(p, 2, 0, W, 'trail'));
      for (const o of OBJECTS.filter(o => o.kind === 'solid')) assert(dist(a, o) >= o.r + 0.3 - 1e-8, 'Agent inside obstacle.');
    });
    assert(w.player && typeof w.player.note === 'string' && w.player.note.length <= 240, 'Invalid player note.');
    number(w.player.interventions, 0, 1e9, 'interventions');
    for (const k of ['fieldClips', 'phiClips', 'collisions']) number(w.counters[k], 0, 1e12, k);
    assert(Array.isArray(w.events) && w.events.length <= 64, 'Invalid events.');
    w.events.forEach(e => { number(e.tick, 0, w.tick, 'event time'); assert(typeof e.type === 'string' && typeof e.text === 'string', 'Invalid event.'); });
    assert(Array.isArray(w.evidence) && w.evidence.length <= 40, 'Invalid evidence.');
    w.evidence.forEach(e => { assert(e.kind === 'simulated-sensor' && [0, 1].includes(e.agent), 'Invalid sensor evidence.'); number(e.value, 0, 1, 'sensor'); number(e.tick, 0, w.tick, 'sensor time'); });
    assert(Array.isArray(w.traces) && w.traces.length <= 180, 'Invalid traces.');
    w.traces.forEach(t => { number(t.tick, 0, w.tick, 'trace time'); for (const k of ['C', 'energy', 'coverage']) number(t[k], 0, 1, `trace ${k}`); number(t.phi, 0, 1.5, 'trace phi'); number(t.D, -1, 100, 'trace D'); });
    return true;
  }
  function exportSession(session) { return JSON.stringify({ format: 'archimedes-session', version: VERSION, session }); }
  function importSession(text) {
    assert(typeof text === 'string' && text.length <= 8_000_000, 'Import is too large (8 MB limit).');
    const data = JSON.parse(text); finiteTree(data);
    assert(data.format === 'archimedes-session' && data.version === VERSION, 'Unsupported session format.');
    const s = data.session; assert(s && Array.isArray(s.history) && s.history.length > 0 && s.history.length <= 96, 'Invalid history.');
    validateWorld(s.world); const seen = new Set();
    for (const node of s.history) {
      assert(Number.isInteger(node.id) && node.id >= 0 && !seen.has(node.id), 'Invalid checkpoint ID.');
      assert(node.parent === null || seen.has(node.parent), 'Invalid history parent.');
      assert(typeof node.label === 'string' && node.label.length <= 160, 'Invalid checkpoint label.');
      validateWorld(node.world); seen.add(node.id);
    }
    assert(seen.has(s.cursor) && Number.isInteger(s.nextId) && s.nextId > Math.max(...seen), 'Invalid history cursor.');
    return clone(s);
  }
  const REGISTRY = Object.freeze([
    { id: 'THOR', operation: 'Validate state bounds, obstacle exclusion and import structure', trigger: 'Import / explicit audit', status: 'Local implementation; canonical equivalence unverified' },
    { id: 'CUBY', operation: 'Expand four intentions; retain a bounded beam recursively', trigger: 'Explore futures / autoplay', status: 'Local implementation; canonical equivalence unverified' },
    { id: 'JANUS', operation: 'Compare source-on/source-off futures from one state', trigger: 'Counterfactual', status: 'Local implementation; canonical equivalence unverified' },
    { id: 'DRAGON', operation: 'Label depletion, occlusion, divergence, settling or tracking', trigger: 'Every metric read', status: 'Heuristic classifier; no attractor proof' },
    { id: 'BORGES', operation: 'Store snapshots with parent pointers and restore branches', trigger: 'Checkpoints / rewind', status: 'Bounded local possibility graph' },
    { id: 'EFMW', operation: 'Update self-model, coherence, divergence and gated feedback', trigger: 'Every integration tick', status: 'Explicit adaptation of the source paper' }
  ]);
  return { VERSION, W, H, DT, EPS, ACTIONS, GOALS, DEFAULTS, OBJECTS, WEIGHTS, REGISTRY,
    createWorld, createSession, step, setAction, intervene, metrics, plan, counterfactual,
    checkpoint, restore, exportSession, importSession, validateWorld, parameters, checksum, clone, target };
});
