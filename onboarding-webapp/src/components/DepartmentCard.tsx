import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Table, proportional } from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import type { Task } from "../api";

export function statusBadge(status: Task["status"]) {
  if (status === "completed") return <Badge label="Completed" variant="success" />;
  if (status === "overdue") return <Badge label="Overdue" variant="error" />;
  return <Badge label="Pending" variant="neutral" />;
}

/**
 * One of NewHireDetail's / MyChecklist's IT/HR/Facilities cards. Read-only
 * unless `canComplete` — only the HR Coordinator, on the HR card, ever
 * passes true (story 4); MyChecklist's New Hire never does (REQ-011-c).
 */
export function DepartmentCard({
  title,
  tasks,
  canComplete,
  onComplete,
  showDueDate = true,
}: {
  title: string;
  tasks: Task[];
  canComplete: boolean;
  onComplete: (taskId: string) => void;
  /** NewHireDetail's cards draw "Task | Due Date | Status"; MyChecklist's
   * draw only "Task | Status" — element-for-element per wireframes.dsl. */
  showDueDate?: boolean;
}) {
  return (
    <Card>
      <VStack gap={3}>
        <Heading level={4}>{title}</Heading>
        {tasks.length === 0 ? (
          <Text type="supporting">No {title.toLowerCase()} tasks.</Text>
        ) : (
          <Table
            data={tasks}
            idKey="id"
            columns={[
              { key: "title", header: "Task", width: proportional(2) },
              ...(showDueDate ? [{ key: "dueDate", header: "Due Date", width: proportional(1) }] : []),
              {
                key: "status",
                header: "Status",
                width: proportional(1),
                renderCell: (row) =>
                  canComplete && row.status !== "completed" ? (
                    <HStack gap={2} vAlign="center">
                      {statusBadge(row.status)}
                      <Button label="Mark Complete" size="sm" clickAction={async () => onComplete(row.id)} />
                    </HStack>
                  ) : (
                    statusBadge(row.status)
                  ),
              },
            ]}
          />
        )}
      </VStack>
    </Card>
  );
}
