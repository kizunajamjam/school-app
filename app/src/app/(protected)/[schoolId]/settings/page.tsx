import { requireRole } from "@/lib/auth-guard";
import { listInvitations } from "@/lib/db/invitations";
import { listCategories, listClasses } from "@/lib/db/masters";
import { formatDate, isPast } from "@/lib/utils/time";
import { FormError } from "@/components/ui/FormError";
import { messageForCode } from "@/lib/errors";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getAppUrl } from "@/lib/utils/url";

import {
  createCategoryAction,
  createClassAction,
  createInvitationAction,
  deleteCategoryAction,
  deleteClassAction,
  deleteInvitationAction,
} from "./actions";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId } = await params;
  await requireRole(schoolId, ["admin"]);
  const { error } = await searchParams;

  const [invitations, categories, classes] = await Promise.all([
    listInvitations(schoolId),
    listCategories(schoolId),
    listClasses(schoolId),
  ]);

  const appUrl = await getAppUrl();

  return (
    <div className="space-y-10">
      <FormError message={messageForCode(error)} />

      <MasterSection
        title="カテゴリー"
        description="U-10 などの学年区分です。会員1人につき1つ設定できます。"
        placeholder="例: U-10"
        items={categories}
        schoolId={schoolId}
        createAction={createCategoryAction}
        deleteAction={deleteCategoryAction}
        idFieldName="categoryId"
      />

      <MasterSection
        title="クラス"
        description="火曜クラス、初級クラスなどの区分です。掛け持ちできるため、会員1人に複数設定できます。"
        placeholder="例: 火曜クラス"
        items={classes}
        schoolId={schoolId}
        createAction={createClassAction}
        deleteAction={deleteClassAction}
        idFieldName="classId"
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">招待リンク</h2>
          <p className="mt-1 text-sm text-gray-600">
            発行したリンクを保護者に共有すると、保護者アカウントとしてこのスクールに参加できます。
          </p>
        </div>

        <form action={createInvitationAction}>
          <input type="hidden" name="schoolId" value={schoolId} />
          <SubmitButton pendingText="発行中...">新しい招待リンクを発行</SubmitButton>
        </form>

        <ul className="space-y-3">
          {invitations.map((inv) => {
            const expired = isPast(inv.expiresAt);
            return (
              <li
                key={inv.id}
                className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
              >
                <p className="break-all text-sm text-emerald-700">
                  {appUrl}/invite/{inv.token}
                </p>
                <p className="text-xs text-gray-500">
                  {expired
                    ? "期限切れ"
                    : `有効期限: ${formatDate(inv.expiresAt)}`}
                </p>
                <form action={deleteInvitationAction}>
                  <input type="hidden" name="schoolId" value={schoolId} />
                  <input type="hidden" name="invitationId" value={inv.id} />
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    失効させる
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function MasterSection({
  title,
  description,
  placeholder,
  items,
  schoolId,
  createAction,
  deleteAction,
  idFieldName,
}: {
  title: string;
  description: string;
  placeholder: string;
  items: { id: string; name: string }[];
  schoolId: string;
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  idFieldName: "categoryId" | "classId";
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium">{item.name}</span>
              <form action={deleteAction}>
                <input type="hidden" name="schoolId" value={schoolId} />
                <input type="hidden" name={idFieldName} value={item.id} />
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  削除
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={createAction} className="flex gap-2">
        <input type="hidden" name="schoolId" value={schoolId} />
        <input
          name="name"
          required
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white"
        >
          追加
        </button>
      </form>
    </section>
  );
}
