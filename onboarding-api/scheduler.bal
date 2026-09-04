import ballerina/log;
import ballerina/sql;
import ballerina/task;

// Overdue detection runs as an in-service periodic background job — never a
// separate component (component-contract: "never split ... scheduled work
// into its own component"). Each pass: find pending tasks whose due date has
// passed, flip them to overdue (guarded so a task is only ever transitioned
// once), and raise exactly the notifications the design calls for.
function scanForOverdueTasks() returns error? {
    stream<TaskRow, sql:Error?> rowStream = dbClient->query(`
        SELECT id, new_hire_id AS "newHireId", template_task_id AS "templateTaskId", title, department,
               due_date AS "dueDate", status, completed_at AS "completedAt", completed_by AS "completedBy"
        FROM tasks WHERE status = ${STATUS_PENDING} AND due_date < CURRENT_DATE::text
    `);
    TaskRow[] candidates = check from TaskRow row in rowStream select row;
    check rowStream.close();

    foreach TaskRow candidate in candidates {
        // The WHERE ... AND status = pending guard makes the transition
        // happen at most once per task, even if two scans overlap.
        sql:ExecutionResult result = check dbClient->execute(`
            UPDATE tasks SET status = ${STATUS_OVERDUE} WHERE id = ${candidate.id} AND status = ${STATUS_PENDING}
        `);
        int? affected = result.affectedRowCount;
        if affected is int && affected > 0 {
            string? ownerRole = staffRoleForDepartment(candidate.department);
            if ownerRole is string {
                check insertNotification(candidate.id, ownerRole, NOTIFICATION_REMINDER);
            }
            if candidate.department == DEPARTMENT_IT || candidate.department == DEPARTMENT_FACILITIES {
                check insertNotification(candidate.id, "HR Coordinator", NOTIFICATION_ESCALATION);
            }
        }
    }
    return;
}

class OverdueJob {
    *task:Job;

    public function execute() {
        error? result = scanForOverdueTasks();
        if result is error {
            log:printError("overdue scan failed", 'error = result);
        }
    }
}

final task:JobId overdueJobId = check task:scheduleJobRecurByFrequency(new OverdueJob(), overdueScanIntervalSeconds);
