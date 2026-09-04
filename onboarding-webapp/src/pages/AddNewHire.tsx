import { useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput } from "@astryxdesign/core/DateInput";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { HStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { HrShell } from "../components/AppChrome";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { createNewHire } from "../api";

export function AddNewHire() {
  const navigate = useAppNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState<ISODateString | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim() !== "" && email.trim() !== "" && !!startDate;

  async function handleCreate() {
    if (!canSave || !startDate) return;
    setIsSaving(true);
    setError(null);
    try {
      await createNewHire({ name, email, startDate });
      navigate("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add new hire");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <HrShell active="Dashboard">
      <Heading level={2}>Add New Hire</Heading>

      {error && <Banner status="error" title="Could not add new hire" description={error} />}

      <FormLayout>
        <TextInput label="Full name" value={name} onChange={setName} isRequired />
        <TextInput label="Email" type="email" value={email} onChange={setEmail} isRequired />
        <DateInput label="Start date" value={startDate} onChange={setStartDate} isRequired />
        <HStack justify="end" gap={2}>
          <Button label="Cancel" clickAction={async () => navigate("/dashboard")} />
          <Button
            label="Create Checklist"
            variant="primary"
            isDisabled={!canSave}
            isLoading={isSaving}
            clickAction={handleCreate}
          />
        </HStack>
      </FormLayout>
    </HrShell>
  );
}
