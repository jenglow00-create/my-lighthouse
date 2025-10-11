import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test.describe('Performance', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
  })

  test('should load pages quickly', async ({ page }) => {
    const pages = [
      { path: '/', name: 'Dashboard' },
      { path: '/study', name: 'StudyLog' },
      { path: '/goals', name: 'Goals' },
      { path: '/ocean-view', name: 'OceanView' }
    ]

    await loginPage.goto()
    await loginPage.loginAsTestUser()

    for (const { path, name } of pages) {
      const startTime = Date.now()

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      console.log(`${name} load time: ${loadTime}ms`)

      // 3초 이내 로딩
      expect(loadTime).toBeLessThan(3000)
    }
  })

  test('should have small bundle size', async ({ page }) => {
    // 네트워크 리소스 수집
    const resources: any[] = []

    page.on('response', (response) => {
      const size = response.headers()['content-length']
      resources.push({
        url: response.url(),
        size: size ? parseInt(size) : 0,
        type: response.request().resourceType()
      })
    })

    await loginPage.goto()
    await loginPage.loginAsTestUser()

    // JS 번들 크기 확인
    const jsResources = resources.filter((r) => r.type === 'script')
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0)

    console.log(`Total JS size: ${(totalJsSize / 1024).toFixed(2)} KB`)

    // 초기 JS < 300KB (gzip 전)
    expect(totalJsSize).toBeLessThan(300 * 1024)
  })

  test('should measure Web Vitals', async ({ page }) => {
    await loginPage.goto()
    await loginPage.loginAsTestUser()

    // Web Vitals 측정
    const vitals = await page.evaluate(() => {
      return new Promise<Record<string, number>>((resolve) => {
        const metrics: Record<string, number> = {}

        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        // CLS
        let clsValue = 0
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          metrics.cls = clsValue
        }).observe({ type: 'layout-shift', buffered: true })

        // 측정 완료 대기 (3초)
        setTimeout(() => resolve(metrics), 3000)
      })
    })

    console.log('Web Vitals:', vitals)

    // LCP < 2500ms
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500)
    }

    // CLS < 0.1
    if (vitals.cls) {
      expect(vitals.cls).toBeLessThan(0.1)
    }
  })
})
