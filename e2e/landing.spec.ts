import { test, expect } from "@playwright/test";

test.describe("랜딩 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("헤더가 노출된다", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    // 헤더 내 브랜드 텍스트 (strict 모드: first()로 특정)
    await expect(page.getByText("좌우지간").first()).toBeVisible();
  });

  test("비로그인 상태에서 로그인 버튼이 노출된다", async ({ page }) => {
    const loginBtn = page.getByRole("link", { name: /로그인/ }).or(
      page.getByRole("button", { name: /로그인/ })
    );
    await expect(loginBtn.first()).toBeVisible();
  });

  test("Hero CTA가 렌더된다", async ({ page }) => {
    const cta = page.getByRole("link", { name: /시작/ }).or(
      page.getByRole("button", { name: /시작/ })
    );
    await expect(cta.first()).toBeVisible();
  });

  test("페이지 타이틀이 올바르다", async ({ page }) => {
    await expect(page).toHaveTitle(/좌우지간/);
  });

  test("모바일(375px)에서 레이아웃이 깨지지 않는다", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    // 가로 스크롤 없음
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(385);
  });
});
