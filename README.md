# The Archimedes Engine

**WorldEngine / Totality laboratory · version 0.1.0 · September 27, 2026**

A runnable, inspectable one-room world: two partially observed agents, a diffusing scalar field, physical obstacles, a recursive coherence kernel, bounded future search, and a branching checkpoint history.

Project direction: **Matthew Chenoweth Wright / Monolithic LLC**. This implementation and its mathematical specification were developed with OpenAI Codex assistance. The EFMW interpretation is a hypothesis; the computational behavior is directly inspectable.

## Run it

Open **`Archimedes-Engine.html`** for the self-contained version, or **`index.html`** with the repository files alongside it. No API key, package installation, external font, CDN, or language model is used. If your browser restricts local scripts, serve the directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Browser storage is best-effort; **Export session** gives a portable JSON record. A ready-made session is in `examples/pulse-and-blackout.json`.

## First experiment

1. Press **Run world**. ADA and NOETHER traverse the room according to the selected intention.
2. Inject a **Field pulse**, then a **Sensor blackout**. Observe changes in coherence, divergence, order parameter, and position beliefs.
3. Press **Explore possible futures**. The world pauses while the engine explores a bounded tree of future intentions.
4. Select a first-level intention, then **Apply first intention**. Press Run to observe the consequences.
5. Select an earlier checkpoint, intervene differently, and create a new history branch.
6. Set **recursive coupling λ = 0** under Kernel parameters to remove the memory force.

The planner sees the full simulated world; the individual agents have intermittent, noisy field readings. This distinction is intentional and documented. Free-text player notes are stored verbatim. They do not act as executable prompts.

## What is implemented

| Component | Actual behavior |
|---|---|
| WorldEngine | Fixed-step deterministic state transitions; field, objects, agents, player state, observations, and parameters |
| Archimedes kernel | Exponential self-model observer; coherence C; signed divergence D; bounded Φ; explicit feedback into motion |
| CUBY, local alias | Four-action recursive beam search; finite depth; retained alternatives and scored path |
| JANUS, local alias | Source-state intervention and paired simulated counterfactual |
| DRAGON, local alias | Five-rule regime classifier; no theorem about attractors |
| THOR, local alias | Numeric bounds and structural validation for state and imports |
| BORGES, local alias | Up to 96 snapshots with parent pointers; restore and branch |
| Interface | Responsive canvas room, controls, future tree, diagnostics, operators, mathematical overview, history, import/export |
| Reproducibility | Seeded randomness; state-complete snapshots; Node tests; raw experiment outputs; CI and Pages workflow |

These operator names continue the September 26 WorldEngine design. This repository does **not** claim a canonical implementation of every similarly named Zoo operator, the entire Monolithic 102, or a completed 46-animal Zoo run.

## Read the math

- [Full mathematical specification](docs/MATHEMATICS.md): state schema, units, every update, parameters, score, bounds, proofs, and limitations.
- [Source-to-code mapping](docs/SOURCE-MAPPING.md): explicit changes from the original Archimedes paper, including its ambiguous R expression and accumulating I variable.
- [Preserved source paper](docs/ARCHIMEDES-SOURCE.md): the prior text, retained as historical source, not silently corrected.
- [Architecture and operator contracts](docs/ARCHITECTURE.md).
- [Validation report](docs/VALIDATION.md) and [executed simulation comparison](results/EXPERIMENT.md).
- [Iteration roadmap](docs/ROADMAP.md).

## Verify and reproduce

Node.js 22 or later; tested using the version recorded in `results/experiment.json`. No npm dependencies are needed.

```bash
npm test
npm run experiment
npm run build
```

`npm test` checks mathematical invariants, observation behavior, intervention effects, deterministic replay, recursive-search bounds, snapshot branching, malformed imports, and interface event-handler contracts. `npm run experiment` regenerates the 48-run developmental comparison and sample session. `npm run build` produces the standalone HTML and copies browser files and documents to `dist/` for deployment.

Live browser rendering was blocked by the build environment's browser policy and remains unverified. Optional browser integration checks are included: install Playwright separately, then run `node tests/browser.cjs`. Its location can also be supplied through `PLAYWRIGHT_MODULE_PATH`. The suite launches a temporary local HTTP server and tests desktop/mobile layout boundaries, interactions, downloads, rejected imports, and local-file mode. It was not executed here; the 10 interface-contract tests use a DOM shim and do not render CSS.

## Put it on GitHub

Create a repository named **`Archimedes-Engine`**. Upload the **contents** of this directory so `index.html` is at the repository root. The archive includes `.github/workflows/`; Git commits preserve those files reliably.

To publish through the included workflow, choose **Settings → Pages → Build and deployment → Source → GitHub Actions**. Push to `main` or run **Publish laboratory** manually. A repository under `enuminous` with this name would normally use:

`https://enuminous.github.io/Archimedes-Engine/`

That address is a proposed destination, **not an already published site**. Branch-based Pages from `main` / root is also possible because the browser entry point is already at the root and `.nojekyll` is included. [Official GitHub Pages instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) were checked September 27, 2026.

## Evidence boundary

This release demonstrates a functioning computational model. Its scalar field is a generic source–diffusion–decay model, **not a numerical solution of the canonical EFMW root wave equation**. Its physical constants are simulation choices. High C measures agreement between a state and its internal estimate; it does not establish truth, identity, consciousness, or AGI. Monitors use illustrative, uncalibrated thresholds. ME-102 and external control-warning claims remain unresolved.

No new license grant is made by this repository. Licensing of the project and prior EFMW material remains for the rights holder to choose. See [RIGHTS.md](RIGHTS.md). No upstream code or external imagery has been copied into this release.


## Archimedes Observatory

Open `observatory.html` for the EFMW experiment workbench. Observatory adds deterministic counterfactual twins, delayed intervention feedback, seeded ensembles, local parameter sensitivity, final-state checksums, and an epistemic/provenance ledger. See [docs/OBSERVATORY.md](docs/OBSERVATORY.md).

The Observatory treats EFMW quantities as experimental model constructs and keeps simulation output distinct from empirical evidence.
