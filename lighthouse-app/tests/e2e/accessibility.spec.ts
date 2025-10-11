import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { LoginPage } from './pages/LoginPage'

test.describe('Accessibility', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAsTestUser()
  })

  test('should not have accessibility violations on Dashboard', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // 위반 사항 출력
    if (accessibilityScanResults.violations.length > 0) {
      console.log(
        'Accessibility violations:',
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      )
    }

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')

    // Tab으로 네비게이션
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // 여러 번 Tab
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Enter로 링크 활성화
    await page.keyboard.press('Enter')

    // 페이지 전환 확인
    await page.waitForLoadState('networkidle')
  })

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/ocean-view')

    // 모든 이미지 확인
    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')

      // decorative 이미지가 아니면 alt 필수
      const isDecorative = (await img.getAttribute('role')) === 'presentation'

      if (!isDecorative) {
        expect(alt).toBeTruthy()
      }
    }
  })
})
