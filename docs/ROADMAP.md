# Iterative recursive build ledger

## Completed in 0.1.0

| Build pass | Output | Review question |
|---|---|---|
| 1. Recover and freeze | Prior paper, later one-room scope, mathematical contract | Are unresolved equations visible? |
| 2. Implement dynamics | Grid field, stations/obstacles, two finite-state agents | Does the declared update order match code? |
| 3. Close the feedback loop | Observers, C/D/R/Φ/I, memory acceleration | Does removing λ change trajectory? |
| 4. Expand futures | Four actions, beam search, source counterfactual | Are hypothetical states isolated from actual history? |
| 5. Persist consequences | Snapshot DAG, restores, random-state capture | Does continuation replay exactly? |
| 6. Expose the laboratory | Desktop/mobile UI, graphs, controls, imports/exports | Can the user inspect and intervene? |
| 7. Falsify and compare | Engine tests, interface-contract tests, 48 simulation runs; real-browser suite supplied but unrun | Are failures and tradeoffs recorded without promotion to physical proof? |

“Iterative recursive build” means both an iteratively verified software release and a bounded recursive planner inside that release. The engine does not rewrite its own code or recursively grant itself new capabilities.

## Planned increments; not implemented

### 0.2 — Connected rooms

Introduce explicit topology and portals, object transfer accounting, per-room fields, and partially observed maps. Acceptance: conserved quantities account for all transfers; two paths to the same checkpoint replay consistently; no cross-room observation leaks into agent policy unintentionally.

### 0.3 — Canonical operator plugins

Retrieve exact current definitions and rights for each selected Monolithic equation and Zoo operator. Supply symbol/unit schemas and frozen, versioned wrappers. Acceptance: equation-to-code equivalence reviewed for each operator, rejection of unsupported inputs, and no automatic application merely because an equation exists in the registry. All 102 equations need not be active at once.

### 0.4 — External observability and warning study

Choose a real measurement stream. Specify observation channels and failure labels that exist outside the simulator. Separate calibration, evaluation, and independent replication. Compare simple named monitors under matched false alarms and measured compute. Acceptance thresholds must be agreed and frozen before outcomes are examined; there is no ME-102 pass implied by this roadmap.

### 0.5 — Larger Totality game

Object interactions, richer local policy, multi-room causal consequences, editable objectives, and scenario bundles. Keep the original one-room scenario as a regression reference. Narrative text, if added, must be labeled as generated interpretation and remain separate from measured state.

Each increment should preserve a runnable prior version, version the math, identify a concrete failure condition, test it, retain negative results, and ship a reviewable artifact.
