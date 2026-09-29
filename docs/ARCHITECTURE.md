# Architecture and interfaces

The engine is browser-first, offline-capable, and dependency-free. One implementation powers the UI, Node tests, and comparison runs. There is no remote inference service, credential, analytics endpoint, or hidden model. The `Math` library's floating-point functions are the only non-integer numeric primitives beyond arithmetic.

## Modules

| File | Responsibility |
|---|---|
| `engine.js` | Deterministic world dynamics; observers; recursive search; validated session import; checkpoint graph |
| `app.js` | User interactions, canvas drawing, graphs, local persistence, JSON downloads |
| `index.html` / `styles.css` | Accessible controls, desktop/mobile layout, math overview, operator registry |
| `scripts/experiment.js` | Frozen 48-run development comparison; raw JSON, summary, example session |
| `scripts/build.js` | Static deployable bundle in `dist/` |
| `tests/engine.test.js` | Numeric, causal, replay, branching, and import checks |
| `tests/ui.test.js` | Executed DOM-contract checks of interface event handlers; no CSS rendering |
| `tests/browser.cjs` | Optional real-browser checks, supplied but not executed in this environment |
| `scripts/standalone.js` | Self-contained HTML with embedded style, scripts, icon and downloadable math documents |

## Operator contracts

These are local aliases for the recovered design. They do not certify canonical Zoo equivalence.

| Name | Inputs | Transformation / output | Invocation | Refusal or limit |
|---|---|---|---|---|
| THOR | Parsed session and world | Structural checks, numeric bounds, obstacle exclusion, typed observation ledger | Import; tests; explicit API | Reject malformed input before replacing live state; does not prove provenance |
| CUBY | Complete world, depth/width/horizon | Four-intention beam tree; scores, selected sequence, node metadata | Explore; automatic replanning | Depth ≤4, width ≤4, horizon ≤50; no global optimum guarantee |
| JANUS | World | Metrics for unchanged and source-toggled copies after 80 ticks | Compare source state | Restricted counterfactual family; does not affect the live state |
| DRAGON | Current metrics | One of depleted, occluded, divergent, settled, tracking | Diagnostics | Fixed threshold order; no general attractor detection |
| BORGES | Session, label or checkpoint ID | New snapshot node or restored world | Checkpoint; restore | 96-node rolling cap; missing-parent roots explicitly rebased |
| EFMW | Agent features, held observation, parameters | Model, C/D/R/Φ/I/baseline; memory acceleration on next tick | Every integration tick | Typed local adaptation; physical interpretation unvalidated |

The registry is descriptive metadata. Dispatch is explicit in the application: only the requested operator is run. It is not a universal plugin loader and does not accept arbitrary executable code.

## API examples

In a browser, `window.Archimedes` exports the API. In Node:

```js
const E = require('./engine.js');
let world = E.createWorld('my-seed', { coupling: 0.8 });
world = E.setAction(world, 'survey');
world = E.step(world, 20);
const futures = E.plan(world, { depth: 3, width: 3, horizon: 20 });
world = E.setAction(world, futures.sequence[0]);
world = E.intervene(world, 'pulse');
world = E.step(world, 20);
console.log(E.metrics(world));
```

`createWorld` creates a fresh record. `step`, `setAction`, `intervene`, `checkpoint`, `restore`, `plan`, and `counterfactual` preserve their input by copying. `step` accepts up to 10,000 ticks per call. Planner settings are bounded independently to avoid accidental unbounded recursion.

```js
let session = E.createSession('my-seed');
session.world = E.step(session.world, 30);
session = E.checkpoint(session, 'Before intervention');
const json = E.exportSession(session);
const restored = E.importSession(json);
// Continued trajectories match, including simulated sensor draws.
```

The core API assumes internally valid state after construction or import. Call `validateWorld` before processing a world from an untrusted programmatic caller. `importSession` checks the file size, nested numeric structure, state bounds, evidence kinds, graph ordering, version, and cursor before returning a replacement. It does not execute content or authenticate the file's creator. JSON can be edited; simulated labels are not cryptographic provenance.

## User interface behavior

- **Run/Pause** advances fixed ticks. Hidden tabs pause. Pausing also saves the current live state.
- **Step** advances exactly one tick and records a checkpoint.
- **Seed reset** replaces the current session with a fresh world using the current parameters. Export first to preserve the previous experiment.
- **Player objective** chooses score weights. **Current intention** chooses a finite action. A player note is recorded text, not executable instruction.
- **Explore** pauses, expands possible futures, and presents first-level alternatives plus the best deep path. Applying a forecast checks that the current world checksum matches its planning origin.
- **Automatic replanning** chooses the first action of a fresh plan every 20 ticks while running.
- **Beliefs** displays dashed circles at model-estimated position. Solid points show actual agent positions. Predicted first-level positions are dashed squares when a forecast is visible.
- **Field** switches only the visualization. It never disables propagation.
- **History** records every 20 running ticks and after parameter/action/intervention changes. Restore preserves other retained branches. The label tooltip shows parent ID.
- **Sensors** shows internally simulated observations, labeled as such. **Event log** shows deterministic event text.
- **Export/Import** use versioned JSON. Invalid imports leave the live session intact and display an error.

Numeric input and imported values are not rendered as executable HTML. User-controlled seeds, notes, and labels are inserted with `textContent`. Drawn SVGs are generated from validated numeric values and fixed action names.

## Persistence and reproducibility limits

`localStorage` is optional, origin-dependent, and may be unavailable in privacy modes or local-file contexts. The interface displays an export reminder when storage fails. Save files carry at most 96 checkpoints, recent diagnostic windows, and the full current world. They are not complete unbounded event archives. Preserve a sequence of exported files for long experiments.

FNV checksums are convenience fingerprints, not a security mechanism. A file's SHA-256 in `SHA256SUMS.txt` gives a stronger integrity checksum for the release bytes, but neither checksum proves that a scientific claim is true.

## Extension interface

Add a new operator only after declaring its input state, supported units, preconditions, mutation behavior, output schema, failure condition, and evidence status. Add any new mutable state to snapshots and import validation. Keep future simulation and live simulation on the same integration path. Version incompatible state schemas. Test the actual failure risk: replay, units, clipping, branch contamination, or external-data leakage.
