import ballerina/time;
import ballerina/uuid;

function newId() returns string {
    return uuid:createType4AsString();
}

// "YYYY-MM-DD" + a day offset -> "YYYY-MM-DD".
function addDaysToDate(string dateStr, int days) returns string|error {
    time:Utc baseUtc = check time:utcFromString(dateStr + "T00:00:00.000Z");
    time:Utc shifted = time:utcAddSeconds(baseUtc, <decimal>days * 86400);
    string shiftedStr = time:utcToString(shifted);
    return shiftedStr.substring(0, 10);
}

function isValidDateString(string dateStr) returns boolean {
    time:Utc|time:Error parsed = time:utcFromString(dateStr + "T00:00:00.000Z");
    return parsed is time:Utc;
}

function nowTimestamp() returns string {
    return time:utcToString(time:utcNow());
}

// Builds the relative next/previous URIs for a paginated collection response.
function pageLinks(string path, map<string> extraParams, int 'limit, int offset, int total)
        returns [string?, string?] {
    string qs = "";
    foreach [string, string] [k, v] in extraParams.entries() {
        qs = qs + k + "=" + v + "&";
    }
    string? next = ();
    if (offset + 'limit) < total {
        next = string `${path}?${qs}limit=${'limit}&offset=${offset + 'limit}`;
    }
    string? previous = ();
    if offset > 0 {
        int prevOffset = offset - 'limit;
        if prevOffset < 0 {
            prevOffset = 0;
        }
        previous = string `${path}?${qs}limit=${'limit}&offset=${prevOffset}`;
    }
    return [next, previous];
}
