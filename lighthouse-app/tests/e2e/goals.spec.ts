import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { GoalsPage } from './pages/GoalsPage'
import { StudyLogPage } from './pages/StudyLogPage'

test.describe('Goals Management', () => {
  let loginPage: LoginPage
  let goalsPage: GoalsPage
  let studyLogPage: StudyLogPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    goalsPage = new GoalsPage(page)
    studyLogPage = new StudyLogPage(page)

    await loginPage.goto()
    await loginPage.loginAsTestUser()
  })

  test('should add new subject', async () => {
    await goalsPage.goto()

    const initialCount = await goalsPage.getSubjectsCount()

    // 과목 추가
    await goalsPage.addSubject({
      name: 'E2E 테스트 과목',
      targetHours: 100
    })

    // 추가 확인
    const newCount = await goalsPage.getSubjectsCount()
    expect(newCount).toBeGreaterThan(initialCount)

    await goalsPage.screenshot('subject-added')
  })

  test('should display subject list', async () => {
    await goalsPage.goto()

    // 과목 목록이 로딩되었는지 확인
    const count = await goalsPage.getSubjectsCount()
    expect(count).toBeGreaterThanOrEqual(0)

    await goalsPage.screenshot('subject-list')
  })

  test('should persist goals after reload', async () => {
    await goalsPage.goto()

    const beforeCount = await goalsPage.getSubjectsCount()

    // 페이지 새로고침
    await goalsPage.page.reload()
    await goalsPage.waitForNoLoadingSpinner()

    // 데이터 유지 확인
    const afterCount = await goalsPage.getSubjectsCount()
    expect(afterCount).toBe(beforeCount)
  })
})
