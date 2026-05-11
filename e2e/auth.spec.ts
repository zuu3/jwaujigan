import { test, expect } from "@playwright/test";

test.describe("인증 가드", () => {
  test("/home은 비로그인 시 랜딩으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL("/");
  });

  test("/mypage는 비로그인 시 랜딩으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/mypage");
    await expect(page).toHaveURL("/");
  });

  test("/onboarding은 인증 없이도 접근 가능하다", async ({ page }) => {
    const response = await page.goto("/onboarding");
    expect(response?.status()).toBe(200);
  });
});
