import { Page, Locator } from '@playwright/test'

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * 페이지 이동
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path)
    await this.waitForPageLoad()
  }

  /**
   * 페이지 로딩 대기
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 요소 표시 대기
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout })
  }

  /**
   * 텍스트로 요소 찾기
   */
  getByTextContent(text: string): Locator {
    return this.page.locator(`text=${text}`)
  }

  /**
   * Role로 요소 찾기
   */
  getByRole(role: string, name?: string): Locator {
    return name
      ? this.page.getByRole(role as any, { name })
      : this.page.getByRole(role as any)
  }

  /**
   * 스크린샷 저장
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    })
  }

  /**
   * 토스트 메시지 확인
   */
  async expectToast(message: string): Promise<void> {
    const toast = this.page.locator('.toast-message', { hasText: message })
    await toast.waitFor({ timeout: 5000 })
  }

  /**
   * 로딩 완료 대기
   */
  async waitForNoLoadingSpinner(): Promise<void> {
    await this.page.waitForSelector('.loading-spinner', {
      state: 'hidden',
      timeout: 10000
    })
  }

  /**
   * 폼 입력
   */
  async fillForm(fields: Record<string, string>): Promise<void> {
    for (const [name, value] of Object.entries(fields)) {
      await this.page.fill(`[name="${name}"]`, value)
    }
  }

  /**
   * 버튼 클릭
   */
  async clickButton(text: string): Promise<void> {
    await this.page.click(`button:has-text("${text}")`)
  }
}
