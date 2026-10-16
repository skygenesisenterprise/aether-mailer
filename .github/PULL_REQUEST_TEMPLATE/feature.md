# Feature

<!--
The PR title is validated by .github/workflows/commitlint.yml and must follow
Conventional Commits: `feat: <subject>`, or `feat(<scope>): <subject>`. Allowed
types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
Casing is not enforced.
-->

## Summary

<!-- What this adds, in a few sentences. -->

## Related issue

<!-- Closes #123. Write "None" if this stands on its own. -->

## Use case

<!--
Who uses this, what they do, and what they cannot do today. This is the part
reviewers care about most.
-->

## Implementation notes

<!--
Key technical decisions and the trade-offs behind them — anything a reviewer
would otherwise have to reverse-engineer from the diff.
-->

## API surface

<!--
Notploy's public interface is generated from the tRPC routers in
`apps/notploy/server/api/routers/`. If you touched them, say what changed and
confirm the generated artifacts were refreshed:

  pnpm generate:openapi        # regenerates openapi.json at the repository root
  # then refresh the copies consumed by:
  #   packages/cli/openapi.json                        (pnpm --filter @notploy/cli build)
  #   packages/sdk/openapi.json                       (pnpm --filter @notploy/sdk generate)
  #   packages/mcp/src/generated/openapi.json         (pnpm --filter @notploy/mcp generate:all)
  #   web/apps/docs/public/openapi.json               (API reference, web/apps/docs build:docs)

Do not hand-edit generated files — packages/sdk/src, packages/cli/src/generated,
web/apps/docs/content/docs/api, and packages/mcp/src/generated are all produced.
-->

- [ ] No public API change
- [ ] Router changed — `openapi.json` and its copies regenerated and committed
- [ ] Backward compatible (new optional fields/endpoints only)
- [ ] Breaking change — described below

## Tests

<!--
New or updated tests, and what they cover. `pnpm test` runs the vitest suite in
apps/notploy/__test__. Add a test even if the change looks UI-only when it
touches routing, services, or builders.
-->

## Breaking changes and migration

<!--
What breaks for existing self-hosted instances and Notploy Cloud users, and what
they must do. Include new environment variables, renamed configuration keys, or
database migrations. Write "None" if there are none.
-->

## Documentation

<!-- Link the docs pages you added or updated, or say "Not needed". -->

## Screenshots

<!-- Required for dashboard changes. Before / after, light and dark. -->

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes, or the change has no test impact
- [ ] Added a changeset (`pnpm changeset`) for a user-facing change
- [ ] No secrets, tokens, credentials, `.env` values, private hostnames, or personal data in the diff
