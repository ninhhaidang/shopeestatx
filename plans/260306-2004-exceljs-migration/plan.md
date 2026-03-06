# Plan: Migrate xlsx to exceljs

**Date:** 2026-03-06
**Status:** ✅ Completed

## Overview
Replace vulnerable `xlsx` package with `exceljs` to fix security vulnerabilities.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Install exceljs & remove xlsx | ✅ Done |
| 2 | Migrate export.ts code | ✅ Done |
| 3 | Test Excel export | ✅ Done |

## Dependencies
- Phase 1 → Phase 2
- Phase 2 → Phase 3

## Key Changes
- Replace `import * as XLSX from 'xlsx'` → `import ExcelJS from 'exceljs'`
- Use `writeBuffer()` + Blob for browser download
- OOP API vs functional utils
- Add error handling for better UX

## Risks
- Low: Simple 1-file change
- Verify export still works after migration

## Effort
~15 minutes total

---

**Phase Files:**
- [phase-01-install-exceljs.md](phase-01-install-exceljs.md)
- [phase-02-migrate-export-code.md](phase-02-migrate-export-code.md)
- [phase-03-test-export.md](phase-03-test-export.md)

---

## Validation Log

| Date | Question | Answer |
|------|----------|--------|
| 2026-03-06 | Red Team gợi ý thêm improvements | Thêm error handling (empty check + catch) |
