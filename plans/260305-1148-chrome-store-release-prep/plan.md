---
title: "Chrome Web Store Release Prep"
description: "Add onboarding flow, privacy policy page, and prepare store listing assets for public Chrome Web Store submission."
status: in-progress
priority: P1
effort: 6h
issue:
branch: main
tags: [feature, frontend, docs]
created: 2026-03-05
---

# Chrome Web Store Release Prep

## Overview

Prepare ShopeeStatX for public Chrome Web Store submission. Three independent work areas:
1. **Onboarding** — first-run welcome page explaining what extension does and how to use it
2. **Privacy Policy** — required page for store review + user trust
3. **Store Listing Assets** — fix version inconsistency, write descriptions, prepare screenshots

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Onboarding / First-run | Pending | 2h | [phase-01](./phase-01-onboarding-first-run.md) |
| 2 | Privacy Policy page | Pending | 1h | [phase-02](./phase-02-privacy-policy.md) |
| 3 | Store Listing Assets | Pending | 3h | [phase-03](./phase-03-store-listing-assets.md) |

## Dependencies

- Phase 1 and 2 are independent — can run in parallel
- Phase 3 depends on Phase 2 (privacy policy URL needed for store listing)
- No external dependencies — pure HTML/CSS/JS, no build step

## Key Files

| Action | File |
|--------|------|
| Modify | `ShopeeStatX/background.js` |
| Modify | `ShopeeStatX/popup.html` |
| Modify | `ShopeeStatX/manifest.json` |
| Create | `ShopeeStatX/welcome.html` |
| Create | `ShopeeStatX/welcome.css` |
| Create | `ShopeeStatX/privacy.html` |
| Create | `ShopeeStatX/privacy.css` |
| Create | `store-assets/` (descriptions, screenshot notes) |
