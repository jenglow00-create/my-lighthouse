import { useUIStore } from '@/store'

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium',
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'NETWORK_ERROR', 'medium', '네트워크 연결을 확인해주세요.')
    this.name = 'NetworkError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 'low', '입력값을 확인해주세요.')
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 'high', '데이터 저장에 실패했습니다.')
    this.name = 'DatabaseError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 'high', '인증에 실패했습니다.')
    this.name = 'AuthenticationError'
  }
}

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
  message: string
  userMessage: string
  severity: 'low' | 'medium' | 'high'
  code: string
  shouldReport: boolean
  shouldRetry: boolean
}

/**
 * 에러 처리 메인 함수
 */
export function handleAsyncError(error: unknown): ErrorInfo {
  // AppError (커스텀 에러)
  if (error instanceof AppError) {
    return {
      message: error.message,
      userMessage: error.userMessage || error.message,
      severity: error.severity,
      code: error.code,
      shouldReport: error.severity === 'high',
      shouldRetry: error instanceof NetworkError
    }
  }

  // DOMException (QuotaExceededError 등)
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return {
        message: 'Storage quota exceeded',
        userMessage: '저장 공간이 부족합니다. 설정에서 데이터를 정리해주세요.',
        severity: 'high',
        code: 'QUOTA_EXCEEDED',
        shouldReport: false,
        shouldRetry: false
      }
    }
  }

  // TypeError (일반적인 JS 에러)
  if (error instanceof TypeError) {
    return {
      message: error.message,
      userMessage: '예상치 못한 오류가 발생했습니다.',
      severity: 'medium',
      code: 'TYPE_ERROR',
      shouldReport: true,
      shouldRetry: false
    }
  }

  // 네트워크 에러 (fetch 실패 등)
  if (error instanceof Error && error.message.includes('fetch')) {
    return {
      message: error.message,
      userMessage: '네트워크 연결을 확인해주세요.',
      severity: 'medium',
      code: 'NETWORK_ERROR',
      shouldReport: false,
      shouldRetry: true
    }
  }

  // 알 수 없는 에러
  const errorMessage = error instanceof Error ? error.message : String(error)
  return {
    message: errorMessage,
    userMessage: '알 수 없는 오류가 발생했습니다.',
    severity: 'medium',
    code: 'UNKNOWN_ERROR',
    shouldReport: true,
    shouldRetry: false
  }
}

/**
 * 에러를 Toast로 표시
 */
export function showErrorToast(error: unknown): void {
  const errorInfo = handleAsyncError(error)
  const { addToast } = useUIStore.getState()

  addToast(errorInfo.userMessage, 'error')

  // 콘솔 로깅
  console.error('[Error]', {
    message: errorInfo.message,
    code: errorInfo.code,
    severity: errorInfo.severity,
    originalError: error
  })

  // 프로덕션에서 심각한 에러는 외부 서비스로 전송
  if (import.meta.env.PROD && errorInfo.shouldReport) {
    reportErrorToService(error, errorInfo)
  }
}

/**
 * 외부 에러 모니터링 서비스로 전송
 */
function reportErrorToService(error: unknown, errorInfo: ErrorInfo): void {
  // Sentry, LogRocket 등
  try {
    // 예시: Sentry
    // Sentry.captureException(error, {
    //   level: errorInfo.severity,
    //   tags: { code: errorInfo.code }
    // });

    console.log('[Reporting]', errorInfo)
  } catch (reportError) {
    console.error('[Report Failed]', reportError)
  }
}

/**
 * 재시도 로직 (exponential backoff)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      const errorInfo = handleAsyncError(error)

      // 재시도 불가능한 에러면 즉시 throw
      if (!errorInfo.shouldRetry) {
        throw error
      }

      // 마지막 시도면 throw
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Exponential backoff 대기
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * 전역 에러 핸들러 초기화
 */
export function initializeErrorHandling(): void {
  // Unhandled Promise Rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)

    event.preventDefault() // 기본 에러 표시 방지
    showErrorToast(event.reason)
  })

  // 전역 에러
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error)

    // ErrorBoundary가 잡을 수 있는 에러는 여기서 처리 안 함
    if (event.error instanceof Error && event.error.stack) {
      return
    }

    showErrorToast(event.error)
  })

  console.log('[Error Handling] Initialized')
}
