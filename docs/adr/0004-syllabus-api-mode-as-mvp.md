# Syllabus import supports two first-class generation methods sharing one review pipeline

Supersedes the earlier draft of this ADR.

The syllabus import wizard offers two generation methods the user selects at the start:

1. **Automatic generation** — TaskTide sends extracted text to Claude through the backend using the configured `ANTHROPIC_API_KEY`. Requires the per-import consent gate (ADR-0006) before any API call.
2. **Manual copy-paste** — TaskTide generates a structured prompt. The user copies it into their own AI tool (ChatGPT, Claude.ai), pastes the JSON result back into TaskTide, and TaskTide validates it.

Both methods produce the same `SyllabusImportDraftResult` (`SyllabusTaskDraft[]`). Everything after generation — JSON validation, review screen, confirm, batch import — is a single shared pipeline.

Manual was made a first-class option (not merely an API-failure fallback) because meaningful user groups need it: those who don't want to send their document through a third-party backend key, those using their own AI subscriptions, those who want to avoid API costs or rate limits, and those who want direct control over AI output.

If automatic generation fails, the wizard may offer to continue with the manual path without restarting the import.

**Consequence:** The MVP requires `ANTHROPIC_API_KEY` in `backend/.env` for the automatic path only. The manual path works with no backend AI configuration.
