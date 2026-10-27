# Repository scripts

## Overview

[check-injected-scripts.mjs](./check-injected-scripts.mjs) checks that built files referenced by script injection parse as classic JavaScript, rather than ES modules.

## Interface

- Run `npm run check:injected` from repository root after a build; it invokes the Node script.
- Recursively scans `.ts` files under `src`, first selecting sources containing `executeScript`, then collecting quoted filenames from `files: [...]` arrays.
- Reads each collected path under `dist`, rejects line-leading `import`/`export`, and parses with `new Function(code)` without invoking the function.
- Emits `ok` or `FAIL` per discovered file and exits zero only when all discovered files pass. No discovered files is an explicit failure.

## Invariants

- Repository root resolves relative to the script, not current shell directory.
- A built `dist` tree must exist. Missing/unreadable source or output files fail through Node errors rather than silently passing.
- Discovery is a textual pattern, not a TypeScript AST walk: it scans `.ts` only and expects literal quoted paths in `files` arrays. Injection-call refactors must keep this checker aligned.
- Set-based collection checks each referenced filename once. Parsing does not execute injected code or prove runtime browser behavior.

## Side Effects

Reads source/build files, writes status to stdout/stderr, and terminates the Node process with pass/fail status. Does not modify files, rebuild assets, or launch a browser.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify`, which builds before invoking `npm run check:injected`. These commands were not run during documentation generation.
