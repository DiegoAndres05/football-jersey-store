# Workflow

1. Cursor understands the request and project context.
2. Cursor uses SpecKit when the change is substantial.
3. Cursor defines acceptance criteria and creates one or more task files under `.ai/tasks/`.
4. OpenCode executes with the appropriate worker.
5. OpenCode writes the task result under `.ai/tasks/`.
6. Cursor reviews the diff, validation, and risks.
7. Cursor approves, requests correction, or makes an architectural decision.
