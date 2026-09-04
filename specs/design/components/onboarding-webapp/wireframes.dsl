screen Dashboard "HR Coordinator's view of every new hire's onboarding progress"
  sidebar "Onboarding Tracker | Dashboard -> Dashboard | Template -> Template"
  row
    heading "New Hires"
    right
    button "Add New Hire" primary -> AddNewHire
  table "Name | Start Date | Status | Overdue Tasks" -> NewHireDetail
    row "Priya Shah | 2026-09-08 | In Progress | 1"
    row "Sam Ortiz | 2026-09-15 | Completed | 0"

screen AddNewHire "HR Coordinator adds a new hire and generates their checklist"
  sidebar "Onboarding Tracker | Dashboard -> Dashboard | Template -> Template"
  heading "Add New Hire"
  input "Full name"
  input "Email"
  input "Start date"
  row
    right
    button "Cancel" -> Dashboard
    button "Create Checklist" primary -> Dashboard

screen NewHireDetail "Cross-department checklist status for one new hire"
  sidebar "Onboarding Tracker | Dashboard -> Dashboard | Template -> Template"
  heading "Priya Shah"
  text "Start date: 2026-09-08"
  card "IT Tasks"
    table "Task | Due Date | Status"
      row "Provision laptop | 2026-09-05 | Overdue"
      row "Create accounts | 2026-09-07 | Pending"
  card "HR Tasks"
    table "Task | Due Date | Status"
      row "Collect paperwork | 2026-09-06 | Completed"
  card "Facilities Tasks"
    table "Task | Due Date | Status"
      row "Assign desk | 2026-09-08 | Pending"

screen Template "HR Coordinator maintains the standard checklist template"
  sidebar "Onboarding Tracker | Dashboard -> Dashboard | Template -> Template"
  row
    heading "Standard Checklist Template"
    right
    button "Add Task" primary -> AddTemplateTask
  table "Task | Department | Due Offset (days)"
    row "Provision laptop | IT | -3"
    row "Create accounts | IT | -1"
    row "Collect paperwork | HR | -2"
    row "Assign desk | Facilities | 0"

screen AddTemplateTask "Add or edit a standard checklist template task"
  sidebar "Onboarding Tracker | Dashboard -> Dashboard | Template -> Template"
  heading "Add Template Task"
  input "Task title"
  select "Department (IT, HR, Facilities)"
  input "Due offset (days from start date)"
  row
    right
    button "Cancel" -> Template
    button "Save Task" primary -> Template

screen MyTasks "Department staff work their own onboarding task queue"
  navbar "Onboarding Tracker | My Tasks -> MyTasks"
  heading "My Department Tasks"
  table "New Hire | Task | Due Date | Status"
    row "Priya Shah | Provision laptop | 2026-09-05 | Overdue"
    row "Priya Shah | Create accounts | 2026-09-07 | Pending"
    row "Sam Ortiz | Provision laptop | 2026-09-12 | Completed"
  row
    right
    // completes the task in place, no navigation
    button "Mark Selected Complete" primary

screen MyChecklist "A new hire's read-only view of their own onboarding checklist"
  navbar "Onboarding Tracker | My Checklist -> MyChecklist"
  heading "My Onboarding Checklist"
  card "IT"
    table "Task | Status"
      row "Provision laptop | Overdue"
      row "Create accounts | Pending"
  card "HR"
    table "Task | Status"
      row "Collect paperwork | Completed"
  card "Facilities"
    table "Task | Status"
      row "Assign desk | Pending"

flow "Onboard a new hire"
  role "HR Coordinator"
  description "Add a new hire, generate their checklist, and check its cross-department status"
  Dashboard
  AddNewHire
  NewHireDetail

flow "Maintain checklist template"
  role "HR Coordinator"
  description "Keep the standard checklist's tasks and due-date offsets current"
  Dashboard
  Template
  AddTemplateTask

flow "IT task queue"
  role "IT Staff"
  description "See and complete IT onboarding tasks across all new hires, and spot overdue ones"
  MyTasks

flow "Facilities task queue"
  role "Facilities Staff"
  description "See and complete Facilities onboarding tasks across all new hires, and spot overdue ones"
  MyTasks

flow "My checklist"
  role "New Hire"
  description "Check my own onboarding checklist and see what is done or overdue"
  MyChecklist
