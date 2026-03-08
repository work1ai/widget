---
phase: 13
slug: ci-cd-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x with happy-dom |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Validate YAML syntax via manual review
- **After every plan wave:** Run `npm test -- --coverage` to confirm no regressions
- **Before `/gsd:verify-work`:** Full suite must be green + all three workflows verified on GitHub
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | CICD-01 | manual-only | Validate YAML + push to trigger | N/A (workflow) | ⬜ pending |
| 13-01-02 | 01 | 1 | CICD-02 | manual-only | Create test release or dry-run | N/A (workflow) | ⬜ pending |
| 13-01-03 | 01 | 1 | CICD-03 | manual-only | Inspect --provenance flag in publish step | N/A (workflow) | ⬜ pending |
| 13-01-04 | 01 | 1 | CICD-04 | manual-only | Push to master and verify Pages URL | N/A (workflow) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/` directory — create directory structure
- [ ] Manual repo setup: GitHub Pages source set to "GitHub Actions" in repo settings
- [ ] Manual repo setup: NPM_TOKEN secret added to repository secrets
- [ ] Manual repo setup: 'npm' environment created with protection rules

*Note: No test framework installation needed — Vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI triggers on push/PR | CICD-01 | Workflow execution requires GitHub infrastructure | Push to master, verify Actions tab shows CI run |
| npm publish with provenance | CICD-02, CICD-03 | Requires actual npm registry and GitHub Release | Create GitHub Release, verify npm package + provenance badge |
| Docs deploy to Pages | CICD-04 | Requires GitHub Pages infrastructure | Push to master, verify docs URL loads |

*All phase behaviors are infrastructure-as-code and require manual verification against live GitHub services.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
