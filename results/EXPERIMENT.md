# AE-SIM-001 — executed development comparison

Twelve frozen seeds (1001–1012), 300 ticks (30 simulation seconds), pulse at tick 80, blackout at tick 160. Policies share initial conditions and pseudorandom streams. Default balance objective. Results are internal simulator measurements, not independent experiments.

| Policy | Mean terminal energy | Mean coverage | Mean C | Mean signed D | Alarm fraction | Mean run ms |
|---|---:|---:|---:|---:|---:|---:|
| fixed-survey | 0.6660 | 10.70% | 0.97324 | 0.04260 | 0.1333 | 63.1 |
| greedy-depth1 | 0.8478 | 13.98% | 0.96954 | 0.05326 | 0.0372 | 112.8 |
| recursive-depth3 | 0.8334 | 16.15% | 0.96925 | 0.05404 | 0.0497 | 378.3 |
| no-feedback-depth3 | 0.8133 | 17.23% | 0.96258 | 0.05867 | 0.1000 | 371.5 |

Interpretation: these objectives trade off energy, coverage, self-model agreement, and repeated actions. Higher coverage is not necessarily a better balance score. Removing feedback changes both trajectories and the planner’s chosen policies. It is a causal ablation of this implementation, not isolation of a new physical effect. Alarms use illustrative, uncalibrated thresholds. No false-alarm rate or lead-time advantage is inferred. Timing includes planning and simulation on one shared runtime, not a controlled hardware benchmark.

The seeds vary initial agent positions and sensor noise slightly. Twelve similar rooms provide limited diversity. The planner has privileged simulator state. No significance test, confidence claim, independence claim, or ME-102 pass is assigned.

Reproduce with `npm run experiment`. Numeric trajectories and checksums should replay on the same JavaScript engine; wall time will vary. Floating-point behavior across different engines is not guaranteed bit-for-bit.

Runtime: v24.19.0, linux/x64. Raw run records: [experiment.json](experiment.json).
