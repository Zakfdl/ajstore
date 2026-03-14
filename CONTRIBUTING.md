# Contributing to the AJStore Audit Report

This document explains how to update, maintain, and extend this audit report.

## 🔒 Access Control

This is a **confidential internal document**. Contributors must be members of the Ajlan & Brothers digital team or authorized consultants.

---

## 📋 How to Update Audit Findings

All findings are stored in `data/audit-findings.json`. When an issue is resolved or a new one is discovered:

### Marking an Issue as Resolved

Add a `resolved` field to the finding:

```json
{
  "id": "F-001",
  "title": "JavaScript-only rendering",
  ...
  "resolved": true,
  "resolved_date": "2026-04-15",
  "resolved_notes": "Prerender.io deployed. PageSpeed mobile now 72."
}
```

### Adding a New Finding

Copy an existing finding object and:
1. Assign a new sequential ID (e.g., `F-013`)
2. Set appropriate `severity`, `category`, and `revenue_impact`
3. Set `fix_phase` to 1, 2, or 3
4. Run `npm run validate` to confirm the file is valid

---

## 🎯 How to Update Recommendations

All recommendations are in `data/recommendations.json`.

### Marking a Recommendation as Complete

```json
{
  "id": "R-001",
  ...
  "status": "COMPLETE",
  "completed_date": "2026-04-10",
  "outcome": "PageSpeed mobile improved from 17 to 74. Organic impressions up 45% in 30 days."
}
```

### Adding a New Recommendation

Assign the next sequential ID (e.g., `R-025`) and ensure:
- `phase` is 1, 2, or 3
- `effort` is one of: `Low`, `Medium`, `High`
- `impact` is one of: `Low`, `Medium`, `High`, `Very High`
- `success_metrics` is a non-empty array
- `owner` is assigned to a team or person

---

## 🗺️ How to Update the Roadmap

When tasks are completed or timelines shift, update `data/roadmap.json`. Add a `status` field to task objects:

```json
{
  "rec_id": "R-001",
  "title": "Deploy Prerender.io",
  "status": "COMPLETE",
  "completed_date": "2026-04-01"
}
```

---

## 🔨 Development Workflow

```bash
# 1. Clone the repository
git clone <repo-url>
cd ajstore-audit

# 2. Make your changes to data files or report HTML

# 3. Validate data integrity
npm run validate

# 4. Run the full test suite
npm test

# 5. Build to dist/
npm run build

# 6. Preview the report
npm run dev

# 7. Commit with a clear message
git add .
git commit -m "feat: mark F-001 as resolved — SSR deployed"
git push
```

---

## 📝 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New findings, new recommendations |
| `fix:` | Correcting data errors |
| `docs:` | README, CHANGELOG updates |
| `data:` | Updates to JSON data files |
| `style:` | Report HTML/CSS changes |
| `chore:` | Build scripts, config changes |

---

## ✅ Before Every Commit

Run this checklist:
- [ ] `npm run validate` — passes with 0 errors
- [ ] `npm test` — all tests pass
- [ ] CHANGELOG.md updated with what changed
- [ ] No sensitive data (passwords, API keys) committed
