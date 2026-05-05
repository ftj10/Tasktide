---
name: tasktide-agent-workflow
description: Coordinates the full AI-assisted development workflow for TaskTide with Claude as planner/reviewer and Codex as the implementation/test owner. Use when the user gives a TaskTide requirement, bug, or improvement: classify it, select the command sequence, generate planning files, and produce a Codex handoff prompt. Triggers: any feature request, bug report, architecture question, or implementation task for the TaskTide repo.
---

# TaskTide Agent Workflow

## Quick start

1. Read the user's requirement
2. Classify it (see below)
3. Output: chosen path, reason, command sequence, files to read/update, next action
4. Generate the Codex handoff prompt for implementation and tests
5. When implementation or tests are needed, route the work to Codex; this is mandatory, not optional

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
→ /planning-with-files:plan → Claude TDD handoff prompt
→ Codex implements tests and code → Claude diff review → Codex fix prompt → /zoom-out
```

### Medium feature (3)
```
/grill-with-docs → /planning-with-files:plan → Claude TDD handoff prompt
→ Codex implements tests and code → Claude diff review → Codex fix prompt
```

### Small bug (1)
```
/diagnose → /planning-with-files:plan (if multi-step) → Codex diagnosis/TDD handoff prompt
→ Codex reproduces, tests, and fixes → Claude diff review
```

### Small docs/copy/UI (2)
```
/planning-with-files:plan → Codex handoff prompt → Codex implements → quick review
```

## One-time repo setup
Run once per repo before starting feature work:
```
/setup-matt-pocock-skills
```
Required files: `AGENTS.md`, `CLAUDE.md`, `docs/CONTEXT.md`, `docs/adr/`, `.planning/`, `README.md`, `RELEASENOTES.md`

## Claude and Codex roles

Claude owns:
- Requirement clarification
- Product and architecture grilling
- PRDs, issues, planning files, ADR proposals, and review feedback
- Generating implementation prompts for Codex
- Reviewing Codex diffs against the plan

Codex owns:
- Writing and updating tests
- Implementing product code
- Running test/build/lint verification
- Updating required project files during implementation
- Recording implementation progress

When a Claude command such as `/tdd` is selected, Claude must produce a Codex-ready prompt instead of writing tests itself. The prompt must tell Codex which failing test to create first, which behavior it proves, and how to continue the red-green-refactor loop.

## Claude Code Codex plugin

If `openai/codex-plugin-cc` is installed in Claude Code, use it to send implementation work directly to Codex:

```
/codex:rescue --background <Codex handoff prompt>
```

Use:
- `/codex:rescue` for implementation, bug investigation, test-first fixes, or continuing prior Codex work
- `/codex:status` to check background work
- `/codex:result` to retrieve Codex output and session details
- `/codex:review` or `/codex:adversarial-review` for read-only review after Codex changes
- `/codex:cancel` if a delegated job should stop

Use `/codex:rescue --background` for every task that needs implementation, bug investigation, or tests. If the plugin is not installed, still output the Codex handoff prompt and make Codex execution the required next action.

## Output format (every run)
1. **Chosen workflow path** — with reason
2. **Command sequence** — copyable list
3. **Files to read** — before starting
4. **Files to update** — after implementation
5. **Next action** — the immediate next step
6. **Codex handoff prompt** — required when implementation or tests are needed

See [REFERENCE.md](REFERENCE.md) for full workflow details, templates, and TaskTide-specific rules.
