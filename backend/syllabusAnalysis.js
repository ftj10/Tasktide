// INPUT: raw syllabus text and optional mock Anthropic client
// OUTPUT: array of SyllabusTaskDraft objects extracted from the text
// EFFECT: calls Claude API with structured tool use to parse schedule events
const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default ?? AnthropicModule;

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

function isValidDraft(draft) {
  return REQUIRED_FIELDS.every(
    (field) => draft[field] !== undefined && draft[field] !== null && draft[field] !== '',
  );
}

async function analyzeSyllabus(text, overrideClient) {
  const client = overrideClient ?? new Anthropic();

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    tool_choice: { type: 'tool', name: 'submit_syllabus_tasks' },
    tools: [SUBMIT_TOOL],
    messages: [
      {
        role: 'user',
        content: `Extract all schedule events from the following course syllabus. For each event, determine whether it is a one-time occurrence or a recurring pattern.\n\n${text}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse) return [];

  const rawTasks = Array.isArray(toolUse.input?.tasks) ? toolUse.input.tasks : [];
  return rawTasks.filter(isValidDraft);
}

module.exports = { analyzeSyllabus, SUBMIT_TOOL };
