# Documentation

<!--
The PR title is validated by .github/workflows/commitlint.yml: use `docs: <subject>`.
Casing is not enforced.
-->

## Summary

<!-- What changed in the documentation, in a few sentences. -->

## Related issue

<!-- Closes #123. Write "None" if this stands on its own. -->

## What was wrong, and what it says now

<!--
For a fix: what the page claimed and what the current behavior actually is.
For a new page: what it covers and who it is for.
-->

## Pages changed

<!-- File paths under web/apps/docs/content/docs/, or the repository file. -->

## Source of truth

<!--
The API reference under `content/docs/api/` is generated from the OpenAPI
specification. If your change belongs there, the real fix is the router and its
`.meta` in `apps/notploy/server/api/routers/`, not the generated MDX.
-->

- [ ] Hand-written docs only
- [ ] Fixed upstream in a router — link the router PR

## Validation

<!--
How you checked it renders and reads correctly. `pnpm docs:dev` serves the docs
site on port 3002; `pnpm docs:build` performs the static export.
-->

- [ ] Read the page in the local docs site
- [ ] Followed every command or link on the page
- [ ] Checked the left-hand navigation if you added a page

## Checklist

- [ ] `pnpm docs:build` passes
- [ ] `pnpm lint` passes
- [ ] New or updated pages are listed in the relevant `meta.json` navigation
- [ ] No secrets, tokens, credentials, `.env` values, private hostnames, or personal data in the diff
- [ ] Added a changeset (`pnpm changeset`) — not needed for docs-only changes
