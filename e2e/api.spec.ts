import { test, expect } from "@playwright/test";

test.describe("API 엔드포인트 헬스체크", () => {
  test("GET /api/issues — 비로그인 시 401", async ({ request }) => {
    const res = await request.get("/api/issues");
    expect(res.status()).toBe(401);
  });

  test("GET /api/search — 비로그인 시 401", async ({ request }) => {
    const res = await request.get("/api/search?q=이재명");
    expect(res.status()).toBe(401);
  });

  test("POST /api/district — 비로그인 시 401", async ({ request }) => {
    const res = await request.post("/api/district", { data: { district: "서울 강남구" } });
    expect(res.status()).toBe(401);
  });

  test("POST /api/arena/judge — body 없으면 400", async ({ request }) => {
    const res = await request.post("/api/arena/judge", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/politicians/follows — 비로그인 시 빈 배열 반환 (200)", async ({ request }) => {
    const res = await request.get("/api/politicians/follows");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("names");
    expect(body).toHaveProperty("follows");
    expect(Array.isArray(body.names)).toBeTruthy();
    expect(Array.isArray(body.follows)).toBeTruthy();
  });

  test("POST /api/issues/[id]/vote — 비로그인 시 401", async ({ request }) => {
    const res = await request.post("/api/issues/test-id/vote", {
      data: { position: "진보" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/me/activity — 비로그인 시 401", async ({ request }) => {
    const res = await request.get("/api/me/activity");
    expect(res.status()).toBe(401);
  });

  test("GET /api/arena/verdict — 비로그인 시에도 조회 가능", async ({ request }) => {
    const res = await request.get("/api/arena/verdict?issueId=test-id");
    // 인증 불필요, 결과만 없거나 200
    expect([200, 404]).toContain(res.status());
  });
});
