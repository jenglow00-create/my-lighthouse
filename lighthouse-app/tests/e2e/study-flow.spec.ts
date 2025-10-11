import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { StudyLogPage } from './pages/StudyLogPage'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Study Flow', () => {
  let loginPage: LoginPage
  let studyLogPage: StudyLogPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    studyLogPage = new StudyLogPage(page)
    dashboardPage = new DashboardPage(page)

    // 로그인
    await loginPage.goto()
    await loginPage.loginAsTestUser()
  })

  test('should add new study session', async () => {
    // 학습 기록 페이지로 이동
    await studyLogPage.goto()

    // 기존 세션 수 확인
    const initialCount = await studyLogPage.getTodaySessionsCount()

    // 새 세션 추가
    await studyLogPage.addSession({
      duration: 2.5,
      concentration: 4,
      understanding: 4,
      notes: 'E2E 테스트 세션'
    })

    // 세션이 추가되었는지 확인
    const newCount = await studyLogPage.getTodaySessionsCount()
    expect(newCount).toBeGreaterThan(initialCount)

    // 스크린샷
    await studyLogPage.screenshot('session-added')
  })

  test('should persist data after page reload', async () => {
    await studyLogPage.goto()

    // 세션 추가
    await studyLogPage.addSession({
      duration: 1.5,
      concentration: 4,
      understanding: 3,
      notes: '데이터 영속성 테스트'
    })

    const beforeCount = await studyLogPage.getTodaySessionsCount()

    // 페이지 새로고침
    await studyLogPage.page.reload()
    await studyLogPage.waitForNoLoadingSpinner()

    // 데이터 유지 확인
    const afterCount = await studyLogPage.getTodaySessionsCount()
    expect(afterCount).toBe(beforeCount)
  })

  test('should navigate between pages', async () => {
    // 대시보드에서 시작
    await dashboardPage.goto()
    expect(await dashboardPage.isLoaded()).toBeTruthy()

    // 학습 기록으로 이동
    await studyLogPage.page.click('nav a:has-text("학습")')
    await expect(studyLogPage.page).toHaveURL(/\/study/)

    // 다시 대시보드로
    await studyLogPage.page.click('nav a:has-text("대시보드")')
    await expect(dashboardPage.page).toHaveURL('/')
  })
})
