import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { getEvent } from "@/lib/db/events";
import { messageForCode } from "@/lib/errors";
import { EventFormFields } from "@/components/ui/EventFormFields";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { updateEventAction } from "./actions";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string; eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId, eventId } = await params;
  await requireRole(schoolId, ["admin"]);
  const { error } = await searchParams;

  const event = await getEvent(eventId);
  if (!event || event.schoolId !== schoolId) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">イベントを編集</h2>
      <p className="text-xs text-gray-500">
        日時・イベント名・場所・締切のいずれかを変更すると、保護者に通知が届きます。
        既に入力された出欠はそのまま残ります。
      </p>

      <form action={updateEventAction} className="space-y-4">
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="eventId" value={eventId} />
        <FormError message={messageForCode(error)} />

        <EventFormFields event={event} />

        <SubmitButton pendingText="保存中...">変更を保存</SubmitButton>
        <Link
          href={`/${schoolId}/events/${eventId}`}
          className="block py-2 text-center text-sm text-gray-500"
        >
          キャンセル
        </Link>
      </form>
    </div>
  );
}
