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

### 6. Claude TDD handoff prompt
Create a Codex-ready TDD prompt: first failing test, minimal behavior, frontend tests, backend tests, regression tests, edge cases, existing tests that may need updates. Claude must not implement product code or write tests; Codex execution is mandatory whenever implementation or tests are needed.

### 7. Codex handoff
Generate prompt (see template below). Codex owns the implementation, including test creation, product code, required docs, version bump, release notes, and verification commands. Do not treat the Codex step as optional.

If Claude Code has `openai/codex-plugin-cc` installed, delegate the prompt with:

```
/codex:rescue --background <Codex handoff prompt>
```

Use `/codex:status` to monitor background jobs and `/codex:result` to retrieve the final output. Use `/codex:review` for a standard read-only review and `/codex:adversarial-review` when Claude wants Codex to challenge design choices, risks, or assumptions. If the plugin is unavailable, output the handoff prompt as plain text and make running that prompt in Codex the required next action.

### 8. Claude diff review
Review diff (see template below). Do not implement fixes unless asked.

### 9. Codex fix prompt after review
If review finds missing tests or behavior gaps, generate a focused Codex fix prompt. Claude should describe the gap and expected observable behavior; Codex should update tests, implementation, docs, and progress files.

### 10. /zoom-out
Review whether the feature group made the project cleaner or messier: naming consistency, duplicated concepts, architecture drift, docs/tests completeness, future cleanup needs.

For larger milestones, optionally run `/improve-codebase-architecture` — find improvement opportunities ranked by risk and value. Do not rewrite code automatically.

---

## Codex handoff prompt template

```
Implement this requirement using the documented plan. Codex owns all tests and implementation work.

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
- Add or update tests first. Start with the first failing test described below, then implement the minimal code needed to pass it.
- Continue one behavior at a time until the planned scope is complete.
- Update README.md if setup or behavior changes.
- Update Help Center or user-facing docs if user behavior changes.
- Update RELEASENOTES.md.
- Increment version: patch for bug fixes, minor for new features.

First failing test:
- Behavior:
- Public interface:
- Expected failure before implementation:
- Minimal implementation after failure:

Remaining behaviors:
- Behavior:
- Test file:
- User-visible acceptance check:

Comment rule:
Do not add explanation comments. Do not include meta comments.
Only include feature comments using exactly:
INPUT:
OUTPUT:
EFFECT:

After implementation:
- Run tests, build, lint.
- Update .planning/{feature-slug}/progress.md with: files changed, tests run, build result, lint result, version updated, docs updated, known issues.
```

## Claude Code plugin command template

```
/codex:rescue --background Implement this requirement using the documented plan. Codex owns all tests and implementation work.

Read these files first:
- AGENTS.md
- docs/CONTEXT.md
- docs/adr/
- .planning/{feature-slug}/task_plan.md
- .planning/{feature-slug}/findings.md
- .planning/{feature-slug}/progress.md

Use the first failing test and remaining behavior sections from the handoff prompt. Follow the comment rule exactly. Run tests/build/lint and update progress.md before finishing.
```

After starting a background delegation:

```
/codex:status
/codex:result
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

## Codex fix prompt template

```
Address the review findings below. Codex owns all tests and implementation changes.

Read these files first:
- AGENTS.md
- .planning/{feature-slug}/task_plan.md
- .planning/{feature-slug}/progress.md
- Relevant source and test files from the review

Review findings:
- ...

Required behavior:
- ...

Implementation rules:
- Add or update tests before changing product code when the gap is behavioral.
- Keep the fix scoped to the review finding.
- Preserve existing behavior outside the finding.
- Update required docs, release notes, version, and progress files if the fix changes user-facing behavior or project process.
- Run the relevant tests and build checks.
```

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
