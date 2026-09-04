# Complete a task, and get reminded when overdue

IT/Facilities staff and the HR Coordinator work their own department's tasks;
the system reminds the owning staff member when a task passes its due date,
and escalates to the HR Coordinator when it is an IT or Facilities task.

```mermaid
sequenceDiagram
    actor ITStaff as IT Staff
    actor HRCoordinator as HR Coordinator
    participant onboarding-webapp
    participant onboarding-api

    ITStaff->>onboarding-webapp: view my IT tasks
    onboarding-webapp->>onboarding-api: list tasks (department=IT)
    onboarding-api-->>onboarding-webapp: task list
    ITStaff->>onboarding-webapp: mark task complete
    onboarding-webapp->>onboarding-api: complete task
    onboarding-api-->>onboarding-webapp: task completed

    onboarding-api->>onboarding-api: check for overdue tasks
    alt task overdue
        onboarding-api->>onboarding-api: raise reminder notification
        onboarding-api->>onboarding-api: raise HR escalation notification
        onboarding-webapp->>onboarding-api: fetch notifications
        onboarding-api-->>onboarding-webapp: reminder
        onboarding-webapp-->>ITStaff: overdue reminder
        onboarding-webapp-->>HRCoordinator: escalation notice
    end
```

