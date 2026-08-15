import Link from "next/link";

import { requireRole } from "@/lib/auth-guard";
import { listChildren, listChildrenWithGuardianName } from "@/lib/db/children";
import { listInvitations } from "@/lib/db/invitations";
import { listCategories, listClasses } from "@/lib/db/masters";
import { isPast } from "@/lib/utils/time";
import {
  CHILD_SORT_LABEL,
  UNSET_FILTER,
  parseSortKey,
  type ChildSortKey,
} from "@/lib/constants/children";
import { FormError } from "@/components/ui/FormError";
import { messageForCode } from "@/lib/errors";
import { ClassBadges } from "@/components/ui/ClassBadges";
import { ClassCheckboxes } from "@/components/ui/ClassCheckboxes";
import { MasterSelect } from "@/components/ui/MasterSelect";
import type { Category, ChildWithLabels, SchoolClass } from "@/types";

import { AddChildButton } from "./AddChildButton";
import { ChildrenListControls } from "./ChildrenListControls";
import { InviteGuardianButton } from "./InviteGuardianButton";
import { deleteChildAction, updateChildAction } from "./actions";

const UNSET_ORDER = Number.MAX_SAFE_INTEGER;

// 未設定は常に末尾へ送る。
function orderOf(id: string | null, order: Map<string, number>) {
  if (!id) return UNSET_ORDER;
  return order.get(id) ?? UNSET_ORDER;
}

// クラスは掛け持ちがあるので、所属クラスのうち最も前のものを並び順に使う。
function classOrderOf(ids: string[], order: Map<string, number>) {
  if (ids.length === 0) return UNSET_ORDER;
  return Math.min(...ids.map((id) => order.get(id) ?? UNSET_ORDER));
}

function sortChildren<T extends ChildWithLabels>(
  children: T[],
  sort: ChildSortKey,
  categories: Category[],
  classes: SchoolClass[],
): T[] {
  if (sort === "created") return children; // DB から created_at 昇順で来ている

  const categoryOrder = new Map(categories.map((c, i) => [c.id, i]));
  const classOrder = new Map(classes.map((c, i) => [c.id, i]));
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "ja");

  return [...children].sort((a, b) => {
    switch (sort) {
      case "name":
        return byName(a, b);
      case "category":
        return (
          orderOf(a.categoryId, categoryOrder) - orderOf(b.categoryId, categoryOrder) || byName(a, b)
        );
      case "class":
        return (
          classOrderOf(a.classIds, classOrder) - classOrderOf(b.classIds, classOrder) || byName(a, b)
        );
    }
  });
}

export default async function ChildrenPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ error?: string; category?: string; class?: string; sort?: string }>;
}) {
  const { schoolId } = await params;
  const { user, role } = await requireRole(schoolId, ["admin", "guardian"]);
  const {
    error,
    category: categoryFilter = "",
    class: classFilter = "",
    sort: sortParam,
  } = await searchParams;
  const sort = parseSortKey(sortParam);
  const isAdmin = role === "admin";

  const [categories, classes] = await Promise.all([
    listCategories(schoolId),
    listClasses(schoolId),
  ]);
  const hasMasters = categories.length > 0 || classes.length > 0;

  const children: (ChildWithLabels & { guardianName?: string })[] = isAdmin
    ? await listChildrenWithGuardianName(schoolId)
    : (await listChildren(schoolId)).filter((c) => c.guardianId === user.id);

  const matchesCategory = (value: string | null, filter: string) => {
    if (!filter) return true;
    return filter === UNSET_FILTER ? value === null : value === filter;
  };

  // クラスは掛け持ちがあるので「そのクラスに所属しているか」で判定する。
  const matchesClass = (ids: string[], filter: string) => {
    if (!filter) return true;
    return filter === UNSET_FILTER ? ids.length === 0 : ids.includes(filter);
  };

  const filtered = children.filter(
    (c) => matchesCategory(c.categoryId, categoryFilter) && matchesClass(c.classIds, classFilter),
  );
  const visible = sortChildren(filtered, sort, categories, classes);

  const filterCount = (categoryFilter ? 1 : 0) + (classFilter ? 1 : 0);
  // 1人しかいない保護者に絞り込み・並び替えを出しても邪魔なだけ。
  const showControls = children.length >= 2;

  // 管理者の「+」は保護者への招待。有効なリンクがあればそれを見せる。
  let inviteUrl: string | null = null;
  if (isAdmin) {
    const active = (await listInvitations(schoolId)).find((inv) => !isPast(inv.expiresAt));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    inviteUrl = active ? `${appUrl}/invite/${active.token}` : null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{isAdmin ? "会員一覧" : "お子さま"}</h2>
        {isAdmin ? (
          <InviteGuardianButton schoolId={schoolId} inviteUrl={inviteUrl} />
        ) : (
          <AddChildButton schoolId={schoolId} categories={categories} classes={classes} />
        )}
      </div>

      <FormError message={messageForCode(error)} />

      {isAdmin && !hasMasters && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          カテゴリー・クラスがまだ登録されていません。
          <Link href={`/${schoolId}/settings`} className="ml-1 underline">
            設定画面
          </Link>
          から追加すると、会員ごとに割り当てられます。
        </p>
      )}

      {showControls && (
        <ChildrenListControls
          categories={categories}
          classes={classes}
          categoryFilter={categoryFilter}
          classFilter={classFilter}
          sort={sort}
          filterCount={filterCount}
        />
      )}

      {children.length === 0 ? (
        <p className="text-sm text-gray-500">
          {isAdmin
            ? "登録された会員はいません。右上の＋から保護者を招待してください。"
            : "右上の＋からお子さまを登録してください。"}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            {filterCount > 0
              ? `${children.length}件中 ${visible.length}件を表示（${CHILD_SORT_LABEL[sort]}）`
              : `${visible.length}件・${CHILD_SORT_LABEL[sort]}。タップすると詳細を編集できます。`}
          </p>

          {visible.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
              条件に合う会員がいません。
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((child) => (
                <ChildRow
                  key={child.id}
                  schoolId={schoolId}
                  child={child}
                  isAdmin={isAdmin}
                  categories={categories}
                  classes={classes}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ChildRow({
  schoolId,
  child,
  isAdmin,
  categories,
  classes,
}: {
  schoolId: string;
  child: ChildWithLabels & { guardianName?: string };
  isAdmin: boolean;
  categories: Category[];
  classes: SchoolClass[];
}) {
  return (
    <li className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
      {/* 開閉だけなので details/summary で済ませる（クライアントJS不要） */}
      <details>
        {/* 幅が足りないときは 学年 → カテゴリー の順に諦め、名前だけは最後まで残す */}
        <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 shrink truncate font-medium">{child.name}</span>
          {child.grade && (
            <span className="hidden shrink-0 text-xs text-gray-500 min-[380px]:inline">
              {child.grade}
            </span>
          )}
          {child.categoryName && (
            <span className="hidden shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 min-[340px]:inline">
              {child.categoryName}
            </span>
          )}
          {/* 掛け持ちしていても1行に収まるよう、2件までに畳む */}
          <ClassBadges names={child.classNames} max={2} />
          <span className="ml-auto shrink-0 text-xs text-gray-400">▾</span>
        </summary>

        <div className="mt-3 border-t border-gray-100 pt-3">
          {child.guardianName && (
            <p className="mb-3 text-xs text-gray-500">保護者: {child.guardianName}</p>
          )}

          <form action={updateChildAction} className="space-y-3">
            <input type="hidden" name="schoolId" value={schoolId} />
            <input type="hidden" name="childId" value={child.id} />

            {isAdmin ? (
              // 氏名・学年は保護者の入力値。管理者は割り当てのみ変更する。
              <>
                <input type="hidden" name="name" value={child.name} />
                <input type="hidden" name="grade" value={child.grade ?? ""} />
              </>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1 text-xs text-gray-500">
                  お名前
                  <input
                    name="name"
                    defaultValue={child.name}
                    required
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </label>
                <label className="flex-1 text-xs text-gray-500">
                  学年
                  <input
                    name="grade"
                    defaultValue={child.grade ?? ""}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                </label>
              </div>
            )}

            <MasterSelect
              name="categoryId"
              label="カテゴリー"
              options={categories}
              defaultValue={child.categoryId}
            />
            <ClassCheckboxes options={classes} selectedIds={child.classIds} />

            <button
              type="submit"
              className="w-full rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-700"
            >
              保存する
            </button>
          </form>

          {!isAdmin && (
            <form action={deleteChildAction} className="mt-2 text-right">
              <input type="hidden" name="schoolId" value={schoolId} />
              <input type="hidden" name="childId" value={child.id} />
              <button type="submit" className="text-xs text-red-600 hover:underline">
                削除
              </button>
            </form>
          )}
        </div>
      </details>
    </li>
  );
}
