import Link from "next/link";

import { requireUser } from "@/lib/auth-guard";
import { countUnreadNotifications } from "@/lib/db/notifications";
import { listMySchools } from "@/lib/db/schools";
import { BottomNav } from "@/components/layout/BottomNav";

import { logout } from "./actions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  // 単一スクール専用なので所属は1件。ここで解決してボトムメニューに渡すことで、
  // /notifications のようなスクール配下でないページでもメニューを出せる。
  const [schools, unread] = await Promise.all([listMySchools(), countUnreadNotifications()]);
  const school = schools[0];

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

      {/* ボトムメニューの高さ分だけ下に余白を取り、最後の要素が隠れないようにする */}
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-6 lg:max-w-2xl">
        {children}
        {school && <div aria-hidden className="h-20" />}
      </main>

      {school && (
        <BottomNav schoolId={school.id} role={school.role} unreadCount={unread} />
      )}
    </div>
  );
}
