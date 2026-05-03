# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — it points to `frontend/CONTEXT.md` and `backend/CONTEXT.md`. Read whichever is relevant to the topic.
- **`docs/adr/`** at the repo root — system-wide architectural decisions.
- **`frontend/docs/adr/`** — frontend-specific decisions.
- **`backend/docs/adr/`** — backend-specific decisions.

If any of these files don't exist, proceed silently. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT-MAP.md
├── docs/adr/                    ← system-wide decisions
├── frontend/
│   ├── CONTEXT.md
│   └── docs/adr/                ← frontend-specific decisions
└── backend/
    ├── CONTEXT.md
    └── docs/adr/                ← backend-specific decisions
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (example) — but worth reopening because…_
