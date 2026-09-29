const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const close = (a, b, tol = 1e-10) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('neutral initialization has matching model, C=1, D=0, R=0', () => {
  const w = E.createWorld(); E.validateWorld(w);
  for (const a of w.agents) { close(a.C, 1); close(a.D, 0); close(a.R, 0); assert.deepEqual(a.m, a.previous); }
});
test('fixed seed and action/intervention schedule replay exactly', () => {
  const run = () => E.step(E.intervene(E.step(E.setAction(E.createWorld('REPLAY'), 'anchor'), 43), 'pulse'), 77);
  assert.deepEqual(run(), run());
});
test('different seeds produce distinct initial states', () => {
  assert.notEqual(E.checksum(E.createWorld('A')), E.checksum(E.createWorld('B')));
});
test('integrator is pure and zero steps preserve the complete state', () => {
  const w = E.createWorld(), before = E.checksum(w); E.step(w, 50);
  assert.equal(E.checksum(w), before); assert.deepEqual(E.step(w, 0), w);
});
test('uniform field obeys exact discrete decay under zero source and zero flux', () => {
  const w = E.createWorld(); w.field.fill(0.4); w.sourceOn = false;
  const next = E.step(w); next.field.forEach(f => close(f, 0.4 * (1 - E.DT * 0.055)));
});
test('diffusion conserves mass apart from declared decay without source', () => {
  const w = E.createWorld(); w.sourceOn = false;
  const before = w.field.reduce((a, b) => a + b), next = E.step(w);
  close(next.field.reduce((a, b) => a + b), before * (1 - E.DT * 0.055), 1e-9);
});
test('exponential observer update matches its closed-form held-observation solution', () => {
  const w = E.createWorld(); w.blackout = 10; w.agents[0].m[3] = 0.01;
  const expected = 0.01 + (1 - Math.exp(-w.params.learning * E.DT)) * (w.agents[0].sensed - 0.01);
  close(E.step(w).agents[0].m[3], expected);
});
test('blackout suppresses field updates for exactly its 80 ticks', () => {
  const w = E.intervene(E.createWorld(), 'blackout'), observed = w.agents[0].lastSeen;
  const next = E.step(w, 80); assert.equal(next.blackout, 0); assert.equal(next.agents[0].lastSeen, observed);
  assert.equal(E.step(next, 5).agents[0].lastSeen, 85);
});
test('bounded parameters satisfy explicit field positivity condition', () => {
  close(E.DT * (4 * 1 + 0.055), 0.4055); assert.throws(() => E.parameters({ diffusion: 3 }));
  assert.throws(() => E.parameters({ coupling: NaN })); assert.throws(() => E.parameters({ arbitrary: 0 }));
});
test('state and obstacle bounds hold across seeds, extreme parameters and interventions', () => {
  for (let i = 0; i < 6; i++) {
    let w = E.createWorld(`BOUNDS-${i}`, { coupling: i % 2 ? 2 : 0, learning: i % 2 ? 0.1 : 5, noise: 0.15, diffusion: 1 });
    for (let j = 0; j < 6; j++) {
      w = E.intervene(w, ['pulse', 'blackout', 'source', 'reset-model'][j % 4]);
      w = E.step(E.setAction(w, E.ACTIONS[j % 4]), 150); E.validateWorld(w);
    }
  }
});
test('recursive coupling is causally active under matched seeds', () => {
  const a = E.step(E.createWorld('ABLATE', { coupling: 0 }), 100), b = E.step(E.createWorld('ABLATE', { coupling: 0.8 }), 100);
  assert.ok(Math.abs(a.agents[0].x - b.agents[0].x) > 0.01);
  assert.equal(a.rng, b.rng); // Same count and sequence of simulated sensor draws.
});
test('pulse changes the field but preserves the source input snapshot', () => {
  const w = E.createWorld(), before = E.checksum(w), p = E.intervene(w, 'pulse');
  assert.equal(E.checksum(w), before); assert.ok(p.field.reduce((a, b) => a + b) > w.field.reduce((a, b) => a + b));
  assert.equal(p.player.interventions, 1);
});
test('planner isolates futures and respects bounded expansion accounting', () => {
  const w = E.createWorld('SEARCH'), before = E.checksum(w), p = E.plan(w, { depth: 3, width: 3 });
  assert.equal(E.checksum(w), before); assert.equal(p.evaluated, 4 + 12 + 12);
  assert.equal(p.simulatedTicks, 560); assert.equal(p.sequence.length, 3); assert.equal(p.alternatives.length, 4);
  assert.ok(p.path.every(id => p.nodes.some(n => n.id === id)));
});
test('one-level selection equals highest first-level utility', () => {
  const p = E.plan(E.createWorld(), { depth: 1 });
  assert.equal(p.score, Math.max(...p.alternatives.map(n => n.score)));
  assert.equal(p.sequence[0], p.alternatives.find(n => n.score === p.score).action);
});
test('planner is deterministic and rejects unbounded recursion settings', () => {
  const w = E.createWorld(); assert.deepEqual(E.plan(w), E.plan(w));
  assert.throws(() => E.plan(w, { depth: 100 })); assert.throws(() => E.plan(w, { width: 0 }));
});
test('counterfactual leaves live state intact and source toggle has consequences', () => {
  const w = E.setAction(E.createWorld(), 'recharge'), before = E.checksum(w), p = E.counterfactual(w);
  assert.equal(E.checksum(w), before); assert.ok(p.factual.energy > p.counterfactual.energy);
});
test('checkpoint restore reproduces continuation including random state', () => {
  let s = E.createSession('RESTORE'); s.world = E.step(s.world, 39); s = E.checkpoint(s, 'before');
  const expected = E.step(s.world, 73); s.world = E.intervene(s.world, 'blackout'); s = E.checkpoint(s, 'branch');
  s = E.restore(s, 1); assert.deepEqual(E.step(s.world, 73), expected);
  s.world = E.intervene(s.world, 'pulse'); s = E.checkpoint(s, 'new branch'); assert.equal(s.history.at(-1).parent, 1);
});
test('history cap retains a valid directed acyclic graph', () => {
  let s = E.createSession(); for (let i = 0; i < 101; i++) s = E.checkpoint(s, 'bounded');
  assert.equal(s.history.length, 96); assert.equal(s.history[0].parent, null); E.importSession(E.exportSession(s));
});
test('JSON export/import round trip reproduces the next trajectory', () => {
  let s = E.createSession(); s.world = E.step(E.intervene(s.world, 'pulse'), 65); s = E.checkpoint(s, 'pulse');
  const restored = E.importSession(E.exportSession(s)); assert.deepEqual(restored, s);
  assert.deepEqual(E.step(restored.world, 40), E.step(s.world, 40));
});
test('imports reject malformed data atomically', () => {
  const s = E.createSession(), source = E.exportSession(s);
  for (const mutate of [x => { x.session.world.field[0] = null; }, x => { x.session.world.agents[0].phi = 9; },
    x => { x.session.history[0].parent = 99; }, x => { x.version = '999'; }, x => { x.session.world.params.coupling = -1; }]) {
    const data = JSON.parse(source); mutate(data); assert.throws(() => E.importSession(JSON.stringify(data)));
  }
  assert.throws(() => E.importSession('{"__proto__":{}}')); assert.equal(E.exportSession(s), source);
});
test('simulator evidence cannot be relabeled as external evidence by import', () => {
  const s = E.createSession(); s.world = E.step(s.world, 5);
  const data = JSON.parse(E.exportSession(s)); data.session.world.evidence[0].kind = 'independent-experiment';
  assert.throws(() => E.importSession(JSON.stringify(data)));
});
test('identity integral is an accumulating statistic, not a convergent state component', () => {
  const w = E.step(E.createWorld(), 100); assert.ok(w.agents[0].I > 9 && w.agents[0].I <= 10 + 1e-9);
});
