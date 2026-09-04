import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/onboarding-api";
import { rolesFromToken } from "./auth";

type NewHire = components["schemas"]["NewHire"];
type Task = components["schemas"]["Task"];
type TemplateTask = components["schemas"]["TemplateTask"];
type Notification = components["schemas"]["Notification"];

// Contract is onboarding-api's openapi.yaml (same document src/generated/
// came from), never this app's own page code — so the mock cannot agree
// with a bug in both directions at once.
//
// State lives in this module's scope, in the page's own JS context: a
// create shows up in the next list, a complete persists across in-app
// navigation, but any full page load (reload, typed URL, external link)
// re-runs this module and resets to the seed below. That is what makes a
// verification run repeatable, and also why a row created moments ago can
// vanish if the run leaves the app mid-scenario.

let newHires: NewHire[] = [
  { id: "nh-1", name: "Priya Shah", email: "priya@example.test", startDate: "2026-09-08", status: "in-progress" },
  { id: "nh-2", name: "Sam Ortiz", email: "sam@example.test", startDate: "2026-09-15", status: "completed" },
];

let tasks: Task[] = [
  {
    id: "t-1",
    newHireId: "nh-1",
    templateTaskId: "tt-1",
    title: "Provision laptop",
    department: "IT",
    dueDate: "2026-09-01",
    status: "overdue",
    completedAt: null,
    completedBy: null,
  },
  {
    id: "t-2",
    newHireId: "nh-1",
    templateTaskId: "tt-2",
    title: "Create accounts",
    department: "IT",
    dueDate: "2026-09-10",
    status: "pending",
    completedAt: null,
    completedBy: null,
  },
  {
    id: "t-3",
    newHireId: "nh-1",
    templateTaskId: "tt-3",
    title: "Collect paperwork",
    department: "HR",
    dueDate: "2026-09-03",
    status: "completed",
    completedAt: "2026-09-02T10:00:00Z",
    completedBy: "mock-hr-coordinator",
  },
  {
    id: "t-4",
    newHireId: "nh-1",
    templateTaskId: "tt-4",
    title: "Assign desk",
    department: "Facilities",
    dueDate: "2026-09-08",
    status: "pending",
    completedAt: null,
    completedBy: null,
  },
  {
    id: "t-5",
    newHireId: "nh-2",
    templateTaskId: "tt-1",
    title: "Provision laptop",
    department: "IT",
    dueDate: "2026-09-12",
    status: "completed",
    completedAt: "2026-09-11T09:00:00Z",
    completedBy: "mock-it-staff",
  },
  {
    id: "t-6",
    newHireId: "nh-2",
    templateTaskId: "tt-3",
    title: "Collect paperwork",
    department: "HR",
    dueDate: "2026-09-13",
    status: "pending",
    completedAt: null,
    completedBy: null,
  },
  {
    id: "t-7",
    newHireId: "nh-2",
    templateTaskId: "tt-4",
    title: "Assign desk",
    department: "Facilities",
    dueDate: "2026-09-15",
    status: "pending",
    completedAt: null,
    completedBy: null,
  },
];

let templateTasks: TemplateTask[] = [
  { id: "tt-1", title: "Provision laptop", department: "IT", dueOffsetDays: -3 },
  { id: "tt-2", title: "Create accounts", department: "IT", dueOffsetDays: -1 },
  { id: "tt-3", title: "Collect paperwork", department: "HR", dueOffsetDays: -2 },
  { id: "tt-4", title: "Assign desk", department: "Facilities", dueOffsetDays: 0 },
];

let notifications: Notification[] = [
  { id: "n-1", taskId: "t-1", recipientRole: "IT Staff", type: "reminder", createdAt: "2026-09-02T08:00:00Z", read: false },
  { id: "n-2", taskId: "t-1", recipientRole: "HR Coordinator", type: "escalation", createdAt: "2026-09-02T08:00:00Z", read: false },
];

function roleOf(request: Request): string | null {
  const roles = rolesFromToken(request.headers.get("authorization"));
  return roles[0] ?? null;
}

function forbidden(message: string) {
  return HttpResponse.json({ code: 403, message }, { status: 403 });
}

function unauthorized() {
  return HttpResponse.json({ code: 401, message: "not authenticated" }, { status: 401 });
}

function notFound(message: string) {
  return HttpResponse.json({ code: 404, message }, { status: 404 });
}

let nextId = 100;

export const handlers = [
  http.get("/api/new-hires", ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    let data: NewHire[];
    if (role === "HR Coordinator") data = newHires;
    else if (role === "New Hire") data = newHires.filter((h) => h.id === "nh-1");
    else return forbidden("not permitted");
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.post("/api/new-hires", async ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    if (role !== "HR Coordinator") return forbidden("not permitted");
    const input = (await request.json()) as { name?: string; email?: string; startDate?: string };
    if (!input?.name || !input?.email || !input?.startDate) {
      return HttpResponse.json({ code: 400, message: "invalid input" }, { status: 400 });
    }
    const id = `nh-${nextId++}`;
    const hire: NewHire = { id, name: input.name, email: input.email, startDate: input.startDate, status: "in-progress" };
    newHires = [...newHires, hire];
    // Generate the checklist from the current template, mirroring the real
    // API's documented behaviour (createNewHire summary).
    const generated: Task[] = templateTasks.map((tt) => ({
      id: `t-${nextId++}`,
      newHireId: id,
      templateTaskId: tt.id,
      title: tt.title,
      department: tt.department,
      dueDate: input.startDate!,
      status: "pending",
      completedAt: null,
      completedBy: null,
    }));
    tasks = [...tasks, ...generated];
    return HttpResponse.json(hire, { status: 201 });
  }),

  http.get("/api/new-hires/:newHireId", ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const hire = newHires.find((h) => h.id === params.newHireId);
    if (!hire) return notFound("no such new hire");
    if (role === "New Hire" && hire.id !== "nh-1") return forbidden("not permitted");
    return HttpResponse.json(hire);
  }),

  http.get("/api/new-hires/:newHireId/tasks", ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const hire = newHires.find((h) => h.id === params.newHireId);
    if (!hire) return notFound("no such new hire");
    if (role === "New Hire" && hire.id !== "nh-1") return forbidden("not permitted");
    const url = new URL(request.url);
    const department = url.searchParams.get("department");
    let data = tasks.filter((t) => t.newHireId === params.newHireId);
    if (department) data = data.filter((t) => t.department === department);
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.get("/api/tasks", ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const requestedDepartment = url.searchParams.get("department");

    let data: Task[];
    if (role === "HR Coordinator") {
      data = tasks;
    } else if (role === "IT Staff") {
      data = tasks.filter((t) => t.department === "IT");
    } else if (role === "Facilities Staff") {
      data = tasks.filter((t) => t.department === "Facilities");
    } else {
      return forbidden("not permitted");
    }
    if (requestedDepartment) data = data.filter((t) => t.department === requestedDepartment);
    if (status) data = data.filter((t) => t.status === status);
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.get("/api/tasks/:taskId", ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const task = tasks.find((t) => t.id === params.taskId);
    if (!task) return notFound("no such task");
    return HttpResponse.json(task);
  }),

  http.post("/api/tasks/:taskId/complete", ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const task = tasks.find((t) => t.id === params.taskId);
    if (!task) return notFound("no such task");
    const allowed =
      (task.department === "IT" && role === "IT Staff") ||
      (task.department === "Facilities" && role === "Facilities Staff") ||
      (task.department === "HR" && role === "HR Coordinator");
    if (!allowed) return forbidden("not permitted (wrong department)");
    const updated: Task = {
      ...task,
      status: "completed",
      completedAt: new Date().toISOString(),
      completedBy: `mock-${role.toLowerCase().replace(/\s+/g, "-")}`,
    };
    tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
    return HttpResponse.json(updated);
  }),

  http.get("/api/template-tasks", ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    return HttpResponse.json(templateTasks);
  }),

  http.post("/api/template-tasks", async ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    if (role !== "HR Coordinator") return forbidden("not permitted");
    const input = (await request.json()) as Partial<TemplateTask>;
    if (!input?.title || !input?.department || input.dueOffsetDays === undefined) {
      return HttpResponse.json({ code: 400, message: "invalid input" }, { status: 400 });
    }
    const created: TemplateTask = {
      id: `tt-${nextId++}`,
      title: input.title,
      department: input.department,
      dueOffsetDays: input.dueOffsetDays,
    };
    templateTasks = [...templateTasks, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put("/api/template-tasks/:templateTaskId", async ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    if (role !== "HR Coordinator") return forbidden("not permitted");
    const existing = templateTasks.find((t) => t.id === params.templateTaskId);
    if (!existing) return notFound("no such template task");
    const input = (await request.json()) as Partial<TemplateTask>;
    if (!input?.title || !input?.department || input.dueOffsetDays === undefined) {
      return HttpResponse.json({ code: 400, message: "invalid input" }, { status: 400 });
    }
    const updated: TemplateTask = { ...existing, ...input };
    templateTasks = templateTasks.map((t) => (t.id === updated.id ? updated : t));
    return HttpResponse.json(updated);
  }),

  http.delete("/api/template-tasks/:templateTaskId", ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    if (role !== "HR Coordinator") return forbidden("not permitted");
    const before = templateTasks.length;
    templateTasks = templateTasks.filter((t) => t.id !== params.templateTaskId);
    return before === templateTasks.length ? notFound("no such template task") : new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/notifications", ({ request }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const data = notifications.filter((n) => n.recipientRole === role);
    return HttpResponse.json({ count: data.length, next: null, previous: null, data });
  }),

  http.post("/api/notifications/:notificationId/read", ({ request, params }) => {
    const role = roleOf(request);
    if (!role) return unauthorized();
    const existing = notifications.find((n) => n.id === params.notificationId);
    if (!existing) return notFound("no such notification");
    const updated: Notification = { ...existing, read: true };
    notifications = notifications.map((n) => (n.id === updated.id ? updated : n));
    return HttpResponse.json(updated);
  }),
];
