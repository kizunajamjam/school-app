import Link from "next/link";

import { getCurrentUser } from "@/lib/supabase/server";
import { getInvitationByTokenWithSchoolName } from "@/lib/db/invitations";
import { isPast } from "@/lib/utils/time";
import { messageForCode } from "@/lib/errors";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { acceptInvite } from "./actions";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const result = await getInvitationByTokenWithSchoolName(token);

  if (!result) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">招待リンクが無効です</h2>
        <p className="text-sm text-gray-600">運営者に招待リンクの再発行を依頼してください。</p>
      </div>
    );
  }

  const isExpired = isPast(result.invitation.expiresAt);
  const user = await getCurrentUser();
  const loginNext = `/invite/${token}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">「{result.schoolName}」への招待</h2>
      <FormError message={messageForCode(error)} />

      {isExpired ? (
        <p className="text-sm text-gray-600">
          この招待リンクの有効期限は切れています。運営者に再発行を依頼してください。
        </p>
      ) : user ? (
        <form action={acceptInvite} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm text-gray-600">保護者として参加します。よろしいですか？</p>
          <SubmitButton pendingText="参加処理中...">参加する</SubmitButton>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">参加するにはログインまたは新規登録が必要です。</p>
          <Link
            href={`/login?next=${encodeURIComponent(loginNext)}`}
            className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center font-medium text-white"
          >
            ログインして参加
          </Link>
          <Link
            href={`/signup?next=${encodeURIComponent(loginNext)}`}
            className="block w-full rounded-xl border border-emerald-600 px-4 py-3 text-center font-medium text-emerald-700"
          >
            新規登録して参加
          </Link>
        </div>
      )}
    </div>
  );
}
