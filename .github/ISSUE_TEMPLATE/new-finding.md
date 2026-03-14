---
name: New Audit Finding
about: Report a newly discovered UX, performance, or CRO issue on ajstore.com
title: "[FINDING] "
labels: audit-finding
assignees: ''
---

## Finding Summary

**Title:** <!-- Short description of the issue -->
**Category:** <!-- Technical / UX / CRO / SEO / Performance / Checkout / Accessibility -->
**Severity:** <!-- CRITICAL / HIGH / MEDIUM / LOW -->
**Revenue Impact:** <!-- Very High / High / Medium / Low -->

---

## Description

<!-- Explain the issue clearly. What is broken or missing? -->

---

## Evidence

<!-- Screenshots, URLs, tool reports (PageSpeed, GTmetrix, etc.) -->

---

## Affected Pages

- [ ] Homepage
- [ ] Category pages
- [ ] Product pages
- [ ] Cart / Checkout
- [ ] Search results
- [ ] Other: ___

---

## Suggested Fix

<!-- Brief description of the recommended solution -->

**Estimated Effort:** <!-- Low / Medium / High -->
**Suggested Phase:** <!-- 1 (0-30d) / 2 (1-3mo) / 3 (3-6mo) -->
**Suggested Owner:** <!-- Engineering / UX / Marketing / Content / DevOps -->

---

## Success Metrics

<!-- How will we know this is fixed? What KPI do we measure? -->

---

> Once accepted, add this finding to `data/audit-findings.json` and a corresponding recommendation to `data/recommendations.json`, then run `npm run validate && npm test`.
