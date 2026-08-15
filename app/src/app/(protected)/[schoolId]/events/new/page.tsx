import { requireRole } from "@/lib/auth-guard";
import { messageForCode } from "@/lib/errors";
import { EventFormFields } from "@/components/ui/EventFormFields";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { createEventAction } from "./actions";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId } = await params;
  await requireRole(schoolId, ["admin"]);
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">イベントを作成</h2>
      <p className="text-xs text-gray-500">作成すると、保護者に通知が届きます。</p>

      <form action={createEventAction} className="space-y-4">
        <input type="hidden" name="schoolId" value={schoolId} />
        <FormError message={messageForCode(error)} />

        <EventFormFields />

        <SubmitButton pendingText="作成中...">作成する</SubmitButton>
      </form>
    </div>
  );
}
