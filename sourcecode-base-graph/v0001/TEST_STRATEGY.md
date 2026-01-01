# Test Strategy (initial)
- Current session: no tests run (deps missing). Once lockfile and installs are present:
  - Lint/typecheck: npm run lint --workspaces; add type-check scripts per workspace.
  - Backend unit tests: npm test --workspace=backend (jest).
  - Integration: curl-based smoke for /health, auth, sections, create_bill, results, reports.
  - Mobile: npx expo start smoke; component tests TBD.
- Validation outputs to artifacts/validation after runs.
