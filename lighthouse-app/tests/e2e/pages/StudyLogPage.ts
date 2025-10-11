import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export interface SessionData {
  subject?: string
  topic?: string
  duration: number
  concentration?: number
  understanding?: number
  notes?: string
}

export class StudyLogPage extends BasePage {
  private readonly addButton = 'button:has-text("기록 추가")'
  private readonly subjectSelect = '[name="subject"]'
  private readonly topicInput = '[name="topic"]'
  private readonly durationInput = '[name="duration"]'
  private readonly concentrationSlider = '[name="concentration"]'
  private readonly understandingSlider = '[name="understanding"]'
  private readonly notesTextarea = '[name="notes"]'
  private readonly saveButton = 'button:has-text("저장")'
  private readonly sessionCard = '.session-card'
  private readonly totalHoursDisplay = '[data-testid="total-hours"]'

  constructor(page: Page) {
    super(page)
  }

  async goto(): Promise<void> {
    await super.goto('/study')
  }

  /**
   * 새 세션 추가
   */
  async addSession(data: SessionData): Promise<void> {
    // 기록 추가 버튼 클릭 (있는 경우)
    const hasAddButton = await this.page.isVisible(this.addButton)
    if (hasAddButton) {
      await this.page.click(this.addButton)
    }

    // 과목 선택 (있는 경우)
    if (data.subject && (await this.page.isVisible(this.subjectSelect))) {
      await this.page.selectOption(this.subjectSelect, data.subject)
    }

    // 주제 입력 (있는 경우)
    if (data.topic && (await this.page.isVisible(this.topicInput))) {
      await this.page.fill(this.topicInput, data.topic)
    }

    // 학습 시간 입력
    await this.page.fill(this.durationInput, data.duration.toString())

    // 집중도 선택 (있는 경우)
    if (data.concentration && (await this.page.isVisible(this.concentrationSlider))) {
      await this.page.fill(this.concentrationSlider, data.concentration.toString())
    }

    // 이해도 선택 (있는 경우)
    if (data.understanding && (await this.page.isVisible(this.understandingSlider))) {
      await this.page.fill(this.understandingSlider, data.understanding.toString())
    }

    // 메모 입력 (있는 경우)
    if (data.notes && (await this.page.isVisible(this.notesTextarea))) {
      await this.page.fill(this.notesTextarea, data.notes)
    }

    // 저장
    await this.page.click(this.saveButton)

    // 저장 완료 대기
    await this.waitForNoLoadingSpinner()
  }

  /**
   * 오늘의 세션 개수
   */
  async getTodaySessionsCount(): Promise<number> {
    await this.waitForNoLoadingSpinner()
    return await this.page.locator(this.sessionCard).count()
  }

  /**
   * 특정 세션 수정
   */
  async editSession(index: number, updates: Partial<SessionData>): Promise<void> {
    // 세션 카드의 수정 버튼 클릭
    await this.page.click(`${this.sessionCard}:nth-child(${index + 1}) button:has-text("수정")`)

    // 폼에 변경사항 입력
    if (updates.duration) {
      await this.page.fill(this.durationInput, updates.duration.toString())
    }

    if (updates.concentration) {
      await this.page.fill(this.concentrationSlider, updates.concentration.toString())
    }

    // 저장
    await this.page.click(this.saveButton)
    await this.waitForNoLoadingSpinner()
  }

  /**
   * 세션 삭제
   */
  async deleteSession(index: number): Promise<void> {
    // 삭제 버튼 클릭
    await this.page.click(`${this.sessionCard}:nth-child(${index + 1}) button:has-text("삭제")`)

    // 확인 대화상자
    this.page.once('dialog', (dialog) => dialog.accept())

    // 삭제 완료 대기
    await this.waitForNoLoadingSpinner()
  }

  /**
   * 총 학습 시간 확인
   */
  async getTotalHours(): Promise<number> {
    const text = await this.page.textContent(this.totalHoursDisplay)
    const match = text?.match(/(\d+(?:\.\d+)?)/)
    return match ? parseFloat(match[1]) : 0
  }
}
