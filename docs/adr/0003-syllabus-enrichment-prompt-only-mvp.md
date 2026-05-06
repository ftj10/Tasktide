# MVP enrichment is a prompt instruction only — no live data sources

In MVP, UBC enrichment is limited to a single instruction in the AI prompt asking the model to include brief optional context from its general knowledge when confident. No live API calls, scraping (Rate My Professors, UBC Grades), or external data fetches are performed.

Live enrichment was deferred because scraping third-party sites (Rate My Professors, UBC Grades) carries ToS and legal exposure, and the unofficial UBC course schedule API is unstable. Building any enrichment pipeline before resolving those issues would create liability without predictable quality.

**Consequence:** Enrichment quality depends on what the AI already knows. Common courses (CPSC 110, MATH 100) may get useful context; obscure upper-year courses may get nothing or incorrect information. AI-added context must be labelled as unofficial or AI-suggested in the review screen, and users must be able to edit or remove it before import.
