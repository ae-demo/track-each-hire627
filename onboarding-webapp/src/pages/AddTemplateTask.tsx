import { useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { HStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { HrShell } from "../components/AppChrome";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { createTemplateTask, type Department } from "../api";

const departmentOptions = ["IT", "HR", "Facilities"];

export function AddTemplateTask() {
  const navigate = useAppNavigate();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [dueOffsetDays, setDueOffsetDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = title.trim() !== "" && department !== "" && dueOffsetDays !== null;

  async function handleSave() {
    if (!canSave || dueOffsetDays === null) return;
    setIsSaving(true);
    setError(null);
    try {
      await createTemplateTask({ title, department: department as Department, dueOffsetDays });
      navigate("/template");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save template task");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <HrShell active="Template">
      <Heading level={2}>Add Template Task</Heading>

      {error && <Banner status="error" title="Could not save template task" description={error} />}

      <FormLayout>
        <TextInput label="Task title" value={title} onChange={setTitle} isRequired />
        <Selector
          label="Department (IT, HR, Facilities)"
          options={departmentOptions}
          value={department}
          onChange={setDepartment}
          placeholder="Select a department"
        />
        <NumberInput
          label="Due offset (days from start date)"
          value={dueOffsetDays}
          onChange={setDueOffsetDays}
          isRequired
        />
        <HStack justify="end" gap={2}>
          <Button label="Cancel" clickAction={async () => navigate("/template")} />
          <Button
            label="Save Task"
            variant="primary"
            isDisabled={!canSave}
            isLoading={isSaving}
            clickAction={handleSave}
          />
        </HStack>
      </FormLayout>
    </HrShell>
  );
}
