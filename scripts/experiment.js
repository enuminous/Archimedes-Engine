'use strict';
const fs = require('node:fs'), path = require('node:path'), { performance } = require('node:perf_hooks');
const E = require('../engine.js');
const spec = {
  id: 'AE-SIM-001', version: E.VERSION, kind: 'developmental simulation comparison',
  seeds: Array.from({ length: 12 }, (_, i) => String(1001 + i)), ticks: 300, block: 20,
  interventions: [{ tick: 80, kind: 'pulse' }, { tick: 160, kind: 'blackout' }],
  policies: ['fixed-survey', 'greedy-depth1', 'recursive-depth3', 'no-feedback-depth3'],
  metrics: ['terminal energy', 'terminal coverage', 'mean C', 'mean signed D', 'alarm fraction', 'runtime'],
  claim: 'Descriptive synthetic results only. No external-performance or ME-102 acceptance test.'
};
const rows = [];
for (const seed of spec.seeds) for (const policy of spec.policies) {
  let w = E.createWorld(seed, policy === 'no-feedback-depth3' ? { coupling: 0 } : {});
  let sumC = 0, sumD = 0, alarms = 0, evaluated = 0;
  const started = performance.now();
  for (let tick = 0; tick < spec.ticks; tick++) {
    for (const intervention of spec.interventions) if (tick === intervention.tick) w = E.intervene(w, intervention.kind);
    if (tick % spec.block === 0 && policy !== 'fixed-survey') {
      const p = E.plan(w, { depth: policy === 'greedy-depth1' ? 1 : 3 }); evaluated += p.evaluated;
      w = E.setAction(w, p.sequence[0]);
    }
    w = E.step(w); const m = E.metrics(w); sumC += m.C; sumD += m.D; alarms += Number(m.alarm);
  }
  const elapsedMs = performance.now() - started; E.validateWorld(w);
  rows.push({ seed, policy, ...E.metrics(w), meanC: sumC / spec.ticks, meanD: sumD / spec.ticks,
    alarmFraction: alarms / spec.ticks, elapsedMs, evaluated, checksum: E.checksum(w), counters: w.counters });
}
const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
const summary = spec.policies.map(policy => {
  const r = rows.filter(x => x.policy === policy), result = { policy, n: r.length };
  for (const k of ['energy', 'coverage', 'meanC', 'meanD', 'alarmFraction', 'elapsedMs', 'evaluated']) result[k] = avg(r.map(x => x[k]));
  return result;
});
const result = { spec, runtime: { node: process.version, platform: process.platform, arch: process.arch }, summary, runs: rows };
const root = path.resolve(__dirname, '..'); fs.mkdirSync(path.join(root, 'results'), { recursive: true });
fs.writeFileSync(path.join(root, 'results/experiment.json'), JSON.stringify(result, null, 2) + '\n');
const md = ['# AE-SIM-001 — executed development comparison', '',
  'Twelve frozen seeds (1001–1012), 300 ticks (30 simulation seconds), pulse at tick 80, blackout at tick 160. Policies share initial conditions and pseudorandom streams. Default balance objective. Results are internal simulator measurements, not independent experiments.', '',
  '| Policy | Mean terminal energy | Mean coverage | Mean C | Mean signed D | Alarm fraction | Mean run ms |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...summary.map(r => `| ${r.policy} | ${r.energy.toFixed(4)} | ${(100 * r.coverage).toFixed(2)}% | ${r.meanC.toFixed(5)} | ${r.meanD.toFixed(5)} | ${r.alarmFraction.toFixed(4)} | ${r.elapsedMs.toFixed(1)} |`), '',
  'Interpretation: these objectives trade off energy, coverage, self-model agreement, and repeated actions. Higher coverage is not necessarily a better balance score. Removing feedback changes both trajectories and the planner’s chosen policies. It is a causal ablation of this implementation, not isolation of a new physical effect. Alarms use illustrative, uncalibrated thresholds. No false-alarm rate or lead-time advantage is inferred. Timing includes planning and simulation on one shared runtime, not a controlled hardware benchmark.', '',
  'The seeds vary initial agent positions and sensor noise slightly. Twelve similar rooms provide limited diversity. The planner has privileged simulator state. No significance test, confidence claim, independence claim, or ME-102 pass is assigned.', '',
  'Reproduce with `npm run experiment`. Numeric trajectories and checksums should replay on the same JavaScript engine; wall time will vary. Floating-point behavior across different engines is not guaranteed bit-for-bit.', '',
  `Runtime: ${process.version}, ${process.platform}/${process.arch}. Raw run records: [experiment.json](experiment.json).`, ''].join('\n');
fs.writeFileSync(path.join(root, 'results/EXPERIMENT.md'), md);
let s = E.createSession('ARCHIMEDES-001'); s.world = E.step(s.world, 80); s = E.checkpoint(s, 'Before pulse');
s.world = E.intervene(s.world, 'pulse'); s.world = E.step(s.world, 80); s = E.checkpoint(s, 'After pulse');
s.world = E.intervene(s.world, 'blackout'); s = E.checkpoint(s, 'Sensor blackout');
fs.writeFileSync(path.join(root, 'examples/pulse-and-blackout.json'), E.exportSession(s) + '\n');
console.log(JSON.stringify({ spec: spec.id, runs: rows.length, summary }, null, 2));
