# Formal coverage

## Frozen target

Source: [`docs/MATHEMATICS.md`](../docs/MATHEMATICS.md), baseline commit `c98584c3b9b43531d5677d68ba3c875a681587e8`.
The definitions and theorem hypotheses in `Archimedes.lean` are the acceptance target.
The pinned Lean/Mathlib build and strict axiom audit must pass before treating a
statement as machine-checked. The workflow records the exact tested commit/run.

## Statements covered

Projection, convex observer update, exponential gain range, normed-space coherence and real-inner-product alignment bounds, signed residual lower bound, 2D stencil positivity, symmetric flux cancellation, conditional unprojected mass decay, accumulation lower bound and planner node bounds.

## Limits and unresolved obligations

The proof models exact real arithmetic. The JavaScript implementation is covered by its existing tests, not a compiler refinement proof. Mass decay requires zero source, symmetric flux and inactive clipping. Global convergence, empirical effectiveness and physical calibration are unresolved.

## Evidence discipline

These are established algebra, analysis and finite-dimensional mathematics,
not a novelty claim. Formal proofs establish only their stated hypotheses and
conclusions. Computational regression tests are software checks, not independent
experimental evidence. No theorem uses a claimed physical interpretation as a
premise. No custom axioms, `sorry`, or native-evaluation trust exception is allowed.
No new animal operation is invented or claimed to have been executed.

The first evidence status is **unresolved** until the exact-commit workflow
succeeds; thereafter only the covered formal statements are **demonstrated**.
Scientific applicability remains a **hypothesis/postulate** unless separately tested.
