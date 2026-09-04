import { useEffect, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { Table, proportional } from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Link } from "@astryxdesign/core/Link";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { HrShell } from "../components/AppChrome";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { listNewHires, listTasks, type NewHire } from "../api";

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  startDate: string;
  status: string;
  overdueTasks: number;
}

export function Dashboard() {
  const navigate = useAppNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [newHires, overdueTasks] = await Promise.all([listNewHires(), listTasks({ status: "overdue" })]);
        if (cancelled) return;
        const overdueByHire = new Map<string, number>();
        for (const task of overdueTasks) {
          overdueByHire.set(task.newHireId, (overdueByHire.get(task.newHireId) ?? 0) + 1);
        }
        setRows(
          newHires.map((h: NewHire) => ({
            id: h.id,
            name: h.name,
            startDate: h.startDate,
            status: h.status,
            overdueTasks: overdueByHire.get(h.id) ?? 0,
          })),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load new hires");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HrShell active="Dashboard">
      <HStack justify="between" vAlign="center" gap={4}>
        <Heading level={2}>New Hires</Heading>
        <Button label="Add New Hire" variant="primary" clickAction={async () => navigate("/new-hires/new")} />
      </HStack>

      {error && <Banner status="error" title="Could not load new hires" description={error} />}

      {!error && rows === null && <Spinner size="lg" label="Loading new hires" />}

      {rows !== null && rows.length === 0 && (
        <EmptyState
          title="No new hires yet"
          description="Add a new hire to generate their onboarding checklist."
          actions={<Button label="Add New Hire" variant="primary" clickAction={async () => navigate("/new-hires/new")} />}
        />
      )}

      {rows !== null && rows.length > 0 && (
        <Table
          data={rows}
          idKey="id"
          hasHover
          columns={[
            {
              key: "name",
              header: "Name",
              width: proportional(1),
              renderCell: (row) => <Link href={`/new-hires/${row.id}`}>{row.name}</Link>,
            },
            { key: "startDate", header: "Start Date", width: proportional(1) },
            {
              key: "status",
              header: "Status",
              width: proportional(1),
              renderCell: (row) => (
                <Badge
                  label={row.status === "completed" ? "Completed" : "In Progress"}
                  variant={row.status === "completed" ? "success" : "neutral"}
                />
              ),
            },
            {
              key: "overdueTasks",
              header: "Overdue Tasks",
              width: proportional(1),
              renderCell: (row) => (
                <Badge label={String(row.overdueTasks)} variant={row.overdueTasks > 0 ? "error" : "neutral"} />
              ),
            },
          ]}
        />
      )}
    </HrShell>
  );
}
