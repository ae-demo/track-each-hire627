import ballerina/sql;

type TemplateTaskRow record {|
    string id;
    string title;
    string department;
    int dueOffsetDays;
|};

function templateTaskRowToRecord(TemplateTaskRow row) returns TemplateTask {
    return {
        id: row.id,
        title: row.title,
        department: row.department,
        dueOffsetDays: row.dueOffsetDays
    };
}

// Materializes the whole template — used both to serve GET /template-tasks
// and to generate a new hire's checklist. Editing the template later never
// touches a task already generated from it: generated tasks copy their
// title/department/dueDate at creation time and keep templateTaskId only for
// provenance.
function listTemplateTaskRows() returns TemplateTaskRow[]|error {
    stream<TemplateTaskRow, sql:Error?> rowStream = dbClient->query(`
        SELECT id, title, department, due_offset_days AS "dueOffsetDays"
        FROM template_tasks ORDER BY department, title
    `);
    TemplateTaskRow[] rows = check from TemplateTaskRow row in rowStream select row;
    check rowStream.close();
    return rows;
}

function listTemplateTasks() returns TemplateTask[]|error {
    TemplateTaskRow[] rows = check listTemplateTaskRows();
    TemplateTask[] templateTasks = [];
    foreach TemplateTaskRow row in rows {
        templateTasks.push(templateTaskRowToRecord(row));
    }
    return templateTasks;
}

function createTemplateTask(TemplateTaskInput input) returns TemplateTask|error {
    string id = newId();
    _ = check dbClient->execute(`
        INSERT INTO template_tasks (id, title, department, due_offset_days)
        VALUES (${id}, ${input.title}, ${input.department}, ${input.dueOffsetDays})
    `);
    return {
        id: id,
        title: input.title,
        department: input.department,
        dueOffsetDays: input.dueOffsetDays
    };
}

function updateTemplateTask(string id, TemplateTaskInput input) returns TemplateTask?|error {
    sql:ExecutionResult result = check dbClient->execute(`
        UPDATE template_tasks SET title = ${input.title}, department = ${input.department},
               due_offset_days = ${input.dueOffsetDays}
        WHERE id = ${id}
    `);
    int? affected = result.affectedRowCount;
    if affected is () || affected == 0 {
        return ();
    }
    return {id: id, title: input.title, department: input.department, dueOffsetDays: input.dueOffsetDays};
}

function deleteTemplateTask(string id) returns boolean|error {
    sql:ExecutionResult result = check dbClient->execute(`DELETE FROM template_tasks WHERE id = ${id}`);
    int? affected = result.affectedRowCount;
    return affected is int && affected > 0;
}
