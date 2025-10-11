import { Page, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
  private readonly pageTitle = 'h1:has-text("대시보드")'
  private readonly totalHoursCard = '[data-testid="total-hours"]'
  private readonly weeklyStatsSection = '[data-testid="weekly-stats"]'
  private readonly recentReflections = '[data-testid="recent-reflections"]'

  constructor(page: Page) {
    super(page)
  }

  async goto(): Promise<void> {
    await super.goto('/')
  }

  /**
   * 대시보드 로딩 확인
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForElement(this.pageTitle, 10000)
      return await this.page.isVisible(this.pageTitle)
    } catch {
      return false
    }
  }

  /**
   * 총 학습 시간 가져오기
   */
  async getTotalHours(): Promise<number> {
    const text = await this.page.textContent(this.totalHoursCard)
    const match = text?.match(/(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
  }

  /**
   * 주간 통계 확인
   */
  async getWeeklyStats(): Promise<{
    sessions: number
    hours: number
    avgConcentration: number
  }> {
    const section = this.page.locator(this.weeklyStatsSection)

    const sessionsText = await section.locator('[data-stat="sessions"]').textContent()
    const hoursText = await section.locator('[data-stat="hours"]').textContent()
    const concentrationText = await section
      .locator('[data-stat="concentration"]')
      .textContent()

    return {
      sessions: parseInt(sessionsText?.match(/\d+/)?.[0] || '0'),
      hours: parseFloat(hoursText?.match(/[\d.]+/)?.[0] || '0'),
      avgConcentration: parseFloat(concentrationText?.match(/[\d.]+/)?.[0] || '0')
    }
  }

  /**
   * 최근 성찰 개수 확인
   */
  async getRecentReflectionsCount(): Promise<number> {
    const reflections = await this.page
      .locator(`${this.recentReflections} .reflection-card`)
      .count()
    return reflections
  }

  /**
   * 특정 과목 카드 클릭
   */
  async clickSubjectCard(subjectName: string): Promise<void> {
    await this.page.click(`.subject-card:has-text("${subjectName}")`)
  }
}
