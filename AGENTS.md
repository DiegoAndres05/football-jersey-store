# AI Team — OpenCode Bridge

This project uses a two-layer AI workflow:

- **Cursor** is the Tech Lead / main brain. It owns requirements, architecture, planning, delegation, and final review.
- **SpecKit** is the structured specification/planning layer used by Cursor for substantial work.
- **OpenCode Desktop** is the execution environment for delegated workers.
- **`.ai/`** contains project context, architecture, conventions, workflows, and task handoffs.
- **`.opencode/`** contains OpenCode-specific worker agents and commands.

## Rules

1. Read `AGENTS.md` and relevant `.ai/` context before making changes.
2. When a task exists under `.ai/tasks/`, execute the concrete acceptance criteria from that task.
3. Do not invent a competing architecture when Cursor has already decided one.
4. Avoid unrelated refactors.
5. Run the requested validation commands when practical.
6. Finish with a concise report: status, files changed, tests/checks, failures, and remaining risks.

## Desktop commands

- `/ai-task TASK-001` — implement a task delegated by Cursor.
- `/ai-review TASK-001` — review the task and current changes.
- `/ai-test TASK-001` — validate the task.
- `/ai-debug TASK-001` — investigate/fix the task as a debugging assignment.

Cursor remains the final decision-maker after OpenCode finishes.
