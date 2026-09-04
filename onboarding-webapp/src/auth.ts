import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import { env } from "./env";

export const userManager = new UserManager({
  authority: env.USER_AUTH_ISSUER,
  client_id: env.USER_AUTH_CLIENT_ID,
  redirect_uri: window.location.origin + "/callback",
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: env.USER_AUTH_SCOPES,
  // The token lives in JS-readable storage — acceptable for a public SPA; keep
  // loadUserInfo:false and lean on the platform CSP.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  loadUserInfo: false,
});

export async function signIn(): Promise<void> {
  await userManager.signinRedirect();
}

export async function handleCallback(): Promise<User> {
  return userManager.signinRedirectCallback();
}

// No end_session_endpoint → signoutRedirect() rejects; drop the LOCAL session
// instead and let the load-time guard start a fresh sign-in.
export async function signOut(): Promise<void> {
  try {
    await userManager.signoutRedirect();
  } catch {
    await userManager.removeUser();
    window.location.assign("/");
  }
}

// null ONLY when there is no session to renew — an expired one renews silently.
export async function currentUser(): Promise<User | null> {
  const user = await userManager.getUser();
  if (user && !user.expired) return user;
  try {
    return await userManager.signinSilent();
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const user = await currentUser();
  return user?.access_token ?? null;
}

/** The four security.json role names, matched case-insensitively/by substring. */
export type Role = "HR Coordinator" | "IT Staff" | "Facilities Staff" | "New Hire";

const ROLE_NAMES: Role[] = ["HR Coordinator", "IT Staff", "Facilities Staff", "New Hire"];

export async function getGroups(): Promise<string[]> {
  const user = await currentUser();
  const groups = user?.profile?.groups;
  return Array.isArray(groups) ? (groups as string[]) : [];
}

/**
 * Resolve the caller's role from their ID token groups, matching the same
 * case-insensitive/substring rule the backend uses against security.json's
 * role names. Falls back to the coldStartRole ("New Hire") when no group
 * matches — same default the backend applies for a caller with no record yet.
 */
export function resolveRole(groups: string[]): Role {
  for (const role of ROLE_NAMES) {
    const keyword = role.toLowerCase();
    if (groups.some((g) => g.toLowerCase().includes(keyword) || keyword.includes(g.toLowerCase()))) {
      return role;
    }
  }
  return "New Hire";
}

export async function getRole(): Promise<Role> {
  return resolveRole(await getGroups());
}
