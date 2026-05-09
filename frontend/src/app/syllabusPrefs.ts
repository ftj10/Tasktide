export type StructuredPrefs = {
  examPrepDays: string;
  assignmentPrepDays: string;
  skipTypes: string[];
  prefsFreeText: string;
};

export function serializePreferences(prefs: StructuredPrefs): string {
  const parts: string[] = [];

  const examN = parsePositiveInt(prefs.examPrepDays);
  if (examN !== null) {
    parts.push(`Add a study task ${examN} ${examN === 1 ? "day" : "days"} before each exam or final.`);
  }

  const assignN = parsePositiveInt(prefs.assignmentPrepDays);
  if (assignN !== null) {
    parts.push(`Add a prep task ${assignN} ${assignN === 1 ? "day" : "days"} before each assignment or quiz.`);
  }

  if (prefs.skipTypes.length > 0) {
    parts.push(`Do not import ${prefs.skipTypes.join(", ")}.`);
  }

  if (prefs.prefsFreeText.trim()) {
    parts.push(prefs.prefsFreeText.trim());
  }

  return parts.join(" ");
}

function parsePositiveInt(value: string): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}
