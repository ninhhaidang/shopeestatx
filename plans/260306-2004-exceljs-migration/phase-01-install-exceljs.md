# Phase 1: Install exceljs & remove xlsx

## Context
- Plan: [260306-2004-exceljs-migration/plan.md](../plan.md)
- Related: [researcher report](../../reports/researcher-260306-2004-exceljs-browser-usage.md)

## Overview
| Item | Value |
|------|-------|
| Priority | High |
| Status | ⏳ Pending |

## Requirements
- Install `exceljs` package
- Remove `xlsx` package from dependencies
- Run `npm audit` to verify vulnerability is fixed

## Implementation Steps

### 1.1 Remove xlsx package
```bash
npm uninstall xlsx
```

### 1.2 Install exceljs
```bash
npm install exceljs
```

### 1.3 Verify security fix
```bash
npm audit
```

Expected: No high severity vulnerabilities

## Verification
- [x] `xlsx` removed from package.json
- [x] `exceljs` added to package.json
- [x] `npm audit` shows no high severity vulnerabilities
