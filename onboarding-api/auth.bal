import ballerina/lang.value;

// The gateway injects X-User-Groups as a JSON array of the caller's Thunder
// group names. This project publishes no separate directory, so those group
// names ARE the roles (specs/design/security.json's role names match the
// Thunder group names exactly). Accept a comma-separated fallback too, since
// a client forwarding the header by hand may not have JSON-encoded it.
function parseGroups(string? header) returns string[] {
    if header is () {
        return [];
    }
    string trimmed = header.trim();
    if trimmed == "" {
        return [];
    }
    json|error parsed = value:fromJsonString(trimmed);
    if parsed is json {
        string[]|error asArray = parsed.cloneWithType();
        if asArray is string[] {
            return asArray;
        }
    }
    return re `,`.split(trimmed);
}

function groupMatchesRole(string groupName, string roleName) returns boolean {
    return groupName.toLowerAscii().includes(roleName.toLowerAscii());
}

// Resolves the caller's role from X-User-Groups, matching case-insensitively
// / by substring against the four role names in specs/design/security.json.
// A caller in no matching group still resolves — to "New Hire", per that
// file's coldStartRole — rather than being rejected: New Hire's
// "grantedBy" is "first sign-in", so every authenticated caller has at least
// this role.
function resolveRole(string? groupsHeader) returns Role {
    string[] groups = parseGroups(groupsHeader);
    foreach string g in groups {
        if groupMatchesRole(g, "HR Coordinator") {
            return "HR Coordinator";
        }
    }
    foreach string g in groups {
        if groupMatchesRole(g, "IT Staff") {
            return "IT Staff";
        }
    }
    foreach string g in groups {
        if groupMatchesRole(g, "Facilities Staff") {
            return "Facilities Staff";
        }
    }
    return "New Hire";
}

// The department a staff role may complete tasks for / is force-scoped to
// when listing. HR Coordinator completes only HR tasks, though it VIEWS every
// department (handled separately by the listing logic).
function ownDepartmentForRole(Role role) returns string? {
    if role == "IT Staff" {
        return DEPARTMENT_IT;
    }
    if role == "Facilities Staff" {
        return DEPARTMENT_FACILITIES;
    }
    if role == "HR Coordinator" {
        return DEPARTMENT_HR;
    }
    return ();
}
