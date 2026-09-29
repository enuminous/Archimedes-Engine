# Validation record — Archimedes Engine 0.1.0

Implementation and experiment specification frozen September 27, 2026. Packaging and additional interface-contract checks completed September 28, 2026.

## Executed checks

The suite is run with `npm test`, using Node's built-in test runner. It includes 22 engine checks and 10 interface-contract checks. The detailed machine output is preserved in `results/tests.tap`.

**Executed result: 32 passed, 0 failed, 0 skipped.** Static packaging checks also verified 59 unique interface IDs, all nine local asset/document links, matching embedded/source scripts, and zero external asset dependencies in the standalone HTML. See `results/package-checks.json`.

### Engine checks

1. Neutral initialization: matching self-model, C=1, D=R=0.
2. Exact repeated seed/action/intervention replay.
3. Distinct seeded initial states.
4. Pure integration and zero-step identity.
5. Uniform field's discrete exponential decay.
6. Field mass accounting under source-free diffusion and decay.
7. Observer update against the analytic held-observation solution.
8. Exact blackout duration and sensor resumption cadence.
9. Parameter limits and explicit field positivity condition.
10. State, obstacle, and finite-number bounds over 5,400 ticks across six seeds with extreme allowed parameters and interventions.
11. Causal trajectory change when recursive coupling is disabled under matched random streams.
12. Field-pulse effects and input-state preservation.
13. Planner isolation and exact finite expansion count.
14. Correct one-level maximum score selection.
15. Deterministic planning and recursion bound rejection.
16. Source counterfactual isolation and reserve consequences.
17. Checkpoint restoration and exact continued random trajectory.
18. Rolling history's valid parent graph.
19. JSON round trip and continued dynamics.
20. Malformed-import rejection without mutating the input.
21. Rejection of re-labeled external “evidence” in the simulated sensor ledger.
22. Coherence accumulation as an increasing statistic rather than identity proof.

### Interface-contract checks

The actual `app.js` is run against a small Node DOM shim built from the actual `index.html`. Tests check initial controls/agent cards, finite canvas drawing arguments, Run/Pause/Step, future exploration/application, timeline restore/branch, parameter and note persistence, paired counterfactual output, downloadable session contents, invalid import rejection, valid import restoration, and view navigation.

These checks verify application wiring and state flow. **They do not render CSS, verify pixels, exercise browser APIs end-to-end, or establish mobile usability.** One initial failure was in the test shim's missing reflected element `id` property; the shim was corrected. No production behavior was changed to manufacture a passing result.

## Browser verification limitation

Live browser rendering was not verified in this environment. The local browser binary could not be installed from its download source, and the cloud browser rejected both the local server address and local-file protocol under its security policy. No workaround was used after the explicit policy rejection. No screenshot is presented as an executed browser result.

A separate optional suite is supplied in `tests/browser.cjs` for a normal local development environment. It checks desktop and mobile viewport overflow, core controls, JSON export/import, navigation, and standalone offline operation, and saves screenshots for visual inspection. **It was not executed during this build.** Keyboard accessibility, touch targets, different browsers, long-running resource use, and actual GitHub Pages deployment remain unverified.

## Executed experiment: AE-SIM-001

48 development runs: 12 frozen seeds × 4 policies, each 300 ticks (30 simulation seconds). A pulse occurs at tick 80 and a blackout at tick 160. The comparison uses fixed survey, depth-one planning, depth-three planning, and depth-three planning with memory feedback disabled. Policies use the same initial seeds and measurement random streams.

| Policy | Mean terminal reserve | Mean coverage | Mean coherence |
|---|---:|---:|---:|
| Fixed survey | 0.6660 | 10.70% | 0.97324 |
| One-level planning | 0.8478 | 13.98% | 0.96954 |
| Three-level planning | 0.8334 | 16.15% | 0.96925 |
| Three-level, λ=0 | 0.8133 | 17.23% | 0.96258 |

Deeper search explores more here but retains less reserve than the one-level policy. Removing feedback increases coverage further while reducing reserve and agreement. These tradeoffs are retained rather than compressed into a universal “pass.” Detailed alarm fractions, timing, projection counters, random seeds, and state checksums are in [experiment.json](../results/experiment.json); the interpretation is in [EXPERIMENT.md](../results/EXPERIMENT.md).

Wall times are descriptive measurements in one shared runtime. They include planning, simulation, state copying, and diagnostics. They are not controlled hardware benchmarks. Re-running should reproduce the numeric records on the same runtime, but timings will differ.

## Claims permitted by the executed checks

- **Demonstrated on these tests:** deterministic finite simulation, functional kernel feedback, isolated bounded future search, state-complete replay, snapshot branching, and UI event-handler wiring.
- **Supported but incomplete:** usable browser laboratory; requires live visual and cross-browser checks.
- **Hypothesis / postulate:** the usefulness of an EFMW interpretation beyond this particular engineering model.
- **Unresolved:** canonical Zoo equivalence, globally stable coupled dynamics, external warning advantage, physical effects, AGI, consciousness, and ME-102 satisfaction.

The source paper, implementation, tests, and synthetic experiments were developed within the same project. They are dependent checks, not independent replication. Initial conditions and score weights are deliberately chosen design inputs, not evidence for the truth of the conceptual framework.
