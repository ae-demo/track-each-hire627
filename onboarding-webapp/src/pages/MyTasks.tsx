import { useCallback, useEffect, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { Table, proportional, useTableSelection } from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { StaffShell } from "../components/AppChrome";
import { completeTask, getNewHire, listTasks, type Task } from "../api";
import { useSession } from "../session";

interface Row extends Record<string, unknown> {
  id: string;
  newHireName: string;
  title: string;
  dueDate: string;
  status: Task["status"];
}

function statusBadge(status: Task["status"]) {
  if (status === "completed") return <Badge label="Completed" variant="success" />;
  if (status === "overdue") return <Badge label="Overdue" variant="error" />;
  return <Badge label="Pending" variant="neutral" />;
}

/** IT Staff and Facilities Staff both land here — the API scopes the list
 * to the caller's own department from X-User-Groups, so no department
 * filter is forced client-side (per the issue's screen-to-endpoint guidance). */
export function MyTasks() {
  const { role } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const tasks = await listTasks();
      const names = new Map<string, string>();
      await Promise.all(
        [...new Set(tasks.map((t) => t.newHireId))].map(async (newHireId) => {
          try {
            const hire = await getNewHire(newHireId);
            names.set(newHireId, hire.name);
          } catch {
            names.set(newHireId, newHireId);
          }
        }),
      );
      setRows(
        tasks.map((t) => ({
          id: t.id,
          newHireName: names.get(t.newHireId) ?? t.newHireId,
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your tasks");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkSelectedComplete() {
    if (selected.size === 0) return;
    setIsCompleting(true);
    try {
      await Promise.all([...selected].map((taskId) => completeTask(taskId)));
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete the selected tasks");
    } finally {
      setIsCompleting(false);
    }
  }

  const selectableRows = (rows ?? []).filter((r) => r.status !== "completed");

  const selection = useTableSelection<Row>({
    getIsItemSelected: (item) => selected.has(item.id),
    getIsItemSelectable: (item) => item.status !== "completed",
    onSelectItem: ({ item, isSelected }) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
    },
    onSelectAll: ({ isAllSelected }) => {
      setSelected(isAllSelected ? new Set(selectableRows.map((r) => r.id)) : new Set());
    },
    getIsAllSelected: () => selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.id)),
    getIsIndeterminate: () => selected.size > 0 && !selectableRows.every((r) => selected.has(r.id)),
    getRowLabel: (item) => `${item.title} for ${item.newHireName}`,
  });

  const navLabel = "My Tasks";
  const navHref = "/my-tasks";

  return (
    <StaffShell navLabel={navLabel} navHref={navHref}>
      <Heading level={2}>My Department Tasks</Heading>
      <Banner status="info" title={`Signed in as ${role}`} isDismissable />

      {error && <Banner status="error" title="Could not load your tasks" description={error} />}

      {!error && rows === null && <Spinner size="lg" label="Loading tasks" />}

      {rows !== null && rows.length === 0 && (
        <EmptyState title="No tasks assigned" description="Your department has no onboarding tasks right now." />
      )}

      {rows !== null && rows.length > 0 && (
        <>
          <Table
            data={rows}
            idKey="id"
            hasHover
            plugins={{ selection }}
            columns={[
              { key: "newHireName", header: "New Hire", width: proportional(1) },
              { key: "title", header: "Task", width: proportional(1) },
              { key: "dueDate", header: "Due Date", width: proportional(1) },
              {
                key: "status",
                header: "Status",
                width: proportional(1),
                renderCell: (row) => statusBadge(row.status),
              },
            ]}
          />
          <HStack justify="end" gap={2}>
            <Button
              label="Mark Selected Complete"
              variant="primary"
              isDisabled={selected.size === 0}
              isLoading={isCompleting}
              clickAction={handleMarkSelectedComplete}
            />
          </HStack>
        </>
      )}
    </StaffShell>
  );
}
