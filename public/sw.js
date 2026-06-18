const CACHE = "jwj-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(["/offline"])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // GET만 캐싱 (POST 등은 Cache.put 불가)
  if (request.method !== "GET") {
    return;
  }

  // 외부 도메인, API 라우트, Next.js 내부 — 항상 네트워크
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) {
    return;
  }

  // 페이지 네비게이션 — network-only, 실패 시에만 /offline 폴백.
  // HTML을 캐싱하면 재배포 후 stale HTML이 죽은 _next 청크 해시를 참조 →
  // hydration 실패 → 버튼이 안 눌리는 문제. HTML은 절대 캐싱하지 않음.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // 정적 에셋 — cache-first
  e.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
    )
  );
});
