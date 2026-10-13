# Reproducible Lean verification

Use the committed toolchain and dependency manifest. The workflow restores
applicable caches, builds the configured library, and audits every safe
declaration defined in the project modules listed in `Audit.lean`, including
private declarations. The permitted axioms are `propext`, `Classical.choice`, and `Quot.sound`.

```sh
lake exe cache get
lake build
lake env lean -DwarningAsError=true Audit.lean
python3 scripts/test_axiom_audit.py
```

The rejection controls inject a public axiom, private axiom and placeholder proof
and require the audit to fail for the intended reason.
Native proof evaluation is also rejected.

The successful job summary records the exact commit and workflow run. Source
declarations and hypotheses determine the mathematical scope; a successful
build does not validate a broader empirical or scientific interpretation.
