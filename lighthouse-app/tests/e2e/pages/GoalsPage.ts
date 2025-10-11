import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export interface SubjectData {
  name: string
  examType?: string
  targetHours: number
  targetScore?: number
  examDate?: string
}

export class GoalsPage extends BasePage {
  private readonly addSubjectButton = 'button:has-text("과목 추가")'
  private readonly subjectCard = '.subject-card'
  private readonly subjectForm = '.subject-form'
  private readonly nameInput = '[name="name"]'
  private readonly examTypeSelect = '[name="examType"]'
  private readonly targetHoursInput = '[name="targetHours"]'
  private readonly targetScoreInput = '[name="targetScore"]'
  private readonly examDateInput = '[name="examDate"]'
  private readonly saveButton = 'button:has-text("저장")'

  constructor(page: Page) {
    super(page)
  }

  async goto(): Promise<void> {
    await super.goto('/goals')
  }

  /**
   * 새 과목 추가
   */
  async addSubject(data: SubjectData): Promise<void> {
    // 과목 추가 버튼 클릭
    const hasAddButton = await this.page.isVisible(this.addSubjectButton)
    if (hasAddButton) {
      await this.page.click(this.addSubjectButton)
      await this.waitForElement(this.subjectForm)
    }

    // 과목명 입력
    await this.page.fill(this.nameInput, data.name)

    // 시험 유형 선택 (있는 경우)
    if (data.examType && (await this.page.isVisible(this.examTypeSelect))) {
      await this.page.selectOption(this.examTypeSelect, data.examType)
    }

    // 목표 시간 입력
    await this.page.fill(this.targetHoursInput, data.targetHours.toString())

    // 목표 점수 (선택)
    if (data.targetScore && (await this.page.isVisible(this.targetScoreInput))) {
      await this.page.fill(this.targetScoreInput, data.targetScore.toString())
    }

    // 시험일 (선택)
    if (data.examDate && (await this.page.isVisible(this.examDateInput))) {
      await this.page.fill(this.examDateInput, data.examDate)
    }

    // 저장
    await this.page.click(this.saveButton)
    await this.waitForNoLoadingSpinner()
  }

  /**
   * 과목 개수 확인
   */
  async getSubjectsCount(): Promise<number> {
    await this.waitForNoLoadingSpinner()
    return await this.page.locator(this.subjectCard).count()
  }

  /**
   * 특정 과목의 진도율 확인
   */
  async getSubjectProgress(subjectName: string): Promise<number> {
    const card = this.page.locator(`${this.subjectCard}:has-text("${subjectName}")`)
    const progressText = await card.locator('[data-testid="progress"]').textContent()
    const match = progressText?.match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  /**
   * 과목 삭제
   */
  async deleteSubject(subjectName: string): Promise<void> {
    const card = this.page.locator(`${this.subjectCard}:has-text("${subjectName}")`)
    await card.locator('button:has-text("삭제")').click()

    // 확인
    this.page.once('dialog', (dialog) => dialog.accept())
    await this.waitForNoLoadingSpinner()
  }

  /**
   * 특정 과목 카드 클릭
   */
  async clickSubject(subjectName: string): Promise<void> {
    await this.page.click(`${this.subjectCard}:has-text("${subjectName}")`)
  }
}
