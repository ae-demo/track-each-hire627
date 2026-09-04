// The keys the platform actually emits for this component: this app's own
// user-auth OIDC keys, and nothing else — a sibling API address is never a
// window._env_ key (react-webapp Constraints), so none is added here even
// though it would make a broken screen look green.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_JWKS_URL: "https://mock-idp.test/.well-known/jwks.json",
  USER_AUTH_SCOPES: "openid profile email group ou",
};
