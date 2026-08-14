import Link from "next/link";

import { listMySchools } from "@/lib/db/schools";

export default async function DashboardPage() {
  const schools = await listMySchools();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">マイスクール</h2>

      {schools.length === 0 ? (
        // 単一スクール専用アプリなので、利用者がスクールを作ることはない。
        // 所属が無い＝招待リンクをまだ使っていない状態。
        <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-gray-200">
          <p className="text-sm text-gray-600">
            まだスクールに参加していません。
            <br />
            運営者から届いた招待リンクを開いて参加してください。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {schools.map((s) => (
            <li key={s.id}>
              <Link
                href={`/${s.id}/events`}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
              >
                <span className="font-medium">{s.name}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                  {s.role === "admin" ? "管理者" : "保護者"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
