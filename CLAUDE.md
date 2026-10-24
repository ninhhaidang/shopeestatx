## Agent skills

### Issue tracker

Issues live in GitHub Issues (ninhhaidang/shopeestatx), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Shopee API

What the order-list response contains, and why no new Shopee requests are allowed: `docs/shopee-order-api.md`.

## Verify

`npm run verify` runs the same checks as CI (typecheck, Knip unused-code check, tests with coverage, build, injected-script check). Run it on a clean `npm ci` before reporting work done.
