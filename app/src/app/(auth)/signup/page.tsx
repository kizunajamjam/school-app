import Link from "next/link";

import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
  const { next = "/dashboard", error, sent } = await searchParams;
  const loginHref = next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login";

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">確認メールを送信しました</h2>
        <p className="text-sm text-gray-600">
          届いたメール内のリンクをクリックすると登録が完了します。
        </p>
        <Link href={loginHref} className="text-sm text-emerald-700 hover:underline">
          ログイン画面へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">新規登録（保護者・運営者共通）</h2>
      <form action={signup} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <FormError message={error} />
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            お名前
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            メールアドレス
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
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            パスワード（8文字以上）
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
        <SubmitButton pendingText="登録中...">登録する</SubmitButton>
      </form>
      <div className="text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{" "}
        <Link href={loginHref} className="text-emerald-700 hover:underline">
          ログイン
        </Link>
      </div>
    </div>
  );
}
