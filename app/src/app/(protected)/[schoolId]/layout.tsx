import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { getSchool } from "@/lib/db/schools";

// 画面間の移動はボトムメニューが担うので、ここではスクール名の表示と
// ロールによるアクセス制御だけを行う。
export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  await requireRole(schoolId, ["admin", "guardian"]);
  const school = await getSchool(schoolId);
  if (!school) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{school.name}</h1>
      {children}
    </div>
  );
}
