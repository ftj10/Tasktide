# AGENTS.md

This file provides repository instructions for Codex agents working in this project.

---

# Project Overview

TaskTide is a task planning and scheduling web application focused on weekly organization, reminders, onboarding guidance, mobile usability, and progressive web app support.

Primary goals:

* Fast task management
* Beginner-friendly experience
* Mobile-first usability
* Reliable cross-device synchronization
* Clear onboarding and help guidance
* Stable offline-capable behavior

---

# Core Development Rules

## Code Comments

Do not add explanation comments.

Do not include meta comments such as:

* "here is the update"
* "updated logic"
* "new implementation"
* "temporary fix"

Only include feature comments using the exact format:

```text
INPUT:
OUTPUT:
EFFECT:
```

No other comment style is allowed unless absolutely required for framework syntax or legal headers.

---

# Versioning Rules

For every modification, including:

* bug fixes
* refactors
* optimizations
* UI changes
* documentation changes
* features

increment the project version automatically.

Version policy:

* Patch version for bug fixes and non-user-facing adjustments
* Minor version for new features or workflow improvements

Examples:

* 1.18.1 → 1.18.2 for bug fix
* 1.18.2 → 1.19.0 for feature

---

# Required Update Areas

Every modification must update ALL required areas.

---

# RELEASENOTES.md

## Style

Client-facing user story style.

Write like a product update notification.

Focus on:

* what users can now do
* workflow improvements
* user experience improvements
* usability benefits

Avoid:

* implementation details
* internal architecture
* technical jargon
* filenames
* code explanations

---

## Required Format

```text
Title: Version {version} – Update Released ({date})

What’s New

Added: {user-facing feature explanation}
Added: {user-facing feature explanation}

Improvements

Improved: {user-facing improvement explanation}

Fixes

Fixed: {user-facing bug fix explanation}
```

---

## Release Note Requirements

* Use concise bullet points
* Keep wording simple and direct
* Focus on user benefits
* Write in a professional product announcement tone
* Avoid developer terminology

---

# Help Center Requirements

The Help Center must ALWAYS maintain these three sections.

---

# 1. How To Use This Website

## Purpose

This is the guided introduction to the product.

It explains the full workflow from start to finish.

This section MUST BE CONTINUOUSLY IMPROVED whenever workflows or UX change.

---

## Goals

Help users understand:

* what the product is for
* how to start using it
* how daily usage works
* how to organize tasks effectively
* how to complete planning workflows

---

## Writing Style

Use:

* beginner-friendly wording
* simple explanations
* real-world usage scenarios
* logical progression of actions

Avoid:

* fragmented feature-by-feature explanations
* technical wording
* long paragraphs
* implementation details

---

## Recommended Structure

Example flow:

```text
1. Create tasks
2. Organize tasks by day or week
3. Track progress
4. Complete finished tasks
5. Review upcoming work
```

Example scenario:

```text
If you want to plan your school week:
1. Add assignments and classes
2. Open Week View
3. Arrange tasks across days
4. Track completed work throughout the week
```

This section should feel like a guided onboarding experience.

---

# 2. Quick Walkthroughs

## Purpose

Short, focused, interactive guidance for individual features.

Designed for workflows that are difficult to explain using text alone.

---

## Use Cases

Examples:

* drag and drop interactions
* mobile gestures
* onboarding flows
* swipe actions
* calendar movement
* notification setup
* task editing flows

---

## Allowed Guidance Methods

Use:

* step-by-step actions
* highlights
* popups
* animations
* GIF demonstrations
* guided overlays
* interactive onboarding tooltips

---

## Walkthrough Requirements

Each walkthrough should contain:

```text
Feature Name

What it does:
{simple explanation}

How to use:
1. Step
2. Step
3. Step
```

---

## Walkthrough Rules

* Keep concise
* Keep action-oriented
* Prefer interaction over long explanations
* Optimize for mobile usability
* Explain gestures clearly
* Use practical examples

---

# 3. Common Q&A

## Purpose

On-demand clarification and troubleshooting.

Organized as clickable questions.

Each question reveals a clear, direct answer.

---

## Focus Areas

Questions should focus on:

* confusion points
* edge cases
* troubleshooting
* behavioral explanations
* workflow clarification

Examples:

* Why does this happen?
* How do I fix this?
* Why can’t I see my tasks?
* How do notifications work?
* Why is offline mode different?

---

## Required Format

```text
Question: {user question}

Answer:
{clear and direct explanation}
```

---

## Q&A Rules

* Keep answers concise
* Avoid technical jargon
* Prefer practical solutions
* Reuse walkthrough explanations when helpful

---

# README.md Rules

README.md is the public developer overview.

---

## Must Include

* project overview
* high-level feature summaries
* setup instructions
* environment configuration
* deployment overview
* architecture notes
* development commands
* testing commands

---

## Must NOT Include

* detailed change history
* debugging notes
* temporary implementation details
* internal TODO tracking
* contributor-only notes

---

# DEVLOG.md Rules

DEVLOG.md is the internal maintainer development log.

---

## Must Include

* exact technical changes
* implementation details
* file-level modifications
* architectural reasoning
* design trade-offs
* debugging observations
* known limitations
* migration considerations

---

## Purpose

This file is intended for:

* maintainers
* contributors
* future debugging
* architecture tracking

NOT for end users.

---

# Testing Requirements

Every modification must include updated tests.

---

## Required Test Coverage

Add or update:

* unit tests
* integration tests
* regression tests

when behavior changes.

Coverage must reflect:

* new behavior
* edge cases
* bug fixes
* UI logic changes
* API behavior changes

---

## Required Validation

Before completion:

```bash
npm test
npm --prefix frontend run build
```

Ensure:

* tests pass
* production build succeeds
* no TypeScript errors
* no broken lint-critical behavior

---

# Architecture Constraints

## Authentication

* Cross-site hosted environments must support cookie authentication correctly
* Preserve credentials: "include" behavior
* Do not break mobile Safari authentication behavior

---

## Notifications

* Prefer service-worker-based Web Push
* Avoid tab-only notification scheduling
* Preserve existing fallback behavior

---

## Offline Support

* Offline workflows must remain functional
* Avoid introducing blank-screen offline failures
* Preserve local persistence behavior

---

## Mobile UX

Mobile experience is critical.

Changes must:

* support touch interaction
* avoid hover-only workflows
* maintain responsive layouts
* preserve onboarding usability on small screens

---

## Backups

* Never commit backup datasets
* Preserve gitignored backup directories
* Avoid storing sensitive production data in repository backups

---

# Workflow Expectations

Preferred engineering workflow:

1. Create issue
2. Define behavior
3. Add or update tests
4. Implement feature
5. Verify production build
6. Update required documentation
7. Update release notes

---

# Recommended Agent Behavior

For complex changes:

* analyze existing architecture first
* avoid unnecessary rewrites
* preserve backward compatibility
* minimize regression risk
* prefer incremental improvements

When debugging:

* identify root cause before editing
* avoid speculative fixes
* preserve existing stable behavior

---

# Domain Language

## Task

A scheduled actionable item.

---

## Reminder

A notification associated with a task.

---

## Onboarding

First-time guided learning experience.

---

## Walkthrough

Interactive feature tutorial.

---

## Wizard Session

Temporary multi-step import or setup state.

---

# Update Announcement Format

Generate update announcements using:

```text
Version: {version}
Update Date: {date}
```

Announcements must:

* match release note tone
* remain concise
* be user-facing
* avoid implementation details

---

# Final Output Rules

All outputs must be:

* clear
* deterministic
* structured
* consistent
* executable by Codex without ambiguity

Avoid vague instructions.

Prefer explicit operational rules whenever possible.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
