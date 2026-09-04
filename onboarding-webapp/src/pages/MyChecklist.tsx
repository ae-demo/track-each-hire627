import { useEffect, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Layout";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { StaffShell } from "../components/AppChrome";
import { DepartmentCard } from "../components/DepartmentCard";
import { listNewHires, listNewHireTasks, type Task } from "../api";

// A New Hire never completes a task themselves (REQ-011-c) — this handler
// exists only to satisfy DepartmentCard's shared prop shape; canComplete is
// always false on every card below, so it is never invoked.
function noComplete() {}

export function MyChecklist() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecklist, setHasChecklist] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // onboarding-api has no /me endpoint: for a New Hire caller,
        // GET /new-hires is scoped server-side to their own record —
        // a 1-item or empty page (see the issue's "Known API behavior").
        const mine = await listNewHires();
        if (cancelled) return;
        if (mine.length === 0) {
          setHasChecklist(false);
          setTasks([]);
          return;
        }
        const myTasks = await listNewHireTasks(mine[0].id);
        if (cancelled) return;
        setTasks(myTasks);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load your checklist");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StaffShell navLabel="My Checklist" navHref="/my-checklist">
      <VStack gap={4}>
        <Heading level={2}>My Onboarding Checklist</Heading>

        {error && <Banner status="error" title="Could not load your checklist" description={error} />}

        {!error && tasks === null && <Spinner size="lg" label="Loading your checklist" />}

        {!error && tasks !== null && !hasChecklist && (
          <EmptyState
            title="No checklist yet"
            description="Your onboarding checklist has not been generated yet — check back soon."
          />
        )}

        {!error && tasks !== null && hasChecklist && (
          <VStack gap={4}>
            <DepartmentCard
              title="IT"
              tasks={tasks.filter((t) => t.department === "IT")}
              canComplete={false}
              onComplete={noComplete}
              showDueDate={false}
            />
            <DepartmentCard
              title="HR"
              tasks={tasks.filter((t) => t.department === "HR")}
              canComplete={false}
              onComplete={noComplete}
              showDueDate={false}
            />
            <DepartmentCard
              title="Facilities"
              tasks={tasks.filter((t) => t.department === "Facilities")}
              canComplete={false}
              onComplete={noComplete}
              showDueDate={false}
            />
          </VStack>
        )}
      </VStack>
    </StaffShell>
  );
}
