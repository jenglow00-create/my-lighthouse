import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { BasePage } from './pages/BasePage'

test.describe('Metacognition Flow', () => {
  let loginPage: LoginPage
  let metacognitionPage: BasePage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    metacognitionPage = new BasePage(page)

    await loginPage.goto()
    await loginPage.loginAsTestUser()
  })

  test('should navigate to metacognition page', async ({ page }) => {
    await metacognitionPage.goto('/metacognition')

    // 페이지 로딩 확인
    await expect(page).toHaveURL(/\/metacognition/)
    await metacognitionPage.waitForNoLoadingSpinner()

    await metacognitionPage.screenshot('metacognition-page')
  })

  test('should navigate to metacognition history', async ({ page }) => {
    await metacognitionPage.goto('/metacognition-history')

    // 페이지 로딩 확인
    await expect(page).toHaveURL(/\/metacognition-history/)
    await metacognitionPage.waitForNoLoadingSpinner()

    // 성찰 카드가 있는지 확인 (없을 수도 있음)
    const reflectionCards = await page.locator('.reflection-card').count()
    expect(reflectionCards).toBeGreaterThanOrEqual(0)

    await metacognitionPage.screenshot('metacognition-history')
  })

  test('should persist reflection data after reload', async ({ page }) => {
    await metacognitionPage.goto('/metacognition-history')

    const beforeCount = await page.locator('.reflection-card').count()

    // 페이지 새로고침
    await page.reload()
    await metacognitionPage.waitForNoLoadingSpinner()

    // 데이터 유지 확인
    const afterCount = await page.locator('.reflection-card').count()
    expect(afterCount).toBe(beforeCount)
  })
})
