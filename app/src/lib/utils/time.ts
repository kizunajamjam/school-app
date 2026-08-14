// 日時は必ず日本時間として扱う。
//
// サーバー(Vercel等)のタイムゾーンは UTC のことが多く、Date の
// 「タイムゾーン省略時はローカル時刻として解釈／表示する」挙動に任せると、
// 開発機(日本時間)では正しく見えるのに本番で9時間ずれる。
// 入力の解釈も表示も、ここで明示的に固定する。

export const APP_TIME_ZONE = "Asia/Tokyo";
const JST_OFFSET = "+09:00";

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

// <input type="date"> と <input type="time"> の値を日本時間として ISO に変換する。
export function jstInputToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00${JST_OFFSET}`).toISOString();
}

// 例: 2026/8/22(土) 09:00
export function formatDateTimeLong(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 例: 8/22(土) 09:00
export function formatDateTimeShort(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: APP_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 例: 8/15 00:03（履歴用。曜日は不要）
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: APP_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 例: 2026/8/21
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", { timeZone: APP_TIME_ZONE });
}
