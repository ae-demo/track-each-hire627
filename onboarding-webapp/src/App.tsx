import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LinkProvider } from "@astryxdesign/core/Link";
import { RouterLinkAdapter } from "./components/RouterLinkAdapter";
import { SessionProvider, homeRouteFor, useSession } from "./session";
import { Callback } from "./pages/Callback";
import { Dashboard } from "./pages/Dashboard";
import { AddNewHire } from "./pages/AddNewHire";
import { NewHireDetail } from "./pages/NewHireDetail";
import { Template } from "./pages/Template";
import { AddTemplateTask } from "./pages/AddTemplateTask";
import { MyTasks } from "./pages/MyTasks";
import { MyChecklist } from "./pages/MyChecklist";

/** Role-based visibility: a screen renders only for the role(s) whose
 * flow in wireframes.dsl walks it; anyone else is bounced to their own
 * home screen. The backend is the real enforcement — this is presentation
 * only (wireframes `references/implementing.md`). */
function RequireRole({ roles, children }: { roles: Array<ReturnType<typeof useSession>["role"]>; children: ReactElement }) {
  const { role } = useSession();
  const location = useLocation();
  if (!roles.includes(role)) return <Navigate to={homeRouteFor(role) + location.search} replace />;
  return children;
}

function Home() {
  const { role } = useSession();
  const location = useLocation();
  return <Navigate to={homeRouteFor(role) + location.search} replace />;
}

export function App() {
  return (
    <LinkProvider component={RouterLinkAdapter}>
      <Routes>
        <Route path="/callback" element={<Callback />} />
        <Route
          path="*"
          element={
            <SessionProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireRole roles={["HR Coordinator"]}>
                      <Dashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/new-hires/new"
                  element={
                    <RequireRole roles={["HR Coordinator"]}>
                      <AddNewHire />
                    </RequireRole>
                  }
                />
                <Route
                  path="/new-hires/:id"
                  element={
                    <RequireRole roles={["HR Coordinator"]}>
                      <NewHireDetail />
                    </RequireRole>
                  }
                />
                <Route
                  path="/template"
                  element={
                    <RequireRole roles={["HR Coordinator"]}>
                      <Template />
                    </RequireRole>
                  }
                />
                <Route
                  path="/template/new"
                  element={
                    <RequireRole roles={["HR Coordinator"]}>
                      <AddTemplateTask />
                    </RequireRole>
                  }
                />
                <Route
                  path="/my-tasks"
                  element={
                    <RequireRole roles={["IT Staff", "Facilities Staff"]}>
                      <MyTasks />
                    </RequireRole>
                  }
                />
                <Route
                  path="/my-checklist"
                  element={
                    <RequireRole roles={["New Hire"]}>
                      <MyChecklist />
                    </RequireRole>
                  }
                />
                <Route path="*" element={<Home />} />
              </Routes>
            </SessionProvider>
          }
        />
      </Routes>
    </LinkProvider>
  );
}
