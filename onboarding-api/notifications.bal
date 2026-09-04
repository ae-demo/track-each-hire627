import ballerina/sql;

type NotificationRow record {|
    string id;
    string taskId;
    string recipientRole;
    string notificationType;
    string createdAt;
    boolean isRead;
|};

function notificationRowToRecord(NotificationRow row) returns Notification {
    return {
        id: row.id,
        taskId: row.taskId,
        recipientRole: row.recipientRole,
        'type: row.notificationType,
        createdAt: row.createdAt,
        'read: row.isRead
    };
}

function insertNotification(string taskId, string recipientRole, string notificationType) returns error? {
    string id = newId();
    string createdAt = nowTimestamp();
    _ = check dbClient->execute(`
        INSERT INTO notifications (id, task_id, recipient_role, notification_type, created_at, is_read)
        VALUES (${id}, ${taskId}, ${recipientRole}, ${notificationType}, ${createdAt}, false)
    `);
    return;
}

// Department -> the staff role owning that department's tasks, and thus the
// recipientRole of the "reminder" notification raised when one of its tasks
// goes overdue.
function staffRoleForDepartment(string department) returns string? {
    if department == DEPARTMENT_IT {
        return "IT Staff";
    }
    if department == DEPARTMENT_FACILITIES {
        return "Facilities Staff";
    }
    if department == DEPARTMENT_HR {
        return "HR Coordinator";
    }
    return ();
}

function listNotificationsForRole(string role, int 'limit, int offset) returns NotificationPage|error {
    record {| int total; |} countRow = check dbClient->queryRow(`
        SELECT COUNT(*) AS "total" FROM notifications WHERE recipient_role = ${role}
    `);
    stream<NotificationRow, sql:Error?> rowStream = dbClient->query(`
        SELECT id, task_id AS "taskId", recipient_role AS "recipientRole",
               notification_type AS "notificationType", created_at AS "createdAt", is_read AS "isRead"
        FROM notifications WHERE recipient_role = ${role}
        ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    NotificationRow[] rows = check from NotificationRow row in rowStream select row;
    check rowStream.close();

    Notification[] notifications = [];
    foreach NotificationRow row in rows {
        notifications.push(notificationRowToRecord(row));
    }
    [string?, string?] [next, previous] = pageLinks("/notifications", {}, 'limit, offset, countRow.total);
    return {count: countRow.total, next: next, previous: previous, data: notifications};
}

function markNotificationRead(string id) returns Notification?|error {
    sql:ExecutionResult result = check dbClient->execute(`
        UPDATE notifications SET is_read = true WHERE id = ${id}
    `);
    int? affected = result.affectedRowCount;
    if affected is () || affected == 0 {
        return ();
    }
    NotificationRow|sql:Error row = dbClient->queryRow(`
        SELECT id, task_id AS "taskId", recipient_role AS "recipientRole",
               notification_type AS "notificationType", created_at AS "createdAt", is_read AS "isRead"
        FROM notifications WHERE id = ${id}
    `);
    if row is sql:Error {
        return row;
    }
    return notificationRowToRecord(row);
}
