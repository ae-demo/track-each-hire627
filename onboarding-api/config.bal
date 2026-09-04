import ballerina/os;

// Every setting below has a sensible default so the service starts with no
// required environment variables; the platform overrides them at deploy time.

function envOr(string name, string fallback) returns string {
    string value = os:getEnv(name);
    if value == "" {
        return fallback;
    }
    return value;
}

function envOrInt(string name, int fallback) returns int {
    string value = os:getEnv(name);
    if value == "" {
        return fallback;
    }
    int|error parsed = int:fromString(value);
    if parsed is int {
        return parsed;
    }
    return fallback;
}

// onboarding-db (postgres-cnpg) — envBindings from specs/design/components/onboarding-api/design.json
configurable string dbHost = envOr("ONBOARDING_DB_HOST", "localhost");
configurable int dbPort = envOrInt("ONBOARDING_DB_PORT", 5432);
configurable string dbName = envOr("ONBOARDING_DB_DBNAME", "postgres");
configurable string dbUser = envOr("ONBOARDING_DB_USER", "postgres");
configurable string dbPassword = envOr("ONBOARDING_DB_PASSWORD", "postgres");

// user-auth (thunder-app) — the gateway validates tokens and terminates auth
// ahead of this service; these are not read by this service's logic today
// (role/identity arrive as X-User-Id / X-User-Groups headers), but are
// declared so the dependency's wiring is documented alongside the code.
configurable string userAuthIssuer = envOr("USER_AUTH_ISSUER", "");
configurable string userAuthClientId = envOr("USER_AUTH_CLIENT_ID", "");
configurable string userAuthJwksUrl = envOr("USER_AUTH_JWKS_URL", "");
configurable string userAuthScopes = envOr("USER_AUTH_SCOPES", "");

// how often the overdue-detection background job scans for newly-overdue tasks
configurable decimal overdueScanIntervalSeconds = 45;
