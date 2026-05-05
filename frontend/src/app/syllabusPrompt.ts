export function buildSyllabusPrompt(text: string, preferences?: string): string {
  const prefSection = preferences?.trim()
    ? `\nUser preferences:\n${preferences.trim()}\n`
    : "";
  return `You are extracting academic tasks from a course syllabus. Return ONLY a valid JSON array of task objects — no markdown fences, no explanation, no preamble.

Each object must conform exactly to this shape:
{
  "title": string,
  "sourceType": one of: final | midterm | assignment | quiz | project | prep | lecture | lab | tutorial | other | office_hour | reading,
  "type": "once" | "recurring",
  "confidence": "high" | "medium" | "low",
  "sourceText": verbatim excerpt from the input that describes this task,

  // For type "once" (single events: exams, due dates, one-off deadlines):
  "date": "YYYY-MM-DD",

  // For type "recurring" (repeated events: lectures, labs, tutorials, office hours):
  "termStart": "YYYY-MM-DD",
  "termEnd": "YYYY-MM-DD",
  "weekdays": [array of integers, 1=Monday 2=Tuesday 3=Wednesday 4=Thursday 5=Friday 6=Saturday 7=Sunday],
  "interval": integer (weeks between occurrences, usually 1),

  // Optional for both types:
  "startTime": "HH:MM" (24-hour),
  "endTime": "HH:MM" (24-hour),
  "location": string,
  "description": string,
  "excludedDates": ["YYYY-MM-DD"] (dates to skip for recurring tasks)
}

Rules:
- confidence: "high" if date/time is explicitly stated; "medium" if inferred from context (e.g. "weekly on Tuesdays"); "low" if ambiguous or date is missing
- sourceType choices: final=final exam, midterm=midterm exam, assignment=homework/assignment, quiz=quiz, project=project/group work, prep=preparation task, lecture=lecture session, lab=lab session, tutorial=tutorial/recitation, office_hour=office hours, reading=reading, other=anything else
- sourceText must be copied verbatim from the input
- Omit fields that are not applicable; do not include null values
- Dates always in YYYY-MM-DD format; times always in HH:MM 24-hour format
- Weekdays: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
${prefSection}
Syllabus text:
${text}`;
}
