import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// Single client, initialized once at module load per the component contract.
final postgresql:Client dbClient = check new (
    host = dbHost,
    username = dbUser,
    password = dbPassword,
    database = dbName,
    port = dbPort
);

// Schema is created idempotently at startup so the service needs no
// out-of-band migration step. Dates and timestamps are stored as ISO-8601
// TEXT (YYYY-MM-DD / RFC3339) rather than native DATE/TIMESTAMPTZ: lexical
// ordering on an ISO string matches chronological ordering, which keeps every
// comparison a plain string comparison and every bound value a plain string.
final () dbSchemaReady = check initSchema();

function initSchema() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS template_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            due_offset_days INT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS new_hires (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            start_date TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            new_hire_id TEXT NOT NULL,
            template_task_id TEXT NOT NULL,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            completed_at TEXT,
            completed_by TEXT
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            recipient_role TEXT NOT NULL,
            notification_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT false
        )
    `);
    return;
}
