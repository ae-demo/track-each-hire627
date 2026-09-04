// Typed read of the runtime config the platform mounts as `/env-config.js`.
// This app declares one auth platform-resource dependency (`user-auth`), so
// only its four OIDC keys are ever present — never a sibling API URL, which
// lives at same-origin `/api` instead (see src/api.ts).
type Env = {
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_JWKS_URL: string;
  USER_AUTH_SCOPES: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server (npm run dev:mock).",
  );
}

export const env: Env = window._env_;
