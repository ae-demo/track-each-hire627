import createClient from "openapi-fetch";
import type { paths, components } from "./generated/onboarding-api";
import { getAccessToken, signIn } from "./auth";

const client = createClient<paths>({ baseUrl: "/api" });

client.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      await signIn();
    }
    return response;
  },
});

export const onboardingApi = client;

// onboarding-api's openapi.yaml declares X-User-Id/X-User-Role as required
// request headers, but they are identity the API GATEWAY injects from the
// validated bearer token — never the browser's to set (the SPA has no
// trustworthy value for either). These placeholders exist only to satisfy
// the generated client's required-header typing; the gateway lane
// overwrites them with the real, verified identity before the request
// reaches onboarding-api.
const identityHeaders = { "X-User-Id": "", "X-User-Role": "" };

type NewHire = components["schemas"]["NewHire"];
type NewHireInput = components["schemas"]["NewHireInput"];
type Task = components["schemas"]["Task"];
type TemplateTask = components["schemas"]["TemplateTask"];
type TemplateTaskInput = components["schemas"]["TemplateTaskInput"];
type Notification = components["schemas"]["Notification"];
type Department = "IT" | "HR" | "Facilities";
type TaskStatus = "pending" | "completed" | "overdue";

export type { NewHire, NewHireInput, Task, TemplateTask, TemplateTaskInput, Notification, Department, TaskStatus };

export async function listNewHires(): Promise<NewHire[]> {
  const { data, error } = await onboardingApi.GET("/new-hires", {
    params: { header: identityHeaders },
  });
  if (error) throw new Error(error.message);
  return data.data;
}

export async function createNewHire(input: NewHireInput): Promise<NewHire> {
  const { data, error } = await onboardingApi.POST("/new-hires", {
    params: { header: identityHeaders },
    body: input,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getNewHire(newHireId: string): Promise<NewHire> {
  const { data, error } = await onboardingApi.GET("/new-hires/{newHireId}", {
    params: { header: identityHeaders, path: { newHireId } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listNewHireTasks(newHireId: string, department?: Department): Promise<Task[]> {
  const { data, error } = await onboardingApi.GET("/new-hires/{newHireId}/tasks", {
    params: { header: identityHeaders, path: { newHireId }, query: department ? { department } : undefined },
  });
  if (error) throw new Error(error.message);
  return data.data;
}

export async function listTasks(filter?: { department?: Department; status?: TaskStatus }): Promise<Task[]> {
  const { data, error } = await onboardingApi.GET("/tasks", {
    params: { header: identityHeaders, query: filter },
  });
  if (error) throw new Error(error.message);
  return data.data;
}

export async function completeTask(taskId: string): Promise<Task> {
  const { data, error } = await onboardingApi.POST("/tasks/{taskId}/complete", {
    params: { header: identityHeaders, path: { taskId } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listTemplateTasks(): Promise<TemplateTask[]> {
  const { data, error } = await onboardingApi.GET("/template-tasks", {
    params: { header: identityHeaders },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function createTemplateTask(input: TemplateTaskInput): Promise<TemplateTask> {
  const { data, error } = await onboardingApi.POST("/template-tasks", {
    params: { header: identityHeaders },
    body: input,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listNotifications(): Promise<Notification[]> {
  const { data, error } = await onboardingApi.GET("/notifications", {
    params: { header: identityHeaders },
  });
  if (error) throw new Error(error.message);
  return data.data;
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const { data, error } = await onboardingApi.POST("/notifications/{notificationId}/read", {
    params: { header: identityHeaders, path: { notificationId } },
  });
  if (error) throw new Error(error.message);
  return data;
}
