import ballerina/sql;

type NewHireRow record {|
    string id;
    string name;
    string email;
    string startDate;
|};

function newHireRowToRecord(NewHireRow row, string status) returns NewHire {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        startDate: row.startDate,
        status: status
    };
}

// A new hire's status is derived, never stored: "completed" once every
// generated task is completed, "in-progress" otherwise (including a hire
// with no tasks yet).
function computeNewHireStatus(string newHireId) returns string|error {
    record {| int total; int completedCount; |} counts = check dbClient->queryRow(`
        SELECT COUNT(*) AS "total", COUNT(*) FILTER (WHERE status = 'completed') AS "completedCount"
        FROM tasks WHERE new_hire_id = ${newHireId}
    `);
    if counts.total > 0 && counts.total == counts.completedCount {
        return "completed";
    }
    return "in-progress";
}

function insertNewHire(NewHireInput input) returns NewHire|error {
    string id = newId();
    _ = check dbClient->execute(`
        INSERT INTO new_hires (id, name, email, start_date)
        VALUES (${id}, ${input.name}, ${input.email}, ${input.startDate})
    `);
    return {id: id, name: input.name, email: input.email, startDate: input.startDate, status: "in-progress"};
}

function getNewHireById(string id) returns NewHire?|error {
    NewHireRow|sql:Error row = dbClient->queryRow(`
        SELECT id, name, email, start_date AS "startDate" FROM new_hires WHERE id = ${id}
    `);
    if row is sql:NoRowsError {
        return ();
    }
    if row is sql:Error {
        return row;
    }
    string status = check computeNewHireStatus(row.id);
    return newHireRowToRecord(row, status);
}

function listNewHiresPage(int 'limit, int offset) returns NewHirePage|error {
    record {| int total; |} countRow = check dbClient->queryRow(`SELECT COUNT(*) AS "total" FROM new_hires`);
    stream<NewHireRow, sql:Error?> rowStream = dbClient->query(`
        SELECT id, name, email, start_date AS "startDate" FROM new_hires
        ORDER BY start_date ASC LIMIT ${'limit} OFFSET ${offset}
    `);
    NewHireRow[] rows = check from NewHireRow row in rowStream select row;
    check rowStream.close();

    NewHire[] hires = [];
    foreach NewHireRow row in rows {
        string status = check computeNewHireStatus(row.id);
        hires.push(newHireRowToRecord(row, status));
    }
    [string?, string?] [next, previous] = pageLinks("/new-hires", {}, 'limit, offset, countRow.total);
    return {count: countRow.total, next: next, previous: previous, data: hires};
}

// New Hire role scoping: the caller's own record only, matched by their
// X-User-Name against the local-part of a new hire's email (case-
// insensitive). Documented assumption — see the onboarding-api issue report.
function findOwnNewHire(string? callerUserName) returns NewHire?|error {
    if callerUserName is () {
        return ();
    }
    string trimmed = callerUserName.trim();
    if trimmed == "" {
        return ();
    }
    string localPart = trimmed;
    int? atIdx = trimmed.indexOf("@");
    if atIdx is int {
        localPart = trimmed.substring(0, atIdx);
    }
    NewHireRow|sql:Error row = dbClient->queryRow(`
        SELECT id, name, email, start_date AS "startDate" FROM new_hires
        WHERE lower(split_part(email, '@', 1)) = lower(${localPart})
    `);
    if row is sql:NoRowsError {
        return ();
    }
    if row is sql:Error {
        return row;
    }
    string status = check computeNewHireStatus(row.id);
    return newHireRowToRecord(row, status);
}
