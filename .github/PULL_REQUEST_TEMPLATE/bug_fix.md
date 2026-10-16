# Bug fix

<!--
The PR title is validated by .github/workflows/commitlint.yml and must follow
Conventional Commits: `fix: <subject>`, or `fix(<scope>): <subject>`. Allowed
types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
Casing is not enforced.
-->

## Summary

<!-- What was broken, and what this changes. A few sentences. -->

## Related issue

<!-- Closes #123. Write "None" if this stands on its own. -->

## Root cause

<!-- Why did this happen? A wrong assumption, a missing check, a regression from a specific change. -->

## Changes

<!-- The approach you took, and any decision a reviewer would want to know about. -->

## How this was verified

<!--
Tests, or the exact manual steps you followed. Notploy's test suite lives in
apps/notploy/__test__ (vitest) and runs with `pnpm test`; `pnpm typecheck` and
`pnpm lint` (Biome) cover the workspace.
-->

- [ ] Added or updated a test in `apps/notploy/__test__/` that fails without this change
- [ ] Verified manually — steps: <!-- ... -->
- [ ] No new test — the fix is in wiring, styling, or configuration

## Compatibility

<!--
Does this change any documented behavior, configuration key, environment variable,
or API response shape? Answer in one line and move on; use "No".
-->

## Documentation

<!-- Did a documented behavior change? Link the docs page you updated, or say "Not needed". -->

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes, or the change has no test impact
- [ ] No secrets, tokens, credentials, `.env` values, private hostnames, or personal data in the diff
- [ ] Added a changeset (`pnpm changeset`) if this is a user-facing fix that affects a published package
- [ ] Confirmed the issue is not a security vulnerability (those go to the private advisory, not here)
