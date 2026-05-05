---
name: tasktide-agent-workflow
description: Coordinates the full AI-assisted development workflow for TaskTide. Claude handles product design, requirement grilling, architecture decisions, planning, TDD, diagnosis, and review. Codex handles implementation from documented Markdown files. Use when the user gives a TaskTide requirement, bug, or improvement — classify it, select the command sequence, generate planning files, and produce a Codex handoff prompt. Triggers: any feature request, bug report, architecture question, or implementation task for the TaskTide repo.
---

# TaskTide Agent Workflow

## Quick start

1. Read the user's requirement
2. Classify it (see below)
3. Output: chosen path, reason, command sequence, files to read/update, next action
4. Do not implement code unless the user explicitly asks

## Classification

| Type | Examples |
|---|---|
| **1. Small bug** | CSRF fail, blank offline page, push BadJwtToken |
| **2. Small docs/copy/UI** | Copy change, help text tweak, README update |
| **3. Medium feature** | Tooltip, stats page move, small settings flow |
| **4. Large feature** | Syllabus import, offline mode, new account system |
| **5. Architecture change** | Auth refactor, new DB schema, split backend |

## Command sequences

### Large feature (4–5)
```
/to-prd → /to-issues → /triage → /grill-with-docs
→ /planning-with-files:plan → /tdd
→ Codex handoff → Claude diff review → /tdd → /zoom-out
```

### Medium feature (3)
```
/grill-with-docs → /planning-with-files:plan → /tdd
→ Codex handoff → Claude diff review → /tdd
```

### Small bug (1)
```
/diagnose → /planning-with-files:plan (if multi-step) → Codex handoff → /tdd
```

### Small docs/copy/UI (2)
```
/planning-with-files:plan → Codex handoff → quick review
```

## One-time repo setup
Run once per repo before starting feature work:
```
/setup-matt-pocock-skills
```
Required files: `AGENTS.md`, `CLAUDE.md`, `docs/CONTEXT.md`, `docs/adr/`, `.planning/`, `README.md`, `RELEASENOTES.md`

## Output format (every run)
1. **Chosen workflow path** — with reason
2. **Command sequence** — copyable list
3. **Files to read** — before starting
4. **Files to update** — after implementation
5. **Next action** — the immediate next step
6. **Codex handoff prompt** — when ready for implementation

See [REFERENCE.md](REFERENCE.md) for full workflow details, templates, and TaskTide-specific rules.
