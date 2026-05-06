import type { SyllabusTaskDraft } from "./syllabusSchema";
import { SyllabusTaskDraftSchema } from "./syllabusSchema";

export function validatePastedJson(raw: string): {
  drafts: SyllabusTaskDraft[];
  errors: string[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      drafts: [],
      errors: ["Not valid JSON — check for missing brackets or quotes."],
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      drafts: [],
      errors: [`Expected a JSON array (starting with [). Got: ${typeof parsed}`],
    };
  }
  const drafts: SyllabusTaskDraft[] = [];
  const errors: string[] = [];
  (parsed as unknown[]).forEach((item, idx) => {
    const result = SyllabusTaskDraftSchema.safeParse(item);
    if (result.success) {
      drafts.push(result.data);
    } else {
      for (const issue of result.error.issues) {
        errors.push(
          `Item ${idx + 1}: ${issue.path.join(".") || "(root)"} — ${issue.message}`
        );
      }
    }
  });
  return { drafts, errors };
}
