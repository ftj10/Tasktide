// INPUT: raw syllabus text and optional mock Anthropic client
// OUTPUT: array of SyllabusTaskDraft objects extracted from the text
// EFFECT: calls Claude API with structured tool use to parse schedule events
const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default ?? AnthropicModule;
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUBMIT_TOOL = {
  name: 'submit_syllabus_tasks',
  description: 'Submit the list of schedule events extracted from a course syllabus.',
  input_schema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'sourceType', 'type', 'confidence', 'sourceText'],
          properties: {
            title: { type: 'string' },
            sourceType: {
              type: 'string',
              enum: [
                'final', 'midterm', 'assignment', 'quiz', 'project',
                'prep', 'lecture', 'lab', 'tutorial', 'other',
                'office_hour', 'reading',
              ],
            },
            type: { type: 'string', enum: ['once', 'recurring'] },
            date: { type: 'string', description: 'YYYY-MM-DD for once-type events' },
            termStart: { type: 'string', description: 'YYYY-MM-DD' },
            termEnd: { type: 'string', description: 'YYYY-MM-DD' },
            weekdays: {
              type: 'array',
              items: { type: 'integer', minimum: 1, maximum: 7 },
              description: 'ISO weekday numbers (1=Mon … 7=Sun)',
            },
            interval: { type: 'integer', minimum: 1 },
            startTime: { type: 'string', description: 'HH:MM' },
            endTime: { type: 'string', description: 'HH:MM' },
            location: { type: 'string' },
            description: { type: 'string' },
            excludedDates: {
              type: 'array',
              items: { type: 'string', description: 'YYYY-MM-DD' },
            },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            sourceText: { type: 'string' },
          },
        },
      },
    },
    required: ['tasks'],
  },
};

const REQUIRED_FIELDS = ['title', 'sourceType', 'type', 'confidence', 'sourceText'];
const DESCRIPTION_REQUIREMENT = 'Include a description for every event: one concise sentence with useful details from the syllabus, such as topic, deliverable, grading weight, required preparation, location context, or AI-suggested study context when confident.';

function getAnthropicApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const error = new Error('ANTHROPIC_API_KEY is required for syllabus analysis');
    error.configError = true;
    throw error;
  }
  return apiKey;
}

function createAnthropicClient() {
  return new Anthropic({ apiKey: getAnthropicApiKey() });
}

function isValidDraft(draft) {
  return REQUIRED_FIELDS.every(
    (field) => draft[field] !== undefined && draft[field] !== null && draft[field] !== '',
  );
}

// INPUT: client + params / OUTPUT: Message / EFFECT: streams the response to handle large outputs without hitting the non-streaming timeout guard
async function streamMessage(client, params) {
  return client.messages.stream(params).finalMessage();
}

function detectSectionAmbiguityQuestion(text) {
  const sectionMatches = text.match(/\b(?:section|sec\.?)\s+[A-Z]?\d{1,3}[A-Z]?|\b[A-Z]{1,3}\d{2}\b/gi) ?? [];
  const normalized = new Set(sectionMatches.map((match) => match.toLowerCase().replace(/\s+/g, ' ').trim()));
  return normalized.size > 1
    ? 'Which section are you enrolled in?'
    : null;
}

async function analyzeSyllabus(text, overrideClient) {
  const client = overrideClient ?? createAnthropicClient();

  let response;
  try {
    response = await streamMessage(client, {
      model: 'claude-opus-4-7',
      max_tokens: 32768,
      tool_choice: { type: 'tool', name: 'submit_syllabus_tasks' },
      tools: [SUBMIT_TOOL],
      messages: [
        {
          role: 'user',
          content: `Extract all academic planning items from the following course syllabus, including exams, assignments, projects, quizzes, readings, labs, tutorials, lectures, office hours, prep work, and any dated or recurring course obligations. For each item, determine whether it is a one-time occurrence or a recurring pattern. ${DESCRIPTION_REQUIREMENT}\n\n${text}`,
        },
      ],
    });
  } catch (err) {
    const error = new Error('Claude API call failed');
    error.claudeError = true;
    error.status = err.status;
    throw error;
  }

  if (response.stop_reason === 'max_tokens') {
    const error = new Error('Claude API response was truncated');
    error.claudeError = true;
    throw error;
  }

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) return [];

  const rawTasks = Array.isArray(toolUse.input?.tasks) ? toolUse.input.tasks : [];
  return rawTasks.filter(isValidDraft);
}

// INPUT: extractedText + optional studyPreferences string / OUTPUT: validated SyllabusTaskDraft[] / EFFECT: calls Claude API; throws {claudeError: true} on API failure, {validationError: true} on invalid schema
async function generateDrafts(extractedText, studyPreferences, overrideClient) {
  const client = overrideClient ?? createAnthropicClient();

  const prefNote = studyPreferences
    ? `\n\nStudent study preferences to guide prep task generation: ${studyPreferences}`
    : '';

  let response;
  try {
    response = await streamMessage(client, {
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      tool_choice: { type: 'tool', name: 'submit_syllabus_tasks' },
      tools: [SUBMIT_TOOL],
      messages: [
        {
          role: 'user',
          content: `Extract all academic planning items from this syllabus (exams, assignments, labs, lectures, office hours, readings, recurring sessions, prep tasks for high-priority items). For each, determine once vs recurring. Include a one-sentence description per item.${prefNote}\n\nSyllabus:\n${extractedText}`,
        },
      ],
    });
  } catch (err) {
    const error = new Error('Claude API call failed');
    error.claudeError = true;
    throw error;
  }

  if (response.stop_reason === 'max_tokens') {
    const error = new Error('Claude API response was truncated');
    error.claudeError = true;
    throw error;
  }

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) return [];

  const rawTasks = Array.isArray(toolUse.input?.tasks) ? toolUse.input.tasks : [];
  const valid = rawTasks.filter(isValidDraft);

  if (valid.length === 0 && rawTasks.length > 0) {
    const error = new Error('Claude response failed schema validation');
    error.validationError = true;
    throw error;
  }

  return valid;
}

async function detectAmbiguities(text, overrideClient) {
  const client = overrideClient ?? createAnthropicClient();
  const sectionQuestion = detectSectionAmbiguityQuestion(text);

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Read this syllabus excerpt. List up to 5 short questions whose answers would let you extract tasks more accurately (e.g. missing section IDs, unclear dates, ambiguous recurring patterns). If the syllabus includes multiple sections, labs, tutorials, or schedules that differ by section and the student's section is not specified, ask which section they belong to. If nothing is ambiguous, return an empty array. Return ONLY a JSON array of question strings, no markdown.\n\n${text}`,
        },
      ],
    });
  } catch (err) {
    const error = new Error('Claude API call failed');
    error.claudeError = true;
    throw error;
  }

  const textBlock = response.content?.find((block) => block.type === 'text');
  try {
    const parsed = JSON.parse(textBlock?.text ?? '');
    const questions = Array.isArray(parsed)
      ? parsed.filter((question) => typeof question === 'string')
      : [];
    const merged = sectionQuestion ? [sectionQuestion, ...questions] : questions;
    return [...new Set(merged)].slice(0, 5);
  } catch {
    return sectionQuestion ? [sectionQuestion] : [];
  }
}

module.exports = {
  analyzeSyllabus,
  generateDrafts,
  detectAmbiguities,
  getAnthropicApiKey,
  SUBMIT_TOOL,
};
