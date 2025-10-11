import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',

  // 테스트 타임아웃
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  // 병렬 실행
  fullyParallel: true,

  // 실패 시 재시도
  retries: process.env.CI ? 2 : 0,

  // 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  // 공통 설정
  use: {
    baseURL: 'http://localhost:5000',

    // 스크린샷
    screenshot: 'only-on-failure',

    // 비디오
    video: 'retain-on-failure',

    // 트레이스
    trace: 'on-first-retry',

    // 뷰포트
    viewport: { width: 1280, height: 720 },

    // 로케일
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',

    // 네비게이션 타임아웃
    navigationTimeout: 30000,

    // 액션 타임아웃
    actionTimeout: 10000
  },

  // 프로젝트 (브라우저별)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }

    // Firefox와 WebKit은 나중에 추가
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // },

    // 모바일
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] }
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] }
    // }
  ],

  // 개발 서버
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
})
