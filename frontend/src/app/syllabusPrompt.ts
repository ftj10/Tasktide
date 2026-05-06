export function buildSyllabusPrompt(text: string, preferences?: string): string {
  const prefSection = preferences?.trim()
    ? `\nStudent preferences:\n${preferences.trim()}\n`
    : "";
  return `You are a course task extractor. Follow TWO steps:

STEP 1 — CLARIFY
Read the syllabus below. Identify up to 5 questions whose answers would help you extract tasks accurately (e.g. missing section IDs, ambiguous dates, unclear recurrence). Ask them now. If nothing is unclear, say "No clarifications needed — ready to extract."

STEP 2 — EXTRACT (after I answer, or if no clarifications needed)
Extract all academic tasks and return ONLY a valid JSON array. No markdown, no preamble.

Each object must conform to this shape:
{"title":string,"sourceType":"final"|"midterm"|"assignment"|"quiz"|"project"|"prep"|"lecture"|"lab"|"tutorial"|"other"|"office_hour"|"reading","type":"once"|"recurring","confidence":"high"|"medium"|"low","sourceText":"verbatim excerpt","date":"YYYY-MM-DD" (once only),"termStart":"YYYY-MM-DD" (recurring only),"termEnd":"YYYY-MM-DD" (recurring only),"weekdays":[1-7] (recurring only),"interval":integer,"startTime":"HH:MM","endTime":"HH:MM","location":string,"description":"one concise sentence"}

Rules: omit null/inapplicable fields; dates in YYYY-MM-DD; times in HH:MM 24h; confidence=high if explicit, medium if inferred, low if ambiguous.
${prefSection}
Syllabus:
${text}`;
}
