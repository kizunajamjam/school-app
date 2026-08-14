import Link from "next/link";

import { SubmitButton } from "@/components/ui/SubmitButton";

import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">パスワード再設定メールを送信しました</h2>
        <p className="text-sm text-gray-600">
          該当のメールアドレスが登録されている場合、再設定用のリンクを送信しました。
        </p>
        <Link href="/login" className="text-sm text-emerald-700 hover:underline">
          ログイン画面へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">パスワードを忘れた方</h2>
      <form action={requestPasswordReset} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            登録済みのメールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <SubmitButton pendingText="送信中...">再設定メールを送る</SubmitButton>
      </form>
      <div className="text-center text-sm text-gray-600">
        <Link href="/login" className="text-emerald-700 hover:underline">
          ログイン画面へ戻る
        </Link>
      </div>
    </div>
  );
}
