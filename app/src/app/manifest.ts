import type { MetadataRoute } from "next";

// ホーム画面に追加したときの見え方を定義する。
// start_url を "/" にしておくと、ログイン状態に応じて
// ダッシュボードかログイン画面へ自動で振り分けられる。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "school-app｜サッカースクール出欠管理",
    short_name: "school-app",
    description: "練習・試合の出欠を保護者が入力し、運営者が管理するアプリ",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#059669",
    lang: "ja",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable は端末側で円形などに切り抜かれる前提の別素材
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
