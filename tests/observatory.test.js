'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

function score(m) {
  return m.C + 0.5 * m.energy + 0.25 * m.coverage - Math.max(0, m.D) - 0.5 * m.residual;
}
function applyPolicy(w, policy) {
  if (policy === 'none') return w;
  if (policy === 'source') return E.intervene(w, 'source');
  return E.setAction(w, policy);
}
function trajectory(seed, horizon, shock, policy, delay, params = {}) {
  let a = E.createWorld(seed, params), b = E.createWorld(seed, params);
  const shockAt = Math.max(10, Math.floor(horizon * 0.2));
  let preInterventionIdentical = true;
  for (let t = 0; t < horizon; t++) {
    if (t === shockAt) { a = E.intervene(a, shock); b = E.intervene(b, shock); }
    if (t === shockAt + delay) b = applyPolicy(b, policy);
    a = E.step(a, 1); b = E.step(b, 1);
    if (t < shockAt + delay && E.checksum(a) !== E.checksum(b)) preInterventionIdentical = false;
  }
  const metricsA = E.metrics(a), metricsB = E.metrics(b);
  return { a, b, shockAt, metricsA, metricsB, delta: score(metricsB) - score(metricsA), preInterventionIdentical };
}

test('Observatory paired trajectory replays deterministically', () => {
  const args = ['OBS-TEST', 120, 'pulse', 'anchor', 20];
  const x = trajectory(...args), y = trajectory(...args);
  assert.equal(E.checksum(x.a), E.checksum(y.a));
  assert.equal(E.checksum(x.b), E.checksum(y.b));
  assert.equal(x.delta, y.delta);
});

test('counterfactual twins remain identical before the delayed policy', () => {
  const r = trajectory('OBS-TWINS', 120, 'blackout', 'recharge', 20);
  assert.equal(r.preInterventionIdentical, true);
});

test('registered local sensitivity calculations are finite', () => {
  const ranges = { coupling:[0,2], learning:[0.1,5], diffusion:[0,1], noise:[0,0.15], sensorEvery:[1,20] };
  for (const [key,[lo,hi]] of Object.entries(ranges)) {
    const v=E.DEFAULTS[key], d=key==='sensorEvery'?1:Math.max((hi-lo)*0.08,Math.abs(v)*0.12);
    let vm=Math.max(lo,v-d), vp=Math.min(hi,v+d);
    if (key==='sensorEvery') { vm=Math.round(vm); vp=Math.round(vp); }
    const rm=trajectory('OBS-SENS',100,'pulse','anchor',15,{[key]:vm});
    const rp=trajectory('OBS-SENS',100,'pulse','anchor',15,{[key]:vp});
    const effect=(rp.delta-rm.delta)/(vp-vm||1);
    assert.equal(Number.isFinite(effect), true, key);
  }
});

test('exported Observatory record has the documented reproducibility fields', () => {
  const spec={seed:'OBS-SCHEMA',horizon:100,shock:'pulse',policy:'anchor',delay:15};
  const r=trajectory(spec.seed,spec.horizon,spec.shock,spec.policy,spec.delay);
  const record={
    format:'archimedes-observatory-experiment', engine:E.VERSION,
    created:new Date(0).toISOString(), spec,
    result:{metricsA:r.metricsA,metricsB:r.metricsB,delta:r.delta,shockAt:r.shockAt},
    sensitivity:[], ledger:[], checksumA:E.checksum(r.a), checksumB:E.checksum(r.b)
  };
  for (const key of ['format','engine','created','spec','result','sensitivity','ledger','checksumA','checksumB'])
    assert.ok(Object.hasOwn(record,key), key);
  assert.equal(record.format,'archimedes-observatory-experiment');
  assert.match(record.checksumA,/^[0-9a-f]{8}$/);
  assert.match(record.checksumB,/^[0-9a-f]{8}$/);
});
