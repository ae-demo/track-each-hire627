import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/Layout";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HrShell } from "../components/AppChrome";
import { DepartmentCard } from "../components/DepartmentCard";
import { completeTask, getNewHire, listNewHireTasks, type NewHire, type Task } from "../api";

export function NewHireDetail() {
  const { id } = useParams<{ id: string }>();
  const [newHire, setNewHire] = useState<NewHire | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [hire, hireTasks] = await Promise.all([getNewHire(id), listNewHireTasks(id)]);
      setNewHire(hire);
      setTasks(hireTasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load this new hire's checklist");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(taskId: string) {
    await completeTask(taskId);
    await load();
  }

  if (error) {
    return (
      <HrShell active="Dashboard">
        <Banner status="error" title="Could not load new hire" description={error} />
      </HrShell>
    );
  }

  if (!newHire || !tasks) {
    return (
      <HrShell active="Dashboard">
        <Spinner size="lg" label="Loading new hire" />
      </HrShell>
    );
  }

  const itTasks = tasks.filter((t) => t.department === "IT");
  const hrTasks = tasks.filter((t) => t.department === "HR");
  const facilitiesTasks = tasks.filter((t) => t.department === "Facilities");

  return (
    <HrShell active="Dashboard">
      <VStack gap={4}>
        <Heading level={2}>{newHire.name}</Heading>
        <Text type="supporting">Start date: {newHire.startDate}</Text>

        {tasks.length === 0 ? (
          <EmptyState title="No checklist yet" description="This new hire has no generated tasks." />
        ) : (
          <VStack gap={4}>
            <DepartmentCard title="IT Tasks" tasks={itTasks} canComplete={false} onComplete={handleComplete} />
            <DepartmentCard title="HR Tasks" tasks={hrTasks} canComplete onComplete={handleComplete} />
            <DepartmentCard
              title="Facilities Tasks"
              tasks={facilitiesTasks}
              canComplete={false}
              onComplete={handleComplete}
            />
          </VStack>
        )}
      </VStack>
    </HrShell>
  );
}
