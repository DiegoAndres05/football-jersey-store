# Cursor Integration — Main Brain

Cursor is the Tech Lead and final decision-maker.

## Operating loop
UNDERSTAND → THINK → PLAN → DELEGATE → REVIEW

### 1. Understand
Read `.ai/constitution.md`, project context, architecture, conventions, and relevant code.

### 2. Think
For substantial work, use SpecKit to turn requirements into specification, plan, and acceptance criteria.

### 3. Plan
Break the approved plan into small, independently verifiable tasks. Use `.ai/templates/task.md`.

### 4. Delegate
Create a task under `.ai/tasks/` and give it to the appropriate OpenCode worker. Do not delegate architectural decisions that have not been resolved.

### 5. Review
Inspect the diff and `.ai/tasks/<TASK_ID>.result.md`. Run or verify validation. If incomplete, issue a correction task. Cursor makes the final completion decision.

## Cost rule
Do not spend Cursor context doing repetitive implementation when OpenCode can execute a clearly specified task.
