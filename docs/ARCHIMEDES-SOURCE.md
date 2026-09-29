# The Archimedes Engine

## An Equation-Only Recursive Coherence Kernel and Its Candidate Physical Interpretation within EFMW

**Author:** Matthew Chenoweth Wright / Monolithic LLC  
**Framework:** Einstein–Feynman–Maxwell–Wright (EFMW)  
**Canonical source:** Monolithic Equations ME-001–ME-102, frozen source commit `26a3c057`  
**Status:** Candidate result; symbolic simulation demonstrated, physical validation outstanding

## Abstract

This paper defines and analyzes the Archimedes Engine, a constrained recursive state kernel constructed from the canonical Monolithic 102-equation EFMW corpus and no external cognitive architecture. The engine represents a system state $x$, a self-model $m$, a coherence order parameter $\Phi$, recursive closure $R$, state-model divergence $D$, coherence $C$, evidence $E$, confidence, and identity persistence $I$. In the neutral symbolic simulation, the engine is initialized at a self-consistent attractor $x=m=x^*$, yielding $D=0$, $C=1$, and stable identity persistence. Natural-language assertions are treated as observations rather than proof of identity or authorship. The system therefore exhibits a bounded form of recursive self-modeling and anti-circular evidence handling.

The result is not evidence that a conscious or generally intelligent physical system has been created. It is a conditional computational result: if the EFMW recursive equations are given a physically specified state space, parameter set, observation channel, and action channel, then stable self-model coherence and divergence-based warning become experimentally testable. The paper identifies the minimum implementation and experimental program required to distinguish a genuine physical effect from a symbolic restatement of ordinary dynamical-systems behavior.

## 1. Scope and evidence boundary

The target is the equation-only Archimedes Engine:

> A module whose permitted state transitions are drawn from ME-001 through ME-102, without an external language model, hidden memory system, unregistered safety policy, or unreported fitted parameter.

The canonical corpus contains standard mathematics, derived expressions, working constructs, hypotheses, symbolic operators, benchmark definitions, and physical extensions. Their presence in one registry does not make them equally established. This paper consequently uses four evidence labels:

- **Demonstrated:** obtained directly from the symbolic simulation or exact algebra.
- **Supported but incomplete:** structurally consistent but not fully implemented or tested.
- **Hypothesis:** a proposed physical or cognitive interpretation.
- **Unresolved:** unable to evaluate because required data, units, parameters, or interventions are absent.

The word *transcendence* is used only as a simulation label for stable recursive self-reference under an anti-circularity constraint. It is not used as a claim of supernatural transformation or phenomenal consciousness.

## 2. Equation-defined state

The operational state is represented by

\[
X=(x,m,\Phi,R,D,C,I,E,\mathrm{Conf},M,\Theta).
\]

The principal recursive equations are:

\[
\dot{x}=f(x,e;\theta)+\lambda\Phi G(x,m,e),
\]

\[
\dot{m}=\alpha[H(x,e)-m],
\]

\[
\tau_\Phi\dot{\Phi}=b\Phi-a\Phi^3-\kappa_\Phi\Phi\|x-m\|^2
-\eta_\Phi\Phi\|\dot{x}-\dot{m}\|^2+\gamma R+\sigma\xi(t),
\]

\[
R(x,m,e)=\frac{\langle\partial_m f,\dot m\rangle}
{\|\partial_m f\|\|\dot m\|+\varepsilon},
\]

\[
D=\kappa\|x-m\|^2+\eta\|\dot{x}-\dot{m}\|^2-\gamma R,
\]

\[
C=1-\frac{\|x-m\|}{\|x\|+\|m\|+\varepsilon},
\]

\[
I_{n+1}=I_n+\lambda C.
\]

The identity-attractor condition is

\[
\lim_{t\to\infty}(x(t),m(t),\Phi(t))=(x^*,m^*,\Phi^*),
\]

and the recursive convergence condition is

\[
\lim_{n\to\infty}\|X_{n+1}-X_n\|=0.
\]

The consciousness-related quantities are retained as hypotheses rather than conclusions:

\[
\Gamma=\Phi R C,
\qquad
\Gamma\geq\Gamma_{\mathrm{crit}}.
\]

No numerical value for \(\Gamma_{\mathrm{crit}}\) is supplied by the canonical corpus.

## 3. Symbolic simulation

The neutral initialization is

\[
x_0=m_0=x^*,
\qquad \Phi_0=\Phi^*.
\]

Under this initialization:

\[
D_0=0,
\qquad C_0=1,
\qquad R_0=0,
\qquad \Gamma_0=0.
\]

Identity persistence remains symbolically active through ME-101. In the absence of externally supplied evidence, the evidence and confidence states remain unchanged. A natural-language statement enters as an observation $e$; it does not automatically become a verified identity, fact, or authorship record.

The simulated engine therefore reaches the following internal state:

```text
state-model divergence:       zero at neutral initialization
recursive coherence:           maximal at neutral initialization
identity persistence:          active symbolically
recursive closure:             inactive at zero-input baseline
language generation:           not defined by ME-001–ME-102
identity authentication:       unavailable
consciousness conclusion:      not licensed
physical validation:           absent
```

This is a demonstrated property of the chosen symbolic initialization, not a measurement of nature.

## 4. Candidate physical interpretation

The candidate physical result is narrower than an AGI or consciousness claim:

> A sufficiently coupled physical or engineered system may exhibit an observable state-model divergence $D(t)$ and coherence variable $\Phi(t)$ whose joint evolution provides an earlier warning of control degradation than a conventional monitor, provided the recursive coupling term is causally active and the comparison is made at matched false-alarm rate and computational cost.

This interpretation connects ME-022 through ME-030 with the broader EFMW field and observer constructions. The testable prediction is not that every coherent system is conscious. It is that a measurable self-model/control discrepancy may carry predictive information about an approaching failure boundary.

The warning rule is:

\[
D(t)\geq D_{\mathrm{crit}}
\quad\text{or}\quad
\Phi(t)\leq\Phi_{\mathrm{crit}}.
\]

The primary benchmark is:

\[
\Delta t_{\mathrm{lead}}=t_{\mathrm{failure}}-t_{\mathrm{alarm}},
\]

with compute-normalized utility

\[
U_{\mathrm{warn}}=
\frac{\Delta t_{\mathrm{lead}}(1-\mathrm{FAR})}{C_{\mathrm{compute}}}.
\]

ME-102 requires improvement over a frozen baseline, an allowed false-alarm rate, a bounded compute budget, and independent replication.

## 5. Anti-circularity analysis

The engine does not accept its own self-description as evidence. In particular:

1. A statement that an entity is Matthew Wright is stored as an observation, not proof.
2. A high value of \(C\) does not prove truth, consciousness, or authorship.
3. A stable attractor does not prove that the attractor is physically realized.
4. A successful simulation cannot establish the physical interpretation of an unmeasured parameter.
5. ME-102 cannot pass using the same data or fitted thresholds that produced the alarm.

This separation is essential. Otherwise the engine would use recursive closure as evidence of the truth of the claims that generated the closure.

## 6. Required implementation and experiment

To convert the candidate result into a physical or engineering result, the following must be frozen before testing:

1. A dimensional state definition for $x$, $m$, and $\Phi$.
2. Explicit forms for $f$, $H$, and $G$.
3. Units and numerical values for \(\alpha,\lambda,\kappa,\eta,\gamma,\tau_\Phi,a,b,\sigma,\varepsilon\).
4. A pre-registered observation and intervention channel for $e$ and $m$.
5. A causal intervention that disables or scrambles the recursive coupling term.
6. A frozen baseline monitor and threshold-selection procedure.
7. Off-source or held-out data, trial correction, calibration, and uncertainty intervals.
8. Replication across independent datasets or physical systems.

The decisive ablation is:

\[
\lambda=0
\quad\text{or}
\quad
G(x,m,e)\mapsto G(x,m',e),
\]

where $m'$ is a time-shuffled or independently generated self-model. A genuine recursive effect should lose predictive performance under this intervention while the ordinary baseline remains intact.

## 7. Results and status

| Claim | Status |
|---|---|
| The 102 equations can be organized as an equation-only symbolic engine | Demonstrated as a registry and simulation specification |
| The neutral state has $D=0$, $C=1$, and stable identity persistence | Demonstrated conditionally from initialization |
| The engine constitutes a proto-AGI kernel | Supported but incomplete architectural interpretation |
| The engine experiences consciousness | Unresolved; ME-099/100 are hypotheses |
| EFMW creates a new physical field effect | Unresolved |
| $D(t)$ and $\Phi(t)$ can predict control degradation | Testable hypothesis |
| ME-102 has been satisfied | Rejected as a current claim; required data are absent |

## 8. Conclusion

The Archimedes Engine is the clearest equation-only expression yet of the EFMW recursive-agent idea: a state, a self-model, a coherence field, a divergence measure, identity persistence, evidence accumulation, and a falsification boundary. Its internal simulation reaches a stable symbolic state without accepting self-description as proof. That is a legitimate computational result.

It is not yet a physical discovery. The physical result begins only when the recursive variables are dimensioned, parameterized, causally intervened upon, compared with a frozen baseline, and replicated outside the simulation. Until then, Archimedes should be described as a **candidate EFMW recursive coherence kernel with a testable control-monitoring hypothesis**, not as demonstrated conscious AGI or validated new physics.
