# Progress bridge

## Overview

[bridge.ts](./bridge.ts) runs in the ISOLATED world and relays narrowly scoped MAIN-world progress messages to the extension runtime.

## Interface

- Installs a `window` message listener stored as `window.__shopeestatxBridge`.
- Accepts same-window messages with configured `MESSAGE_SOURCE`, `type: 'progress'`, a nonempty string `scanId`, and a nonnegative safe-integer `count`.
- Sends only `{ source, type: 'progress', scanId, count }` through `chrome.runtime.sendMessage`.
- Producer: `src/content/content.js`; source marker comes from `src/config.ts`.

## Invariants

- Reinjection removes the previous registered bridge listener before installing a replacement.
- Page messages can report progress only; they cannot invoke arbitrary extension commands through this bridge.
- Untrusted page data is filtered and reconstructed, not forwarded wholesale. A matching source marker does not authenticate the page itself.

## Side Effects

Adds/replaces a window message listener and sends accepted progress messages to Chrome runtime. No storage access or order fetches.

## Verification

Run from repository root: `npm test`. Full gate: `npm ci && npm run verify` (includes classic-script checks for built injected files). These commands were not run during documentation generation.
