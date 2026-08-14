import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { getSchool } from "@/lib/db/schools";

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const { role } = await requireRole(schoolId, ["admin", "guardian"]);
  const school = await getSchool(schoolId);
  if (!school) notFound();

  const tabs = [
    { href: `/${schoolId}/events`, label: "イベント" },
    { href: `/${schoolId}/children`, label: role === "admin" ? "会員" : "お子さま" },
    ...(role === "admin" ? [{ href: `/${schoolId}/settings`, label: "設定" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-500">
          <Link href="/dashboard" className="hover:underline">
            マイスクール
          </Link>{" "}
          /
        </p>
        <h1 className="text-xl font-bold">{school.name}</h1>
      </div>
      <nav className="flex gap-1 rounded-xl bg-gray-100 p-1 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 rounded-lg px-3 py-2 text-center font-medium text-gray-600 hover:bg-white"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
