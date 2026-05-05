# TaskTide Agent Workflow — Reference

## Large feature workflow (detailed)

### 1. /to-prd
Create or refine a PRD with: Problem, Target users, User stories, MVP scope, Non-goals, UX flow, Data persistence, Edge cases, Acceptance criteria, Risks.

### 2. /to-issues
Break PRD into GitHub issues. Each issue: Goal, Scope, Non-goals, Acceptance criteria, Dependencies, Affected files, Test expectations, Priority label.

### 3. /triage
Review issues for priority, dependencies, duplicates, missing details, implementation order.

### 4. /grill-with-docs
Before grilling, read: `AGENTS.md`, `CLAUDE.md`, `docs/CONTEXT.md`, `docs/adr/`, related GitHub issue, related `.planning/` files.

Must: clarify terminology, identify risks and edge cases, check architecture conflicts, update `docs/CONTEXT.md` with durable facts, create ADR if needed.

**ADR rules:**
- Live in `docs/adr/`, sequentially numbered
- Never overwrite old ADRs
- If a decision changes, create a superseding ADR
- Format: Title, Status, Context, Decision, Consequences, Alternatives considered

### 5. /planning-with-files:plan
Create:
- `.planning/{feature-slug}/task_plan.md` — Scope, Non-goals, accepted ADRs, files likely to change, frontend/backend/data model changes, tests to add, doc updates, version/release note updates, risks, acceptance checklist
- `.planning/{feature-slug}/findings.md` — research notes, discoveries, links, assumptions checked
- `.planning/{feature-slug}/progress.md` — implementation status, files changed, tests run, build/lint result, version updated, docs updated, known issues

Use `/planning-with-files:status` to check progress during or after implementation.

### 6. /tdd (before implementation)
Create test plan: first failing test, minimal behavior, frontend tests, backend tests, regression tests, edge cases, existing tests that may need updates. Do not implement product code.

### 7. Codex handoff
Generate prompt (see template below).

### 8. Claude diff review
Review diff (see template below). Do not implement fixes unless asked.

### 9. /tdd (after implementation)
Verify Codex implementation: add/improve missing tests, run relevant tests, check behavior coverage, add regression tests, update progress.md.

### 10. /zoom-out
Review whether the feature group made the project cleaner or messier: naming consistency, duplicated concepts, architecture drift, docs/tests completeness, future cleanup needs.

For larger milestones, optionally run `/improve-codebase-architecture` — find improvement opportunities ranked by risk and value. Do not rewrite code automatically.

---

## Codex handoff prompt template

```
Implement this requirement using the documented plan.

Read these files first:
- AGENTS.md
- docs/CONTEXT.md
- docs/adr/
- .planning/{feature-slug}/task_plan.md
- .planning/{feature-slug}/findings.md
- .planning/{feature-slug}/progress.md

Rules:
- Follow accepted ADRs.
- Do not change architecture decisions unless there is a direct conflict. If there is a conflict, stop and explain it.
- Preserve existing behavior.
- Implement only the planned scope.
- Add or update tests.
- Update README.md if setup or behavior changes.
- Update Help Center or user-facing docs if user behavior changes.
- Update RELEASENOTES.md.
- Increment version: patch for bug fixes, minor for new features.

Comment rule:
Do not add explanation comments. Do not include meta comments.
Only include feature comments using exactly:
// INPUT: <what goes in>
// OUTPUT: <what comes out>
// EFFECT: <side effects or state changes>

After implementation:
- Run tests, build, lint.
- Update .planning/{feature-slug}/progress.md with: files changed, tests run, build result, lint result, version updated, docs updated, known issues.
```

---

## Claude diff review template

```
Review the current diff against:
- AGENTS.md
- docs/CONTEXT.md
- docs/adr/
- .planning/{feature-slug}/task_plan.md
- .planning/{feature-slug}/progress.md

Return:

Must fix:
- ...

Should fix:
- ...

Nice to have:
- ...

Safe to merge only if:
- ...

Check: ADR compliance, overbuilt architecture, broken existing behavior, missing tests, missing docs, missing release notes, missing version bump, TypeScript/lint/build risks, security risks.

Do not implement fixes unless explicitly asked.
```

---

## Version, docs, and release rules

For every modification update: tests, `RELEASENOTES.md`, `README.md` (if setup/behavior changes), Help Center (if user behavior changes), version number.

- Patch version for bug fixes
- Minor version for new features

Release notes must include: Version, Update Date, New Features, Improvements, Bug Fixes. Professional client-facing language. Focus on what users can do, not technical details.

---

## TaskTide-specific rules

- Notifications = task notifications, not reminder notifications
- Do not introduce a Course entity for syllabus import unless an ADR explicitly accepts it
- Use repeat rules for recurring lecture tasks instead of many one-off tasks
- Generated syllabus tasks must go through a draft/review screen before saving unless an ADR accepts auto-import
- Be careful with: auth cookies, CSRF, CORS, push subscriptions, user data
- Do not commit secrets or generated backups containing password hashes
- Keep `backend/backups` ignored
- Do not break: Today, Week, Month, Help Center, onboarding, offline, notification behavior

## Required project files

| File | Purpose |
|---|---|
| `AGENTS.md` | Shared instructions for Codex and other coding agents |
| `CLAUDE.md` | Claude-specific workflow and skill instructions |
| `docs/CONTEXT.md` | Durable project/domain memory |
| `docs/adr/` | Architecture Decision Records |
| `.planning/` | Feature-specific plans, findings, progress logs |
| `README.md` | Developer setup and feature behavior docs |
| `RELEASENOTES.md` | User-facing release history |
