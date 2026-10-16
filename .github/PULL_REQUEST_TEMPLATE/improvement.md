# Improvement

<!--
The PR title is validated by .github/workflows/commitlint.yml and must follow
Conventional Commits. Pick the type that matches the change:
  perf   — measurable speed or resource win
  refactor — structure, no behavior change
  fix    — the change also corrects a defect
  feat   — it adds a capability after all
Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
Casing is not enforced.
-->

## Summary

<!-- What is better now, in a few sentences. -->

## Related issue

<!-- Closes #123. Write "None" if this stands on its own. -->

## Current state

<!-- How it behaves today, with a measurement or example if you have one. -->

## What changed and why

<!-- The approach, and the reasoning. Call out the trade-offs you accepted. -->

## Expected impact

<!-- Who benefits, and how you would tell the change worked. -->

## Alternatives considered

<!-- What else you evaluated, and why you did not go with it. -->

## Tests

<!-- New or updated tests, and what they cover. `pnpm test` runs the vitest suite in apps/notploy/__test__. -->

## Compatibility

<!-- Does this change documented behavior, configuration, or an API response shape? Write "No" if not. -->

## Documentation

<!-- Link the docs pages you added or updated, or say "Not needed". -->

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes, or the change has no test impact
- [ ] Added a changeset (`pnpm changeset`) if this is a user-facing change
- [ ] No secrets, tokens, credentials, `.env` values, private hostnames, or personal data in the diff
