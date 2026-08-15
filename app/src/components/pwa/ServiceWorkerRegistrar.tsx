"use client";

import { useEffect } from "react";

// Service Worker の登録だけを行う。開発中は HMR と干渉するので登録しない。
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // 失敗してもアプリの動作には影響しないので握りつぶす
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
