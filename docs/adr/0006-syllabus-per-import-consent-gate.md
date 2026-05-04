# Syllabus import requires per-import consent before sending data to AI

Before any syllabus content is sent to an AI provider, the import wizard shows a dedicated confirmation step. The user must explicitly click "Send to AI and Generate Tasks" — no implicit or account-wide consent.

The confirmation step must disclose: (1) which AI provider will receive the content, (2) what kind of content is being sent, (3) that only extracted import content is sent — not passwords, session tokens, or unrelated account data, (4) whether TaskTide stores the uploaded file or extracted text after generation, and (5) a collapsible preview of the exact extracted text.

Consent is per-import. A previous confirmation does not authorize future imports.

This was chosen over account-level consent because the feature sends potentially sensitive academic documents to a third-party API. Per-import consent keeps the disclosure current and auditable. It also aligns with the principle that each import is an independent action with its own data boundary.

**Consequence:** One additional wizard step per import for automatic mode. Friction reduction (e.g., "Remember my provider choice") is explicitly deferred post-MVP.

**Manual copy-paste mode** does not use the blocking consent gate. Because the user sees the full prompt, chooses the destination AI tool, and performs the copy/paste themselves, a blocking gate provides no privacy benefit. Manual mode shows an inline disclosure above the copy button: *"This prompt contains your extracted syllabus text. When you copy and paste it into ChatGPT, Claude, or another AI tool, you are sharing that text with the AI service you choose."* Clicking "Copy prompt and continue" acts as acknowledgement.
