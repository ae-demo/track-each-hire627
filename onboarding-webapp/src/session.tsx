import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { currentUser, getRole, signIn, type Role } from "./auth";
import type { User } from "oidc-client-ts";

interface Session {
  user: User;
  role: Role;
}

const SessionContext = createContext<Session | null>(null);

/**
 * Gates the whole app on a signed-in session: no session redirects to
 * sign-in immediately (never on a merely-expired token — currentUser()
 * already renews silently), a session resolves the caller's role from
 * their ID token groups and makes both available to every page.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await currentUser();
      if (cancelled) return;
      if (!user) {
        await signIn();
        return;
      }
      const role = await getRole();
      if (cancelled) return;
      setSession({ user, role });
      setIsChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isChecking || !session) return null;

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession() called outside <SessionProvider>");
  return session;
}

/** Each role's home screen — where sign-in and the nav brand both land. */
export function homeRouteFor(role: Role): string {
  switch (role) {
    case "HR Coordinator":
      return "/dashboard";
    case "IT Staff":
    case "Facilities Staff":
      return "/my-tasks";
    case "New Hire":
      return "/my-checklist";
  }
}
