import { useCallback } from "react";
import { useLocation, useNavigate, type NavigateOptions } from "react-router-dom";

/**
 * `useNavigate()`, but every relative in-app path carries the current
 * location's query string forward. mock/auth.ts (and the real IDP session
 * it stands in for) treats the URL as the source of truth for `?role=` /
 * `?auth=out`; a bare `navigate("/dashboard")` would silently drop the
 * caller's identity on the first programmatic navigation and every request
 * after it would run as the mock's default role.
 *
 * Not for `Callback`, which navigates away from the IDP's own `?code=`/
 * `?state=` on purpose.
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (to: string, options?: NavigateOptions) => {
      navigate(to.includes("?") ? to : `${to}${location.search}`, options);
    },
    [navigate, location.search],
  );
}
