# AI output uses a separate SyllabusTaskDraft schema, not the native Task shape

The JSON the AI produces during syllabus import uses a dedicated `SyllabusTaskDraft` schema rather than the internal `Task` type. The app transforms `SyllabusTaskDraft` → `Task` at import time.

Producing native `Task` JSON from the AI would couple the AI prompt contract to the internal data model. Any future change to `Task` fields, type names, or recurrence shape would silently break saved prompts or cached AI outputs. A separate schema also allows AI-specific fields (e.g., `termStart`, `termEnd`, `type: "recurring"`) that have no equivalent in `Task`, and keeps the prompt readable for non-technical users who may inspect it.

**Consequence:** A transformation layer is required and must be tested. The `SyllabusTaskDraft` schema is a stable public contract — breaking changes require a versioned prompt update.
