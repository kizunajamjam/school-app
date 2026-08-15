// Service Worker
//
// 方針: 壊れた Service Worker は利用者の端末に居座って直しにくいので、
//       やることを最小限に絞る。
//
//   - ページ(HTML)は常にネットワーク優先。出欠のような更新頻度の高い情報を
//     古いまま見せない。通信できないときだけオフライン画面を出す。
//   - キャッシュするのは /_next/static/ 配下（ファイル名にハッシュが付くので
//     内容が変われば別URLになる）とアイコンだけ。
//   - Server Actions は POST なので触らない。
//   - Supabase など他オリジンへの通信も触らない。

const VERSION = "v1";
const CACHE = `school-app-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Server Actions やフォーム送信には一切関与しない
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase への通信などは素通し
  if (url.origin !== self.location.origin) return;

  // ハッシュ付きの静的アセットはキャッシュ優先で構わない
  if (url.pathname.startsWith("/_next/static/") || PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 画面遷移はネットワーク優先。オフラインのときだけ代替画面を出す
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }

  // それ以外はブラウザの既定動作に任せる
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
}
