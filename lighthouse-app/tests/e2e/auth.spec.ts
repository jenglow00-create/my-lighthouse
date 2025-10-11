import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Authentication', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)

    // 로그인 페이지로 이동
    await loginPage.goto()
  })

  test('should login successfully with test account', async () => {
    // 로그인 수행
    await loginPage.loginAsTestUser()

    // 대시보드로 리다이렉트 확인
    await expect(dashboardPage.page).toHaveURL('/')
    expect(await dashboardPage.isLoaded()).toBeTruthy()

    // 스크린샷
    await dashboardPage.screenshot('login-success')
  })

  test('should persist session after page reload', async () => {
    // 로그인
    await loginPage.loginAsTestUser()
    await dashboardPage.isLoaded()

    // 페이지 새로고침
    await dashboardPage.page.reload()

    // 여전히 로그인 상태
    expect(await dashboardPage.isLoaded()).toBeTruthy()

    // 로그인 페이지로 리다이렉트 안 됨
    await expect(dashboardPage.page).toHaveURL('/')
  })
})
