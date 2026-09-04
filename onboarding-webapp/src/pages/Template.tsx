import { useEffect, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { Table, proportional } from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HrShell } from "../components/AppChrome";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { listTemplateTasks, type TemplateTask } from "../api";

const departmentVariant: Record<string, "blue" | "purple" | "teal"> = {
  IT: "blue",
  HR: "purple",
  Facilities: "teal",
};

export function Template() {
  const navigate = useAppNavigate();
  const [tasks, setTasks] = useState<TemplateTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTemplateTasks()
      .then(setTasks)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load the template"));
  }, []);

  return (
    <HrShell active="Template">
      <HStack justify="between" vAlign="center" gap={4}>
        <Heading level={2}>Standard Checklist Template</Heading>
        <Button label="Add Task" variant="primary" clickAction={async () => navigate("/template/new")} />
      </HStack>

      {error && <Banner status="error" title="Could not load the template" description={error} />}

      {!error && tasks === null && <Spinner size="lg" label="Loading template" />}

      {tasks !== null && tasks.length === 0 && (
        <EmptyState
          title="No template tasks yet"
          description="Add a task so new hires get a generated checklist."
          actions={<Button label="Add Task" variant="primary" clickAction={async () => navigate("/template/new")} />}
        />
      )}

      {tasks !== null && tasks.length > 0 && (
        <Table
          data={tasks}
          idKey="id"
          columns={[
            { key: "title", header: "Task", width: proportional(2) },
            {
              key: "department",
              header: "Department",
              width: proportional(1),
              renderCell: (row) => <Badge label={row.department} variant={departmentVariant[row.department]} />,
            },
            { key: "dueOffsetDays", header: "Due Offset (days)", width: proportional(1) },
          ]}
        />
      )}
    </HrShell>
  );
}
