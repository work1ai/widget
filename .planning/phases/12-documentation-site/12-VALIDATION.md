---
phase: 12
slug: documentation-site
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (existing project framework) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npm run docs:build` |
| **Full suite command** | `npm test && npm run docs:build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run docs:build`
- **After every plan wave:** Run `npm test && npm run docs:build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | DOCS-01 | smoke | `npm run docs:build` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | DOCS-02 | manual-only | Visual review of built site | N/A | ⬜ pending |
| 12-02-02 | 02 | 2 | DOCS-03 | manual-only | Visual review; count against API catalog | N/A | ⬜ pending |
| 12-02-03 | 02 | 2 | DOCS-04 | manual-only | Visual review of built site | N/A | ⬜ pending |
| 12-02-04 | 02 | 2 | DOCS-05 | manual-only | Visual review; count against event catalog | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] VitePress installed as devDependency
- [ ] `docs/.vitepress/config.ts` created with base path and custom element config
- [ ] `docs:dev`, `docs:build`, `docs:preview` scripts added to package.json

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Integration guide has script tag + npm examples | DOCS-02 | Content review | Open built site, verify both install methods shown with code |
| API reference lists all attributes and CSS props | DOCS-03 | Content completeness | Count attributes (11) and CSS props (12) against source catalog |
| Theming guide has visual examples | DOCS-04 | Visual review | Verify theme recipes render correctly in preview |
| Events page documents lifecycle and DOM events | DOCS-05 | Content completeness | Count events (4) and states (3) against source catalog |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
