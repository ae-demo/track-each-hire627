import ballerina/sql;

type TaskRow record {|
    string id;
    string newHireId;
    string templateTaskId;
    string title;
    string department;
    string dueDate;
    string status;
    string? completedAt;
    string? completedBy;
|};

function taskRowToRecord(TaskRow row) returns Task {
    return {
        id: row.id,
        newHireId: row.newHireId,
        templateTaskId: row.templateTaskId,
        title: row.title,
        department: row.department,
        dueDate: row.dueDate,
        status: row.status,
        completedAt: row.completedAt,
        completedBy: row.completedBy
    };
}

// Generates one Task per current TemplateTask, copying title/department and
// computing dueDate = startDate + dueOffsetDays at generation time. Only
// templateTaskId is kept for provenance, so a later template edit never
// alters an already-generated task.
function generateTasksForNewHire(string newHireId, string startDate) returns error? {
    TemplateTaskRow[] templates = check listTemplateTaskRows();
    foreach TemplateTaskRow t in templates {
        string dueDate = check addDaysToDate(startDate, t.dueOffsetDays);
        string taskId = newId();
        _ = check dbClient->execute(`
            INSERT INTO tasks (id, new_hire_id, template_task_id, title, department, due_date, status)
            VALUES (${taskId}, ${newHireId}, ${t.id}, ${t.title}, ${t.department}, ${dueDate}, ${STATUS_PENDING})
        `);
    }
    return;
}

function getTaskById(string id) returns Task?|error {
    TaskRow|sql:Error row = dbClient->queryRow(`
        SELECT id, new_hire_id AS "newHireId", template_task_id AS "templateTaskId", title, department,
               due_date AS "dueDate", status, completed_at AS "completedAt", completed_by AS "completedBy"
        FROM tasks WHERE id = ${id}
    `);
    if row is sql:NoRowsError {
        return ();
    }
    if row is sql:Error {
        return row;
    }
    return taskRowToRecord(row);
}

function listTasksPage(string? department, string? status, int 'limit, int offset) returns TaskPage|error {
    sql:ParameterizedQuery filter = ` WHERE 1=1`;
    if department is string {
        filter = sql:queryConcat(filter, ` AND department = ${department}`);
    }
    if status is string {
        filter = sql:queryConcat(filter, ` AND status = ${status}`);
    }

    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT COUNT(*) AS "total" FROM tasks`, filter);
    record {| int total; |} countRow = check dbClient->queryRow(countQuery);

    sql:ParameterizedQuery selectQuery = sql:queryConcat(
        `SELECT id, new_hire_id AS "newHireId", template_task_id AS "templateTaskId", title, department,
                due_date AS "dueDate", status, completed_at AS "completedAt", completed_by AS "completedBy"
         FROM tasks`,
        filter,
        ` ORDER BY due_date ASC LIMIT ${'limit} OFFSET ${offset}`
    );
    stream<TaskRow, sql:Error?> rowStream = dbClient->query(selectQuery);
    TaskRow[] rows = check from TaskRow row in rowStream select row;
    check rowStream.close();

    Task[] tasks = [];
    foreach TaskRow row in rows {
        tasks.push(taskRowToRecord(row));
    }

    map<string> extra = {};
    if department is string {
        extra["department"] = department;
    }
    if status is string {
        extra["status"] = status;
    }
    [string?, string?] [next, previous] = pageLinks("/tasks", extra, 'limit, offset, countRow.total);
    return {count: countRow.total, next: next, previous: previous, data: tasks};
}

// /new-hires/{id}/tasks — no limit/offset in the contract, so the whole
// (optionally department-filtered) checklist is returned in one page.
function listNewHireTasks(string newHireId, string? department) returns TaskPage|error {
    sql:ParameterizedQuery filter = ` WHERE new_hire_id = ${newHireId}`;
    if department is string {
        filter = sql:queryConcat(filter, ` AND department = ${department}`);
    }
    sql:ParameterizedQuery selectQuery = sql:queryConcat(
        `SELECT id, new_hire_id AS "newHireId", template_task_id AS "templateTaskId", title, department,
                due_date AS "dueDate", status, completed_at AS "completedAt", completed_by AS "completedBy"
         FROM tasks`,
        filter,
        ` ORDER BY due_date ASC`
    );
    stream<TaskRow, sql:Error?> rowStream = dbClient->query(selectQuery);
    TaskRow[] rows = check from TaskRow row in rowStream select row;
    check rowStream.close();

    Task[] tasks = [];
    foreach TaskRow row in rows {
        tasks.push(taskRowToRecord(row));
    }
    return {count: tasks.length(), next: (), previous: (), data: tasks};
}

function completeTaskRow(string id, string completedBy) returns Task?|error {
    string completedAt = nowTimestamp();
    sql:ExecutionResult result = check dbClient->execute(`
        UPDATE tasks SET status = ${STATUS_COMPLETED}, completed_at = ${completedAt}, completed_by = ${completedBy}
        WHERE id = ${id}
    `);
    int? affected = result.affectedRowCount;
    if affected is () || affected == 0 {
        return ();
    }
    return getTaskById(id);
}
