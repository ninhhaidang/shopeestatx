# Red Team Review: xlsx → exceljs Migration

**Reviewer:** Assumption Destroyer
**Date:** 2026-03-06
**Plan:** 260306-2004-exceljs-migration

---

## Finding 1: No Evidence of Active Exploitation

**Assumption:** The `xlsx` package is vulnerable and poses an active security risk.

**Reality:** The plan cites "known CVEs" but provides:
- No CVE IDs
- No evidence the vulnerabilities are exploitable in THIS usage
- The code uses `xlsx` for **write-only** operations (export), not parsing untrusted files

The vulnerable code paths (XML parsing, formula evaluation) are **never triggered** because the app:
1. Never parses external XLSX files
2. Only writes data TO files using `json_to_sheet()` and `writeFile()`

**Severity:** Medium
**Challenge:** Show me a real-world attack vector where exporting data TO a file enables exploitation.

---

## Finding 2: Client-Side Vulnerability = Theoretical Risk

**Assumption:** This vulnerability poses a real threat to users.

**Reality:** This is a **client-side web app**. Even if `xlsx` had RCE vulnerabilities:
- No server-side component is affected
- Users only export their own data
- There's no untrusted input being parsed

**Severity:** Low
**Challenge:** What's the actual attack surface here? A malicious user... attacking themselves?

---

## Finding 3: exceljs Has Not Been Proven Safer Long-Term

**Assumption:** exceljs is a safer alternative.

**Reality:**
- exceljs has **no security audit** documented
- It has fewer reported issues primarily because it's less widely used
- The plan admits: "Any vulnerability in the XLSX parsing/writing libraries exceljs depends on could affect this app"
- exceljs uses the same underlying formats (Office Open XML)

**Severity:** Medium
**Challenge:** This is swapping one unproven library for another. The "fix" is theater.

---

## Finding 4: CSV Export Already Exists as Simpler Alternative

**Assumption:** We need Excel format.

**Reality:** The code already has `exportToCSV()` which:
- Has zero external dependencies
- Cannot have XML-based vulnerabilities (it's plain text)
- Opens in Excel just fine
- Is 10x simpler code

**Severity:** High
**Alternative:** If Excel-specific formatting isn't required, **just delete xlsx and tell users to use CSV**.

---

## Finding 5: Time Cost vs Security Benefit = Negative ROI

**Assumption:** 15 minutes of work is worth the security improvement.

**Reality:**
- 15 min × developer time = ~$50-100 opportunity cost
- Zero actual vulnerabilities being fixed
- New bugs could be introduced (the migration code has no test coverage shown)
- The "fix" creates maintenance burden for future developers

**Severity:** Medium
**Alternative:** Do nothing. Or just remove xlsx entirely and rely on CSV.

---

## Summary

| Question | Answer |
|----------|--------|
| Is xlsx actually vulnerable in this usage? | **Unlikely** - only write operations |
| Is client-side exploitation realistic? | **No** - users export their own data |
| Is exceljs proven safer? | **No** - no security audit, same attack surface |
| Is Excel format actually required? | **No** - CSV already works |
| Is the time worth it? | **No** - negative ROI |

---

## Verdict

This migration is **security theater** - replacing one unproven library with another to fix theoretical vulnerabilities that don't apply to this use case.

### Recommended Actions (in order of sanity):

1. **Just remove xlsx** - keep CSV export only (easiest)
2. **Keep both xlsx and CSV** - accept that client-side export has no real risk
3. **Do the full migration** - if you must, at least add tests first

---

**Unresolved Questions:**
- What specific CVEs is this fixing? (No CVE IDs provided)
- Is there an actual threat model that justifies this work?
- Has anyone ever been compromised by xlsx in a client-side export scenario?
