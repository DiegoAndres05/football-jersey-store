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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
