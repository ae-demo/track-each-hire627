import ballerina/http;
import ballerina/log;

listener http:Listener onboardingListener = new (9090);

service / on onboardingListener {

    // ---- new hires ----------------------------------------------------

    resource function get new\-hires(@http:Header string? x\-user\-id, @http:Header string? x\-user\-groups,
            @http:Header string? x\-user\-name, int 'limit = 20, int offset = 0)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }

        if caller.role == "New Hire" {
            // Spec gap resolution: New Hire has no /me endpoint, so "own
            // checklist" is served by scoping this list to the row whose
            // email local-part matches X-User-Name. No match => empty page,
            // not an error.
            NewHire?|error ownResult = findOwnNewHire(caller.userName);
            if ownResult is error {
                log:printError("findOwnNewHire failed", 'error = ownResult);
                return internalErrorResponse();
            }
            NewHire? own = ownResult;
            if own is () {
                return <http:Ok>{body: {count: 0, next: (), previous: (), data: []}};
            }
            return <http:Ok>{body: {count: 1, next: (), previous: (), data: [own]}};
        }

        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }

        int pageLimit = clampLimit('limit);
        NewHirePage|error pageResult = listNewHiresPage(pageLimit, offset);
        if pageResult is error {
            log:printError("listNewHiresPage failed", 'error = pageResult);
            return internalErrorResponse();
        }
        return <http:Ok>{body: pageResult};
    }

    resource function post new\-hires(@http:Header string? x\-user\-id, @http:Header string? x\-user\-groups,
            @http:Header string? x\-user\-name, NewHireInput payload)
            returns http:Created|http:BadRequest|http:Unauthorized|http:Forbidden|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }
        if payload.name.trim() == "" || payload.email.trim() == "" || !payload.email.includes("@") {
            return badRequestResponse("name and a valid email are required");
        }
        if !isValidDateString(payload.startDate) {
            return badRequestResponse("startDate must be a valid date");
        }

        NewHire|error created = insertNewHire(payload);
        if created is error {
            log:printError("insertNewHire failed", 'error = created);
            return internalErrorResponse();
        }
        error? genResult = generateTasksForNewHire(created.id, created.startDate);
        if genResult is error {
            log:printError("generateTasksForNewHire failed", 'error = genResult);
            return internalErrorResponse();
        }
        return <http:Created>{body: created};
    }

    resource function get new\-hires/[string newHireId](@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }

        if caller.role == "New Hire" {
            NewHire?|error ownResult = findOwnNewHire(caller.userName);
            if ownResult is error {
                log:printError("findOwnNewHire failed", 'error = ownResult);
                return internalErrorResponse();
            }
            NewHire? own = ownResult;
            if own is () || own.id != newHireId {
                return forbiddenResponse("not permitted");
            }
            return <http:Ok>{body: own};
        }

        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }

        NewHire?|error result = getNewHireById(newHireId);
        if result is error {
            log:printError("getNewHireById failed", 'error = result);
            return internalErrorResponse();
        }
        NewHire? hire = result;
        if hire is () {
            return notFoundResponse("no such new hire");
        }
        return <http:Ok>{body: hire};
    }

    resource function get new\-hires/[string newHireId]/tasks(@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name, string? department)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }

        if caller.role == "New Hire" {
            NewHire?|error ownResult = findOwnNewHire(caller.userName);
            if ownResult is error {
                log:printError("findOwnNewHire failed", 'error = ownResult);
                return internalErrorResponse();
            }
            NewHire? own = ownResult;
            if own is () || own.id != newHireId {
                return forbiddenResponse("not permitted");
            }
            TaskPage|error page = listNewHireTasks(newHireId, department);
            if page is error {
                log:printError("listNewHireTasks failed", 'error = page);
                return internalErrorResponse();
            }
            return <http:Ok>{body: page};
        }

        NewHire?|error hireResult = getNewHireById(newHireId);
        if hireResult is error {
            log:printError("getNewHireById failed", 'error = hireResult);
            return internalErrorResponse();
        }
        if hireResult is () {
            return notFoundResponse("no such new hire");
        }

        string? effectiveDepartment = department;
        if caller.role == "IT Staff" || caller.role == "Facilities Staff" {
            // Force-scoped to the caller's own department regardless of the
            // query param — never trust a client-supplied department filter.
            effectiveDepartment = ownDepartmentForRole(caller.role);
        } else if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }

        TaskPage|error page = listNewHireTasks(newHireId, effectiveDepartment);
        if page is error {
            log:printError("listNewHireTasks failed", 'error = page);
            return internalErrorResponse();
        }
        return <http:Ok>{body: page};
    }

    // ---- tasks ----------------------------------------------------------

    resource function get tasks(@http:Header string? x\-user\-id, @http:Header string? x\-user\-groups,
            @http:Header string? x\-user\-name, string? department, string? status, int 'limit = 20, int offset = 0)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role == "New Hire" {
            return forbiddenResponse("not permitted");
        }

        string? effectiveDepartment = department;
        if caller.role == "IT Staff" || caller.role == "Facilities Staff" {
            effectiveDepartment = ownDepartmentForRole(caller.role);
        }
        // HR Coordinator views all tasks — the given department filter, if any, passes through untouched.

        int pageLimit = clampLimit('limit);
        TaskPage|error page = listTasksPage(effectiveDepartment, status, pageLimit, offset);
        if page is error {
            log:printError("listTasksPage failed", 'error = page);
            return internalErrorResponse();
        }
        return <http:Ok>{body: page};
    }

    resource function get tasks/[string taskId](@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }

        Task?|error result = getTaskById(taskId);
        if result is error {
            log:printError("getTaskById failed", 'error = result);
            return internalErrorResponse();
        }
        Task? task = result;
        if task is () {
            return notFoundResponse("no such task");
        }

        if caller.role == "HR Coordinator" {
            return <http:Ok>{body: task};
        }
        if caller.role == "IT Staff" || caller.role == "Facilities Staff" {
            string? ownDept = ownDepartmentForRole(caller.role);
            if ownDept is string && task.department == ownDept {
                return <http:Ok>{body: task};
            }
            return forbiddenResponse("not permitted");
        }

        // New Hire — only a task on their own checklist.
        NewHire?|error ownResult = findOwnNewHire(caller.userName);
        if ownResult is error {
            log:printError("findOwnNewHire failed", 'error = ownResult);
            return internalErrorResponse();
        }
        NewHire? own = ownResult;
        if own is NewHire && own.id == task.newHireId {
            return <http:Ok>{body: task};
        }
        return forbiddenResponse("not permitted");
    }

    resource function post tasks/[string taskId]/complete(@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role == "New Hire" {
            return forbiddenResponse("not permitted");
        }

        Task?|error existingResult = getTaskById(taskId);
        if existingResult is error {
            log:printError("getTaskById failed", 'error = existingResult);
            return internalErrorResponse();
        }
        Task? existing = existingResult;
        if existing is () {
            return notFoundResponse("no such task");
        }

        string? ownDept = ownDepartmentForRole(caller.role);
        if ownDept is () || existing.department != ownDept {
            return forbiddenResponse("not permitted (wrong department)");
        }

        Task?|error updated = completeTaskRow(taskId, caller.userId);
        if updated is error {
            log:printError("completeTaskRow failed", 'error = updated);
            return internalErrorResponse();
        }
        Task? task = updated;
        if task is () {
            return notFoundResponse("no such task");
        }
        return <http:Ok>{body: task};
    }

    // ---- checklist template — HR Coordinator only, GET included --------

    resource function get template\-tasks(@http:Header string? x\-user\-id, @http:Header string? x\-user\-groups,
            @http:Header string? x\-user\-name)
            returns http:Ok|http:Unauthorized|http:Forbidden|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }
        TemplateTask[]|error result = listTemplateTasks();
        if result is error {
            log:printError("listTemplateTasks failed", 'error = result);
            return internalErrorResponse();
        }
        return <http:Ok>{body: result};
    }

    resource function post template\-tasks(@http:Header string? x\-user\-id, @http:Header string? x\-user\-groups,
            @http:Header string? x\-user\-name, TemplateTaskInput payload)
            returns http:Created|http:BadRequest|http:Unauthorized|http:Forbidden|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }
        if !isValidDepartment(payload.department) || payload.title.trim() == "" {
            return badRequestResponse("title and a valid department are required");
        }
        TemplateTask|error created = createTemplateTask(payload);
        if created is error {
            log:printError("createTemplateTask failed", 'error = created);
            return internalErrorResponse();
        }
        return <http:Created>{body: created};
    }

    resource function put template\-tasks/[string templateTaskId](@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name, TemplateTaskInput payload)
            returns http:Ok|http:BadRequest|http:Unauthorized|http:Forbidden|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }
        if !isValidDepartment(payload.department) || payload.title.trim() == "" {
            return badRequestResponse("title and a valid department are required");
        }
        TemplateTask?|error result = updateTemplateTask(templateTaskId, payload);
        if result is error {
            log:printError("updateTemplateTask failed", 'error = result);
            return internalErrorResponse();
        }
        TemplateTask? updated = result;
        if updated is () {
            return notFoundResponse("no such template task");
        }
        return <http:Ok>{body: updated};
    }

    resource function delete template\-tasks/[string templateTaskId](@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name)
            returns http:NoContent|http:Unauthorized|http:Forbidden|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role != "HR Coordinator" {
            return forbiddenResponse("not permitted");
        }
        boolean|error deleted = deleteTemplateTask(templateTaskId);
        if deleted is error {
            log:printError("deleteTemplateTask failed", 'error = deleted);
            return internalErrorResponse();
        }
        if !deleted {
            return notFoundResponse("no such template task");
        }
        return http:NO_CONTENT;
    }

    // ---- notifications ----------------------------------------------------

    resource function get notifications(@http:Header string? x\-user\-id, @http:Header string? x\-user\-groups,
            @http:Header string? x\-user\-name, int 'limit = 20, int offset = 0)
            returns http:Ok|http:Unauthorized|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        if caller.role == "New Hire" {
            // Notification.recipientRole never names "New Hire" — nothing is
            // ever addressed to this caller.
            return <http:Ok>{body: {count: 0, next: (), previous: (), data: []}};
        }
        int pageLimit = clampLimit('limit);
        NotificationPage|error page = listNotificationsForRole(caller.role, pageLimit, offset);
        if page is error {
            log:printError("listNotificationsForRole failed", 'error = page);
            return internalErrorResponse();
        }
        return <http:Ok>{body: page};
    }

    resource function post notifications/[string notificationId]/read(@http:Header string? x\-user\-id,
            @http:Header string? x\-user\-groups, @http:Header string? x\-user\-name)
            returns http:Ok|http:Unauthorized|http:NotFound|http:InternalServerError {
        CallerContext|http:Unauthorized caller = resolveCaller(x\-user\-id, x\-user\-groups, x\-user\-name);
        if caller is http:Unauthorized {
            return caller;
        }
        Notification?|error result = markNotificationRead(notificationId);
        if result is error {
            log:printError("markNotificationRead failed", 'error = result);
            return internalErrorResponse();
        }
        Notification? notification = result;
        if notification is () {
            return notFoundResponse("no such notification");
        }
        return <http:Ok>{body: notification};
    }
}
