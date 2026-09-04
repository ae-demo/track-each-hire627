import ballerina/http;

// The caller's resolved identity for one request. Role comes from
// X-User-Groups (thunder-authentication: "a directory is published — the
// role is in X-User-Groups" path; this project has no separate directory, so
// the Thunder groups ARE the roles).
public type CallerContext record {|
    string userId;
    Role role;
    string? userName;
|};

// X-User-Id missing => 401 (api-management: the gateway always sets it on a
// request it let through, so its absence means the request bypassed the
// gateway). An authenticated caller who matches no staff/coordinator group
// still resolves to a role (New Hire, the coldStartRole) rather than being
// rejected — see auth.bal's resolveRole.
function resolveCaller(string? userId, string? groupsHeader, string? userName) returns CallerContext|http:Unauthorized {
    if userId is () || userId.trim() == "" {
        return unauthorizedResponse();
    }
    Role role = resolveRole(groupsHeader);
    return {userId: userId, role: role, userName: userName};
}

function clampLimit(int requested) returns int {
    if requested < 1 {
        return 20;
    }
    if requested > 100 {
        return 100;
    }
    return requested;
}

function isValidDepartment(string department) returns boolean {
    return department == DEPARTMENT_IT || department == DEPARTMENT_HR || department == DEPARTMENT_FACILITIES;
}

function unauthorizedResponse() returns http:Unauthorized {
    return {body: {code: 401, message: "not authenticated"}};
}

function forbiddenResponse(string message) returns http:Forbidden {
    return {body: {code: 403, message: message}};
}

function notFoundResponse(string message) returns http:NotFound {
    return {body: {code: 404, message: message}};
}

function badRequestResponse(string message) returns http:BadRequest {
    return {body: {code: 400, message: message}};
}

function internalErrorResponse() returns http:InternalServerError {
    return {body: {code: 500, message: "internal error"}};
}
