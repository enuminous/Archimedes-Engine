# Source-to-code mapping and provenance

**Frozen implementation:** 0.1.0, September 27, 2026.

## Sources actually used

1. **Matthew Chenoweth Wright / Monolithic LLC, _The Archimedes Engine: An Equation-Only Recursive Coherence Kernel and Its Candidate Physical Interpretation within EFMW_.** Current saved text read on September 27, 2026; the saved artifact was created September 17. It names source commit `26a3c057`, but the underlying 102-equation repository was not independently fetched or verified during this build. The text is preserved in [ARCHIMEDES-SOURCE.md](ARCHIMEDES-SOURCE.md). Its public reference is [the Archimedes paper in enuminous/papers](https://github.com/enuminous/papers/blob/main/archimedes-engine-efmw-paper.md).
2. The September 26 WorldEngine/Archimedes/Totality conversation, recovered through conversation context: one room, objects, two partially observed agents, intervention, branching, history, and a registry of named operators. Recovered architecture: WorldEngine manages global state, Archimedes is the mathematical kernel, and Totality is the simulation/game. This is design context, not verified canonical operator documentation.
3. [GitHub Pages creation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), checked September 27, 2026. These ground the deployment instructions only.
4. [Mattingley, Wang, and Boyd, _Receding Horizon Control: Automatic Generation of High-Speed Solvers_](https://web.stanford.edu/~boyd/papers/code_gen_rhc.html), 2011. Used to classify receding-horizon architecture as established work, not to copy code or import performance claims.

## Explicit implementation decisions

| Source construct | Implementation | Why / evidence status |
|---|---|---|
| Generic state $x$ and self-model $m$ | Four normalized observables per agent: own x/y position, reserve, local field | Engineering specialization; units and observation channels declared |
| $\dot x=f(x,e;\theta)+\lambda\Phi G(x,m,e)$ | World field and semi-implicit agent motion; restoring acceleration $\lambda\Phi(Sm_{pos}-p)$ | Declared local feedback path, not a derivation of canonical f/G |
| $\dot m=\alpha(H(x,e)-m)$ | Exponential update from own state and intermittent noisy field | $H$ is explicitly defined; held-observation integration is analytic |
| Cubic $\Phi$ equation | Projected explicit Euler with listed coefficients and zero additive forcing | Source-inspired implementation; no calibration claim |
| Jacobian-like closure $R$ | Vector alignment of normalized memory displacement and model change | Intentional replacement: original vector/matrix contraction is under-specified |
| Divergence $D$ | Squared residual plus derivative residual minus $0.06R$ | Preserves signed nature; not a metric |
| Coherence $C$ | Norm-ratio expression with epsilon and numeric projection | Same algebraic family as source; measures internal agreement |
| $I_{n+1}=I_n+\lambda C$ | $I_{n+1}=I_n+C\Delta t$ | Explicit rate and units; accumulated coherence, not identity proof |
| State convergence condition | No unconditional convergence claim | Accumulating I and ongoing source/control prevent a general conclusion |
| $\Gamma=\Phi RC$, critical consciousness threshold | Not used to infer consciousness or displayed as a verified score | No operational threshold or external evidence |
| Evidence and confidence | Tagged simulated reading ledger; literal player notes | No invented authentication or calibrated probability |
| ME-102 comparative warning criterion | Remains untested; developmental policy comparison is a separate experiment | No external failure endpoint, matched FPR or independent replication |
| CUBY / JANUS / DRAGON / THOR / BORGES | Precisely scoped local implementations | Canonical equivalence unverified; no assertion that a full Zoo run occurred |
| WorldEngine global schema | Field, objects, agents, models, history, player, intention, evidence, parameters, random state | Concrete MVP adaptation of later design, with no claim to simulate all scales |

## Source ambiguities that remain visible

- The source writes $f$ without an explicit $m$ argument, then differentiates it with respect to $m$. If there is truly no dependence, that derivative is zero. If dependence is intended, it needs definition.
- For vector $f$, $\partial_m f$ is a Jacobian. An inner product with a vector does not uniquely specify a scalar closure. This build does not silently choose a tensor contraction and call it canonical.
- $x=m$ alone does not imply $D=0$ when derivative mismatch or $R$ is nonzero. This build initializes all related quantities explicitly.
- If $I$ accumulates positive coherence indefinitely, it is not bounded. Stable identity language in the source is not a mathematical convergence proof for the whole state.
- The original equation-only constraint cannot be claimed by this release: field discretization, finite-state intentions, collision repair, objective weights, and beam search are openly added engineering choices.

## Audit discipline

The EFMW Zoo analysis method informed the checks: freeze definitions, declare proof obligations, expose circularity, distinguish standard mathematics, and separate simulation from experiment. This release does not assign invented canonical animal definitions or produce an unsupported “all animals passed” verdict. Test checks are named for the invariant they actually examine.

No specific canonical ME number is attached to a local equation unless it appears in the source text. Local IDs AE-001–AE-012 belong to this implementation only. The preserved source is not rewritten to make its historical claims match the new implementation.
