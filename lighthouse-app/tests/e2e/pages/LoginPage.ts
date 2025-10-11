import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  // 선택자 (private)
  private readonly usernameInput = '[name="username"]'
  private readonly passwordInput = '[name="password"]'
  private readonly loginButton = 'button:has-text("로그인")'
  private readonly errorMessage = '.error-message'

  constructor(page: Page) {
    super(page)
  }

  /**
   * 로그인 페이지로 이동
   */
  async goto(): Promise<void> {
    await super.goto('/')
  }

  /**
   * 로그인 수행
   */
  async login(username: string, password: string): Promise<void> {
    await this.page.fill(this.usernameInput, username)
    await this.page.fill(this.passwordInput, password)
    await this.page.click(this.loginButton)

    // 로그인 완료 대기
    await this.waitForNoLoadingSpinner()
  }

  /**
   * 테스트 계정 로그인
   */
  async loginAsTestUser(): Promise<void> {
    await this.login('1', '1')
  }

  /**
   * 로그인 폼 표시 확인
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.page.isVisible(this.loginButton)
  }

  /**
   * 에러 메시지 확인
   */
  async getErrorMessage(): Promise<string> {
    return (await this.page.textContent(this.errorMessage)) || ''
  }
}
