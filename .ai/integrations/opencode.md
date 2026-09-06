# OpenCode Integration

OpenCode is the execution engine for tasks authored by Cursor.

Input: `.ai/tasks/TASK-XXX.md`
Output: `.ai/tasks/TASK-XXX.result.md`

Recommended worker selection:
- feature/refactor implementation → developer
- test creation/verification → tester
- failing behavior/root-cause investigation → debugger
- final implementation quality check → reviewer

Workers must stop and escalate when a task requires an architectural decision outside its scope.
