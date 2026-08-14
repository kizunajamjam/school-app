import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { resetPassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">新しいパスワードを設定</h2>
      <form action={resetPassword} className="space-y-4">
        <FormError message={error} />
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            新しいパスワード（8文字以上）
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <SubmitButton pendingText="更新中...">パスワードを更新する</SubmitButton>
      </form>
    </div>
  );
}
