"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Settings, Users } from "lucide-react";

import type { Role } from "@/types";

// スマホの片手操作を優先して画面下部に固定する。
// 現在地の判定に pathname が要るのでクライアントコンポーネント。
export function BottomNav({
  schoolId,
  role,
  unreadCount,
}: {
  schoolId: string;
  role: Role;
  unreadCount: number;
}) {
  const pathname = usePathname();

  const items = [
    { href: `/${schoolId}/events`, label: "イベント", Icon: CalendarDays },
    {
      href: `/${schoolId}/children`,
      label: role === "admin" ? "会員" : "お子さま",
      Icon: Users,
    },
    { href: "/notifications", label: "お知らせ", Icon: Bell, badge: unreadCount },
    ...(role === "admin"
      ? [{ href: `/${schoolId}/settings`, label: "設定", Icon: Settings }]
      : []),
  ];

  return (
    <nav
      aria-label="メインメニュー"
      // 端末下部のホームバーに重ならないよう safe-area 分を足す
      className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-sm lg:max-w-2xl">
        {items.map(({ href, label, Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition ${
                  isActive ? "text-emerald-700" : "text-gray-500"
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
