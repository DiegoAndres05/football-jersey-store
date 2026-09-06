# OpenCode Desktop integration

This directory is the project-local bridge for OpenCode Desktop.

## Agents

`.opencode/agents/` contains the AI Team worker profiles:
- developer
- tester
- debugger
- reviewer

## Commands

`.opencode/commands/` contains:
- `/ai-task TASK-001`
- `/ai-review TASK-001`
- `/ai-test TASK-001`
- `/ai-debug TASK-001`

Open the project in OpenCode Desktop and use these commands after Cursor creates a task in `.ai/tasks/`.

The command files are intentionally project-local so each repository can keep its own workflow and context.
