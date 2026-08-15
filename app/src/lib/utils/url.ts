import "server-only";

import { headers } from "next/headers";

// アプリの公開URLをリクエストから判定する。
//
// 環境変数に固定すると、デプロイ時の設定漏れで招待リンクが localhost 向けに
// 発行される（誰も開けない）。プレビュー環境ごとにURLが変わる場合も追随できない。
// リクエストヘッダから取れば、どの環境でも正しいURLになる。
export async function getAppUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  // ヘッダが取れない場合の保険
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
