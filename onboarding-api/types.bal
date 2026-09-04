// Domain records. Field names match the OpenAPI schemas in
// specs/design/components/onboarding-api/openapi.yaml exactly.

public type NewHireInput record {|
    string name;
    string email;
    string startDate;
|};

public type NewHire record {|
    *NewHireInput;
    string id;
    string status;
|};

public type NewHirePage record {|
    int count;
    string? next;
    string? previous;
    NewHire[] data;
|};

public type TemplateTaskInput record {|
    string title;
    string department;
    int dueOffsetDays;
|};

public type TemplateTask record {|
    *TemplateTaskInput;
    string id;
|};

public type Task record {|
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

public type TaskPage record {|
    int count;
    string? next;
    string? previous;
    Task[] data;
|};

public type Notification record {|
    string id;
    string taskId;
    string recipientRole;
    string 'type;
    string createdAt;
    boolean 'read;
|};

public type NotificationPage record {|
    int count;
    string? next;
    string? previous;
    Notification[] data;
|};

public type ErrorPayload record {|
    int code;
    string message;
    string description?;
    string moreInfo?;
|};

// The four roles this service resolves callers into, per
// specs/design/security.json.
public type Role "HR Coordinator"|"IT Staff"|"Facilities Staff"|"New Hire";

public const string DEPARTMENT_IT = "IT";
public const string DEPARTMENT_HR = "HR";
public const string DEPARTMENT_FACILITIES = "Facilities";

public const string STATUS_PENDING = "pending";
public const string STATUS_COMPLETED = "completed";
public const string STATUS_OVERDUE = "overdue";

public const string NOTIFICATION_REMINDER = "reminder";
public const string NOTIFICATION_ESCALATION = "escalation";
