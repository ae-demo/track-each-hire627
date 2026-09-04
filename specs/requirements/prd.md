# Track Each Hire — PRD

## Problem Statement

When a new employee joins, their onboarding work is split across IT (equipment,
accounts), HR (paperwork, orientation) and Facilities (desk, badge, parking).
Today these tasks are tracked in disconnected checklists, emails and
spreadsheets, so nobody has a single view of what is done, what is late, and
who owns what is left. Overdue items — a laptop never ordered, a badge never
issued — surface only when the new hire notices something missing on day one.

## Solution

A shared onboarding tracker: for every new hire, the system generates a
standard checklist of tasks split across IT, HR and Facilities. Each
department's staff sees and completes only their own tasks; an HR Coordinator
sees progress across all three departments for every new hire and is
escalated to when tasks run overdue. The new hire gets a simple read-only view
of their own checklist. Reminders fire automatically when a task passes its
due date without being completed.

## Actors

- **HR Coordinator** — adds new hires, triggers their standard onboarding
checklist, completes HR-specific tasks, and monitors cross-department
progress and overdue items for every new hire.
- **IT Staff** — sees and completes the IT onboarding tasks assigned for each
new hire.
- **Facilities Staff** — sees and completes the Facilities onboarding tasks
assigned for each new hire.
- **New Hire** — views their own onboarding checklist and its status; cannot
mark tasks complete themselves.

## User Stories

1. As an HR Coordinator, I want to add a new hire and have their standard
 onboarding checklist automatically generated across IT, HR and Facilities,
 so that nothing is missed.
2. As an IT Staff member, I want to see only the IT onboarding tasks assigned
 for each new hire, so that I know what needs doing without wading through
 other departments' work.
3. As a Facilities Staff member, I want to see only the Facilities onboarding
 tasks assigned for each new hire.
4. As an HR Coordinator, I want to see and complete the HR-specific onboarding
 tasks for each new hire.
5. As an IT Staff member, I want to mark my assigned tasks complete, so that
 my progress is visible to the HR Coordinator.
6. As a Facilities Staff member, I want to mark my assigned tasks complete, so
 that my progress is visible to the HR Coordinator.
7. As an HR Coordinator, I want to view overall onboarding progress for each
 new hire across all three departments, so that I can see at a glance what
 is outstanding.
8. As an IT Staff member, I want to be reminded when a task assigned to me
 becomes overdue, so that it does not fall through the cracks.
9. As a Facilities Staff member, I want to be reminded when a task assigned to
 me becomes overdue.
10. As an HR Coordinator, I want to be reminded when my own HR tasks become
 overdue, and escalated to when any IT or Facilities task for a new hire
 runs overdue, so that I can follow up.
11. As a New Hire, I want to view my own onboarding checklist and see which
 items are done, in progress, or overdue, so that I know what to expect.

## Product Decisions

- Staff sign in via SSO through Thunder, the platform identity provider (org
default).
- Onboarding responsibilities are split by department: IT Staff, Facilities
Staff and the HR Coordinator each own and complete only their own tasks for
a given new hire.
- Every new hire receives the same standard checklist template — task content
is not customized per role or department at this time.
- New hires have read-only visibility into their own checklist; they cannot
create, edit or complete tasks. *assumed*
- Reminders for overdue tasks are sent by email to the assigned staff member;
the HR Coordinator additionally receives escalation emails for any overdue
IT or Facilities task. *assumed*
- Each checklist task carries a due date, set as a fixed number of days
relative to the new hire's start date (defined once per template task); a
task is "overdue" once its due date passes without being marked complete.
*assumed*

## Out of Scope

- Customized or role-specific checklist templates (one standard template only,
for now).
- Direct integration with actual IT provisioning, HR/HRIS, or facilities/badge
systems — this product tracks task status, it does not perform the
underlying work.
- New-hire task completion or self-service task management.
- Multi-language support.

## Open Questions

1. What specific tasks belong on the standard onboarding checklist for each of
 IT, HR and Facilities, and what is each task's due-date offset from the
 start date?

## Further Notes

None.