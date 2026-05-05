// INPUT: repository root AGENTS.md
// OUTPUT: behavior coverage for required agent operating instructions
// EFFECT: prevents accidental removal of the repository agent guidance file
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const agentsPath = path.join(repoRoot, 'AGENTS.md');

test('behavior: AGENTS.md exists with required repository guidance', () => {
  assert.equal(fs.existsSync(agentsPath), true);

  const content = fs.readFileSync(agentsPath, 'utf8');

  [
    '# AGENTS.md',
    '## Code Comments',
    '# Versioning Rules',
    '# Required Update Areas',
    '# RELEASENOTES.md',
    '# Help Center Requirements',
    '# 1. How To Use This Website',
    '# 2. Quick Walkthroughs',
    '# 3. Common Q&A',
    '# README.md Rules',
    '# DEVLOG.md Rules',
    '# Testing Requirements',
  ].forEach((section) => {
    assert.equal(content.includes(section), true);
  });
});

test('behavior: TaskTide agent workflow delegates implementation and tests to Codex', () => {
  const skillPath = path.join(repoRoot, '.claude', 'skills', 'tasktide-agent-workflow', 'SKILL.md');
  const referencePath = path.join(repoRoot, '.claude', 'skills', 'tasktide-agent-workflow', 'REFERENCE.md');

  assert.equal(fs.existsSync(skillPath), true);
  assert.equal(fs.existsSync(referencePath), true);

  const skill = fs.readFileSync(skillPath, 'utf8');
  const reference = fs.readFileSync(referencePath, 'utf8');

  assert.equal(skill.includes('Codex as the implementation/test owner'), true);
  assert.equal(skill.includes('Claude TDD handoff prompt'), true);
  assert.equal(skill.includes('Codex owns:'), true);
  assert.equal(skill.includes('openai/codex-plugin-cc'), true);
  assert.equal(skill.includes('/codex:rescue --background'), true);
  assert.equal(skill.includes('/codex:status'), true);
  assert.equal(skill.includes('/codex:result'), true);
  assert.equal(reference.includes('Codex owns all tests and implementation work'), true);
  assert.equal(reference.includes('Add or update tests first'), true);
  assert.equal(reference.includes('First failing test:'), true);
  assert.equal(reference.includes('/codex:review'), true);
  assert.equal(reference.includes('/codex:adversarial-review'), true);
});
