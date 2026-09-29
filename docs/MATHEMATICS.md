# The Archimedes Engine: complete mathematical specification

**Version:** AE 0.1.0, 2026-09-27. **Status:** implemented computational model; proposed EFMW interpretation unvalidated. **Code:** `engine.js`. The frozen developmental experiment is AE-SIM-001.

This document defines the actual executable system. It is a numerical specialization and extension of the earlier Archimedes paper, not a derivation of the entire Monolithic 102. All additional choices are declared here. The original source remains in `ARCHIMEDES-SOURCE.md`.

## 1. Scope, scales, and notation

There are two agents in a rectangular room with fixed circular obstacles and three non-solid stations. Agents cannot leave the room or penetrate obstacles. Agents can overlap each other: inter-agent contact, momentum exchange, gravity, acoustics, fluid flow, relativistic effects, and natural-language generation are outside this version.

Let $L$ denote one **simulation length unit**, and $T$ one **simulation time unit**. The interface displays $T$ as seconds for convenience. This is not a measured calibration to a physical experiment. The room is $24L\times16L$. The scalar field, normalized features, energy reserve, $C$, $D$, $R$, and $\Phi$ are dimensionless. Agent position has units $L$, velocity $L/T$, and acceleration $L/T^2$.

The integrator uses a fixed step $\Delta t=0.1T$. Browser frame rate and playback speed change wall-clock pacing, not $\Delta t$. Discrete differences denoted by a dot below are estimates in units $T^{-1}$, not exact continuous derivatives.

Write $\Pi_{[a,b]}(z)=\min(b,\max(a,z))$ for interval projection, $\|\cdot\|_2$ for the Euclidean norm, and $\varepsilon=10^{-9}$ in a dimensionally normalized expression. When a norm product has units $T^{-1}$, the corresponding epsilon is interpreted as $10^{-9}T^{-1}$.

## 2. AE-001: complete state

The architecture-level state is

$$W_n=(F_n,O,A_n,M_n,H_n,P_n,U_n,E_n,\Theta,s_n).$$

| Symbol | Executable representation | Domain / role |
|---|---|---|
| $F$ | `field`, 384 values | Scalar cell concentrations in $[0,1]$ |
| $O$ | exported `OBJECTS` | Source, relay, archive, two solid obstacles |
| $A$ | `agents`, two records | Position, velocity, reserve, history trail, kernel statistics |
| $M$ | per-agent `m`, `sensed`, `lastSeen`, `previous` | Four-dimensional self-model and observation memory |
| $H$ | `session.history`, `cursor`, `nextId` | Parent-linked snapshots; maximum 96 |
| $P$ | `player` | Intervention counter and literal note |
| $U$ | `action`, `goal` | Four intentions and three objective weight sets |
| $E$ | `evidence` | At most 40 simulated field readings with time and agent |
| $\Theta$ | `params`, frozen constants | Declared parameters and numerical choices |
| $s$ | `rng`, `seed`, `tick` | Pseudorandom state, source seed, simulation clock |

The world also records `sourceOn`, remaining `blackout` ticks, 384 binary `visited` cells, 64 recent events, 180 diagnostic samples, and projection/contact counters. Static geometry is versioned with the code. Snapshots copy **all mutable world fields**, including random state, observations, coverage, and history-dependent statistics. A checkpoint stores the world, not a recursive copy of the whole graph.

For agent $i\in\{0,1\}$, define

$$x_{i,n}=\left(p^x_{i,n}/24L,\;p^y_{i,n}/16L,\;e_{i,n},\;F_n[\operatorname{cell}(p_{i,n})]\right)\in[0,1]^4.$$

The nested kernel is $X_i=(x_i,m_i,\Phi_i,R_i,D_i,C_i,I_i)$. The original source's unspecified confidence and evidence accumulator are not assigned invented probabilities. Field readings form an observation ledger. External claims can be stored as literal player notes; they never become verified evidence automatically.

### Initialization

At cell centers $(j+\tfrac12,k+\tfrac12)L$,

$$F_{j,k,0}=0.12+0.5\exp\!\left[-\frac{(j+\tfrac12-3.5)^2+(k+\tfrac12-8)^2}{25}\right].$$

Agents begin at $p^x=4.8L$ and $p^y=(6+4i+0.5(u_i-0.5))L$, with $u_i\in[0,1)$ from the seeded generator. Velocity is zero, reserve $e=0.78$, $m=x$, previous features $=x$, $\Phi=0.8$, $C=1$, $D=R=I=0$, and baseline monitor $B=0$. The initial field reading equals the actual field and is noiseless. Initial cells are marked visited. Thus the displayed initial neutral metrics are specified initial conditions, not an empirical discovery.

## 3. AE-002: field propagation

The grid spacing is $h=L$. A five-point stencil computes

$$\Delta_h F_{j,k}=\frac{F_{j-1,k}+F_{j+1,k}+F_{j,k-1}+F_{j,k+1}-4F_{j,k}}{h^2}.$$

Indices beyond an edge repeat the adjacent boundary cell. This is a discrete zero-normal-flux condition. Field propagation does not model obstacles: obstacles constrain agents only.

The source is centered at $(3.5,8)L$:

$$q_{j,k}=0.16T^{-1}\,\mathbf1_{\mathrm{sourceOn}}\exp\!\left[-\frac{(j+\tfrac12-3.5)^2+(k+\tfrac12-8)^2}{8}\right].$$

The source–diffusion–decay step is

$$F_{j,k,n+1}=\Pi_{[0,1]}\left[F_{j,k,n}+\Delta t\left(d\Delta_hF_{j,k,n}+q_{j,k}-\mu F_{j,k,n}\right)\right],$$

where $d=0.65L^2/T$ by default and $\mu=0.055T^{-1}$. User/API bounds restrict $0\le d\le1L^2/T$.

**Positivity condition.** Before source addition and projection, the stencil is a nonnegative linear combination of neighboring values if

$$\Delta t\left(4d/h^2+\mu\right)\le1.$$

At maximum allowed diffusivity, the left-hand side is $0.4055$. At zero source, summing the stencil gives zero total Laplacian contribution, so the total field sum decreases by exactly the factor $1-\mu\Delta t$, provided projection is inactive. With a spatially uniform field, every cell obeys that same decay. Both properties are tested.

Projection enforces the declared field domain when sources/pulses saturate cells. It changes the unconstrained dynamics and is counted in `fieldClips`; no mass-conservation claim is made during saturation. The field is not physical energy and has no conservation coupling to agent reserves.

## 4. AE-003: intentions, motion, and reserves

The intention set is $\mathcal A=\{\mathrm{survey},\mathrm{anchor},\mathrm{exchange},\mathrm{recharge}\}$. The same intention dispatches different targets to the two agents.

| Intention | ADA target | NOETHER target |
|---|---|---|
| Recharge | $(3.5,7)L$ | $(3.5,9)L$ |
| Anchor | Relay $(12,8)L$ | Archive $(20.5,8)L$ |
| Exchange | Archive $(20.5,8)L$ | Source $(3.5,8)L$ |
| Survey | Corner cycle phase $k$ | Same cycle phase $k+2$ |

The corner sequence is $(20,3),(20,13),(4,13),(4,3)$ in $L$. Phase is $k=\lfloor n/180\rfloor\bmod4$. An agent with reserve below $0.22$ overrides any intention with its recharge target. This is an explicit finite-state rule, not learned autonomy.

For target $t_i$, distance $r=\|t_i-p_i\|$, and reserve $e_i$,

$$v_{\mathrm{des}}=1.7\frac LT\,\Pi_{[0.12,1]}(e_i/0.3)\min(1,r/L)\frac{t_i-p_i}{r}.$$

Set $v_{\mathrm{des}}=0$ at $r=0$. The unprojected acceleration is

$$a_i=2.2T^{-1}(v_{\mathrm{des}}-v_i)+\lambda\Phi_i(Sm_{i,\mathrm{pos}}-p_i)+a_{\mathrm{obs}},\qquad S=\operatorname{diag}(24L,16L).$$

Here $\lambda=0.8T^{-2}$ by default, with $0\le\lambda\le2T^{-2}$. This explicitly chosen memory force is restorative toward the lagged internal position estimate. It can slow or alter trajectories; beneficial effects are not assumed.

Two obstacles have centers $(8,5.7)L$, $(16,10.3)L$ and radius $1.1L$. For each obstacle, with center-to-agent vector $z$ and distance $r_o$, add

$$a_{\mathrm{obs},o}=5T^{-2}(r_o^{\mathrm{body}}+1.2L-r_o)\frac{z}{r_o}$$

only when $0<r_o<r_o^{\mathrm{body}}+1.2L$. Clip total acceleration magnitude to $5L/T^2$. Use semi-implicit Euler:

$$v_{n+1}=\operatorname{clipNorm}_{2L/T}(v_n+\Delta t\,a_n),\qquad p_{n+1}=p_n+\Delta t\,v_{n+1}.$$

The agent radius is $0.3L$. Wall projection restricts $p^x\in[0.3,23.7]L$, $p^y\in[0.3,15.7]L$, zeroing the velocity component normal to a contacted wall. Obstacle penetration projects to radius $1.4L$ and zeroes both velocity components. At coincident centers, the projection direction is the positive x-axis. These are geometric repairs, not energy-conserving collisions. The maximum single-step displacement is $0.2L$; continuous collision detection is not implemented.

After motion, reserves update:

$$e_{n+1}=\Pi_{[0,1]}\left[e_n+\Delta t\left(0.075T^{-1}\mathbf1_{\mathrm{sourceOn}\land\|p-p_s\|<2.2L}-0.003T^{-1}-0.005\frac{T}{L^2}\|v\|^2\right)\right].$$

There is no simulated biological interpretation. `visited` records cells occupied by either agent; coverage is the number of such cells divided by 384. It does not count a sensing radius or include unseen cells along a hypothetical branch in the actual world.

## 5. AE-004: observations and self-model

Own normalized position and reserve are observed every tick. The environmental field is sampled every $q=5$ ticks by default, provided there is no blackout:

$$\tilde F_{i,n}=\Pi_{[0,1]}\left(F_n[\operatorname{cell}(p_{i,n})]+\sigma_o(2u-1)\right),\quad\sigma_o=0.025.$$

Thus the simulated measurement noise is uniform, **not Gaussian**. A field sample consumes one random draw per agent. Between readings, the last reading is held. Sensor cadence may be set through the engine API to integers 1–20. Blackout state is tested before its countdown decrement: a freshly applied 80-tick blackout suppresses all readings for those 80 ticks. If cadence is five, the next sample after a blackout starting at tick zero is at tick 85.

With $y=(p^x/24L,p^y/16L,e,\tilde F)$, define

$$m_{n+1}=m_n+\left(1-e^{-\alpha\Delta t}\right)(y_{n+1}-m_n),\quad\alpha=1.8T^{-1}.$$

This is the exact solution of $\dot m=\alpha(y-m)$ over one step when $y$ is held constant. Since the gain lies in $(0,1)$, the update is a convex combination, preserving $m\in[0,1]^4$. This proof does not imply correct inference about an unobserved environment. The field component continues converging toward a stale observation during a blackout; the interface exposes observation age.

## 6. AE-005/006: local recursive alignment, coherence, divergence

Let $x=x_{n+1}$, $m=m_{n+1}$, and

$$\dot x=\frac{x_{n+1}-x_n}{\Delta t},\quad \dot m=\frac{m_{n+1}-m_n}{\Delta t},\quad \delta=x-m,\quad\nu=\dot x-\dot m.$$

The original paper's $\langle\partial_m f,\dot m\rangle$ is not a defined scalar for a general vector field $f$, and its stated $f(x,e;\theta)$ does not explicitly depend on $m$. This implementation **replaces**, rather than claims to evaluate, that expression with the fully specified local surrogate

$$g=(m^1_n-x^1_{n+1},\;m^2_n-x^2_{n+1},\;0,\;0),\qquad R=\frac{g^\top\dot m}{\|g\|\|\dot m\|+\varepsilon}.$$

This measures alignment between normalized memory displacement and model change. $R=0$ when either vector is zero. Cauchy–Schwarz gives $|R|\le1$. $R$ is **not** the recursive coupling parameter: setting $\lambda=0$ removes the motion pathway but leaves this diagnostic defined.

$$C=\Pi_{[0,1]}\left(1-\frac{\|\delta\|}{\|x\|+\|m\|+\varepsilon}\right).$$

By the triangle inequality, the unprojected formula already lies in $[0,1]$; projection protects against floating-point error. For $x=m$ it gives $C=1$, including the joint-zero vector. Agreement is not truth; two equally wrong estimates can agree.

Define a nonnegative residual $D_+$ and the source-inspired signed diagnostic $D$:

$$D_+=\|\delta\|^2+(0.02T^2)\|\nu\|^2,\qquad D=D_+-0.06R.$$

Then $D_+\ge0$ and $D\ge-0.06$. Calling $D$ a distance or assuming it is nonnegative would be incorrect. The full simulator state is used to evaluate $x$, so these monitoring metrics are a privileged laboratory diagnostic. They are not automatically available to an external deployed observer.

## 7. AE-007: coherence gate

The continuous-form update being discretized is

$$\tau_\Phi\dot\Phi=b\Phi-a\Phi^3-\kappa_\Phi\Phi\|\delta\|^2-\eta_\Phi\Phi\|\nu\|^2+\gamma_\Phi R.$$

Use $\tau_\Phi=2T$, $a=b=0.9$, $\kappa_\Phi=1.5$, $\eta_\Phi=0.02T^2$, and $\gamma_\Phi=0.1$. There is no additive stochastic forcing in $\Phi$; the source paper's $\sigma\xi(t)$ is fixed to zero in this version. Measurement noise can affect $\Phi$ indirectly through the state-model difference.

The implemented step is

$$\Phi_{n+1}=\Pi_{[0,1.5]}\left[\Phi_n+\frac{\Delta t}{2T}\left(0.9\Phi_n-0.9\Phi_n^3-1.5\Phi_n\|\delta\|^2-0.02T^2\Phi_n\|\nu\|^2+0.1R\right)\right].$$

The old $\Phi_n$ affects motion during the current step; the new gate affects the next step. `phiClips` counts projection. The cubic alone has equilibria $\Phi=0,\pm1$, with the positive equilibrium locally stable on the positive half-line. That fact does **not** prove stability of the coupled, switched, projected world. No global convergence theorem is claimed.

## 8. AE-008: accumulated coherence and monitors

$$I_{n+1}=I_n+C_{n+1}\Delta t.$$

$I$ has units of simulation time. It is cumulative coherence, not an identity authentication score. If $C_n\ge c>0$ indefinitely, $I_n\ge I_0+nc\Delta t$ diverges. Therefore a full-state attractor that includes $I$ cannot be inferred from stable $x,m,\Phi$. This corrects a possible conflation in the source discussion.

The dashboard displays arithmetic agent means $\bar C,\bar D,\bar\Phi,\bar e$. Its illustrative warning is

$$\mathrm{alarm}_n=\mathbf1_{\bar D_n\ge0.09\;\lor\;\bar\Phi_n\le0.45}.$$

An additional residual EWMA is maintained per agent:

$$B_{n+1}=0.97B_n+0.03\left|F_n[\operatorname{cell}(p_i)]-\tilde F_i\right|.$$

This baseline is a diagnostic only. No threshold is calibrated for it and no matched-FPR warning advantage is claimed. An alarm rate under a deliberate intervention is not an estimate of false-alarm probability. ME-102 would require a defined failure endpoint, separate calibration and held-out evaluation, matched false-alarm rate and compute, uncertainty estimates, and independent replication. None is asserted here.

The DRAGON alias applies this priority order: `depleted` if mean reserve $<0.25$; otherwise `occluded` if blackout remains; otherwise `divergent` if $\bar C<0.92$ or $\overline{D_+}>0.035$; otherwise `settled` if both speeds $<0.12L/T$; otherwise `tracking`. It is a heuristic label, not an attractor classifier proved complete.

## 9. AE-009: recursive future selection

The player-level planner has access to the full current simulator snapshot. It cannot infer an unknown physical world from this toy model. Each intention is held for $h_p=20$ integration ticks, or $2T$. At a root state $W_0$, let $c_0$ be coverage and $a_{-1}$ its existing intention.

For goal weights $(w_e,w_C,w_N,w_D,w_R)$, use

$$U(W,a_{\rm prev})=w_e\bar e+w_C\bar C+w_N(\operatorname{coverage}(W)-c_0)-w_D\max(0,\bar D)-w_R\mathbf1_{a(W)=a_{\rm prev}}.$$

| Goal | $w_e$ | $w_C$ | $w_N$ | $w_D$ | $w_R$ |
|---|---:|---:|---:|---:|---:|
| Balance | 1.0 | 0.45 | 3.0 | 0.3 | 0.07 |
| Discovery | 0.45 | 0.2 | 8.0 | 0.2 | 0.10 |
| Resilience | 2.4 | 0.65 | 0.8 | 0.6 | 0.03 |

These are declared engineering preferences, not fitted physical constants or empirically calibrated utilities. Novelty is newly visited cells relative to the planning root. It is deliberately counted at each future level as sustained coverage, not Shannon information. Repetition means equal adjacent intentions, including the root intention. A large novelty weight can trade away energy or coherence.

For depth $d\in\{1,2,3,4\}$ and beam width $b\in\{1,2,3,4\}$,

$$J(a_0,\ldots,a_{d-1})=\sum_{k=0}^{d-1}0.9^kU(W_{k+1},a_{k-1}),\quad W_{k+1}=F^{h_p}(W_k,a_k).$$

At every level, expand every retained candidate using all four intentions, simulate, evaluate, sort, and retain the best $b$. Ties use the original expansion order. The default is $d=3,b=3$. Since $b\le4$, expansion count is exactly

$$N(d,b)=4+4b(d-1).$$

The default evaluates 28 nodes and 560 simulated ticks. The maximum API setting (depth 4, width 4, horizon 50) evaluates 52 nodes and 2,600 ticks. Browser controls use width 3 and horizon 20. Memory use is bounded by the beam, diagnostics retained per candidate, and returned node metadata. Running time is $O(Nh_p(K+A))$ for $K=384$ field cells and $A=2$ agents, plus bounded state-copy overhead.

The return value contains the best sequence and path score, all evaluated node metadata, and four first-level alternatives. Cards display first-level scores; the highlighted tree displays the best full sequence. These are different quantities. A manually selected first-level alternative need not be the first action of the best full sequence.

Apply **only the first intention**, then integrate the actual state. Automatic mode replans every 20 ticks. This is a receding-horizon beam-search heuristic. Pruning means it is not exhaustive dynamic programming and carries no global optimality guarantee. Common random streams across branches support paired comparisons; they do not create independent evidence or approximate an uncertainty distribution. No ensemble expectation or probabilistic confidence is computed.

## 10. AE-010: interventions and paired counterstates

- **Pulse:** add $0.75\exp(-((x-12L)^2+(y-8L)^2)/(16L^2))$ to the cell field, then project to $[0,1]$.
- **Blackout:** set remaining blackout to 80 ticks; repeated application restarts that interval.
- **Source toggle:** invert `sourceOn`, affecting both field sourcing and reserve recharge.
- **Reset models:** replace both $m$ vectors with $(0.5,0.5,0.5,0.5)$; preserve actual world features and previous-feature derivative memory. This can deliberately create a transient in $\dot m$.

The JANUS alias returns metrics after 80 ticks for (a) an unchanged copy and (b) a copy with the source toggled. All other initial numeric state and random state match. The action remains the existing action; no replanning occurs inside this comparison. Neither branch mutates the original.

## 11. AE-011: deterministic history and random state

Seed strings of 1–80 UTF-16 code units are hashed with 32-bit FNV-1a. A zero result is replaced with one. Each random draw uses xorshift32, with bit operations performed as JavaScript 32-bit integer operations:

$$s\leftarrow s\oplus(s\ll13),\quad s\leftarrow s\oplus(s\mathbin{\mathrm{>>>}}17),\quad s\leftarrow s\oplus(s\ll5),\quad u=(s\mathbin{\mathrm{>>>}}0)/2^{32}.$$

This generator is for reproducible simulation, not cryptography or high-quality physical randomness. Initialization uses two draws, then each permitted field-sampling event uses two more. Snapshot restore recovers $s$, not merely the seed.

Checkpoints carry increasing IDs and parent pointers. Restoring an old node sets the live state and active parent. The next checkpoint adds a child without rewriting existing descendants. At 97 nodes the oldest is removed, and children whose parents are no longer retained become new roots. Export before the rolling limit to retain longer research histories. The export is a record, not an append-only tamper-proof ledger.

The eight-digit state checksum is FNV-1a of the world JSON. It helps detect accidental differences and stale UI forecasts; it is not collision-resistant authentication. Equal seed, version, parameters, random state, action/intervention schedule, and step count produce deterministic numeric continuation on the same JavaScript runtime. Cross-engine floating-point transcendental results need not be bitwise identical. Screenshots, browser playback timing, and experiment wall times are not covered by this guarantee.

## 12. AE-012: update order and explicit contracts

Each tick performs exactly:

1. Increment tick.
2. Update the field from the old field, source, and declared parameters.
3. For ADA, then NOETHER: choose target, calculate capped acceleration, update velocity and position, enforce contacts, update reserve and visited cells, observe if allowed, update the self-model, calculate diagnostics, update $\Phi$, $I$, and baseline, store current features as previous.
4. Decrement blackout if positive.
5. Every five ticks, append a diagnostic sample.

Agents do not alter the field and do not collide with one another, so iteration order only assigns pseudorandom measurement draws, not physical coupling. Planner copies repeat exactly this integrator. Nothing uses browser wall time to calculate physics.

## 13. Proof obligations and evidence

| Obligation | Status and limit |
|---|---|
| Symbol/type/unit completeness | Defined here, with simulation units and explicit R replacement |
| Field nonnegative stencil and zero-source mass decay | Algebra above; executable checks |
| Observer domain preservation | Convex-combination proof; executable checks |
| $0\le C\le1$ and $|R|\le1$ | Triangle inequality and Cauchy–Schwarz |
| $D\ge0$ | Rejected; signed definition allows negative values |
| Global coupled stability or convergence | Unresolved; projection and finite test trajectories are insufficient |
| Full-state convergence including $I$ with persistent $C>0$ | Rejected by accumulation inequality |
| Recursive feedback is causally active | Demonstrated by matched-seed trajectory change in this implementation |
| Feedback or deeper planning always improves outcomes | Not claimed; objective tradeoffs are reported |
| Canonical equation-only ME-001–102 execution | Not claimed; declared world rules and search are extensions |
| Physical EFMW novelty, AGI, consciousness, ME-102 | Unresolved / untested by this release |

## 14. Known-result comparison and falsification

The field update is conventional finite-difference diffusion with sources and decay. The observer is exponential relaxation. The cubic gate is adjacent to standard saturation/order-parameter dynamics. The feedback is a memory-dependent restoring controller. Recursive search is beam search with receding-horizon execution, and the history is a directed acyclic graph of snapshots. These ingredients are not established as mathematically novel by being named Archimedes.

Mattingley, Wang, and Boyd describe receding-horizon control as repeated optimization using a moving prediction horizon; this build uses that broad architecture with a small discrete heuristic, not their convex solver: [authors' publication page](https://web.stanford.edu/~boyd/papers/code_gen_rhc.html), IEEE Control Systems Magazine 31(3), 52–65 (2011). No performance result from that paper is transferred to this code.

**Immediate falsifiers:** a different replay from an identical state on the same runtime; an unreported mutation of the live world during planning; an out-of-domain state under supported parameters; accepting simulator observations as independent external evidence; or a mismatch between an equation and its executable step. Tests address specific examples, not universal formal verification.

**Next external test:** select one measured control stream; freeze observables, failure endpoint, baseline family, calibration split, parameter budget, and compute accounting. Evaluate fixed models on held-out trajectories, compare lead time at matched false-alarm rate, report negative as well as positive results, and seek independent reproduction. No success threshold is invented here in the absence of that protocol and dataset.
