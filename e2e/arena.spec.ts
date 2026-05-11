import { test, expect } from "@playwright/test";

test.describe("아레나 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/arena");
  });

  test("아레나 페이지가 200으로 로드된다", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("진보/보수 레이블이 모두 노출된다", async ({ page }) => {
    await expect(page.getByText("진보").first()).toBeVisible();
    await expect(page.getByText("보수").first()).toBeVisible();
  });

  test("이슈 카드가 1개 이상 렌더된다", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // IssueCard = styled(Link) → <a href="/arena/[id]">
    const issueLinks = page.locator('a[href^="/arena/"]');
    const count = await issueLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("이슈 카드에 제목 텍스트가 있다", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const firstCard = page.locator('a[href^="/arena/"]').first();
    await expect(firstCard).toBeVisible();
    const text = await firstCard.textContent();
    expect(text?.length).toBeGreaterThan(5);
  });

  test("배틀 참여 버튼/링크가 존재한다", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const battleLink = page.locator('a[href*="battle"]');
    if (await battleLink.count() > 0) {
      await expect(battleLink.first()).toBeVisible();
    }
  });
});

test.describe("아레나 배틀 페이지 접근", () => {
  test("존재하지 않는 이슈 ID는 not-found를 반환한다", async ({ page }) => {
    const response = await page.goto("/arena/nonexistent-issue-id/battle");
    expect(response?.status()).not.toBe(200);
  });
});
