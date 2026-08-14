import type { AttendanceStatus } from "@/types";

// サーバー / クライアント双方から参照するため server-only を付けないこと。

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["attending", "undecided", "absent"];

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  attending: "参加",
  absent: "欠席",
  undecided: "未定",
};

export const STATUS_STYLE: Record<AttendanceStatus, string> = {
  attending: "bg-emerald-600 text-white",
  absent: "bg-red-500 text-white",
  undecided: "bg-gray-200 text-gray-700",
};
