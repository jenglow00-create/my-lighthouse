import { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallbackComponent?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // 에러 리포트 전송 (선택)
    this.props.onError?.(error, errorInfo)

    // Sentry 등 모니터링 서비스 전송
    if (import.meta.env.PROD) {
      // reportErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 폴백 UI
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent(this.state.error, this.handleReset)
      }

      // 기본 폴백 UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// 기본 폴백 컴포넌트
function DefaultErrorFallback({
  error,
  errorInfo,
  onReset
}: {
  error: Error
  errorInfo: ErrorInfo | null
  onReset: () => void
}) {
  const isDev = import.meta.env.DEV

  const getErrorMessage = (error: Error): string => {
    const errorName = error.name.toLowerCase()
    const errorMessage = error.message.toLowerCase()

    // ChunkLoadError (빌드 파일 로드 실패)
    if (errorName.includes('chunk') || errorMessage.includes('chunk')) {
      return '앱 업데이트가 있습니다. 새로고침해주세요.'
    }

    // QuotaExceededError (저장 공간 부족)
    if (errorName.includes('quota') || errorMessage.includes('quota')) {
      return '저장 공간이 부족합니다. 설정에서 데이터를 정리해주세요.'
    }

    // NetworkError
    if (errorName.includes('network') || errorMessage.includes('network')) {
      return '네트워크 연결을 확인해주세요.'
    }

    // IndexedDB Error
    if (errorMessage.includes('indexeddb') || errorMessage.includes('idb')) {
      return '데이터 접근 오류입니다. 브라우저 설정을 확인해주세요.'
    }

    return '예상치 못한 오류가 발생했습니다.'
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="error-boundary-fallback">
      <div className="error-content">
        <div className="error-icon">😵</div>
        <h1>앗! 문제가 발생했습니다</h1>
        <p className="error-message">{errorMessage}</p>

        <div className="error-actions">
          <button className="btn-primary" onClick={onReset}>
            다시 시도
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.location.href = '/'}
          >
            홈으로 돌아가기
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>

        {isDev && (
          <details className="error-details">
            <summary>개발자 정보 (프로덕션에서는 숨김)</summary>
            <pre className="error-stack">
              <strong>Error:</strong> {error.toString()}
              {'\n\n'}
              <strong>Stack:</strong>
              {'\n'}
              {error.stack}
              {'\n\n'}
              <strong>Component Stack:</strong>
              {'\n'}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}

        <p className="error-help">
          문제가 계속되면 문의해주세요.
        </p>
      </div>
    </div>
  )
}

// 페이지별 에러 폴백
export function PageErrorFallback({
  pageName,
  error,
  onReset
}: {
  pageName: string
  error: Error
  onReset: () => void
}) {
  return (
    <div className="page-error-fallback">
      <div className="error-icon">😵</div>
      <h2>{pageName} 페이지를 불러올 수 없습니다</h2>
      <p>{error.message}</p>
      <button className="btn-primary" onClick={onReset}>
        다시 시도
      </button>
    </div>
  )
}
