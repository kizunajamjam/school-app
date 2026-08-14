import Link from "next/link";

import { requireUser } from "@/lib/auth-guard";

import { logout } from "./actions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/dashboard" className="font-bold text-emerald-700">
          ⚽ school-app
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            ログアウト
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-6 lg:max-w-2xl">{children}</main>
    </div>
  );
}
