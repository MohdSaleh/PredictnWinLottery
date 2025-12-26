# Prompt Schema (Strict YAML)
All work items must be expressed using this schema to prevent drift.

```yaml
task_id: <unique-id>
objective: "<single sentence outcome>"
scope_in:
  - "<what will change>"
scope_out:
  - "<what will NOT change>"
inputs:
  spec:
    - "<doc section>"
  screenshots:
    - "<path(s)>"
  code_refs:
    - "<file(s)>"
constraints:
  - "<non-negotiables>"
steps:
  - "<ordered steps>"
acceptance_criteria:
  - "<verifiable results>"
evidence_required:
  - "<logs/screenshots/commands>"
rollback:
  - "<how to revert>"
risks:
  - "<what could break>"
unknowns:
  - "none"
```

Quality gate: A task is invalid if it lacks objective/scope/acceptance/evidence.
