import Link from "next/link";

import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/dashboard", error } = await searchParams;
  const signupHref = next !== "/dashboard" ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">ログイン</h2>
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <FormError message={error} />
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
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <SubmitButton pendingText="ログイン中...">ログイン</SubmitButton>
      </form>
      <div className="flex justify-between text-sm text-gray-600">
        <Link href={signupHref} className="text-emerald-700 hover:underline">
          新規登録
        </Link>
        <Link href="/forgot-password" className="text-emerald-700 hover:underline">
          パスワードを忘れた方
        </Link>
      </div>
    </div>
  );
}
