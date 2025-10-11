import { logger } from './logger';

/**
 * HTTPS 강제 (프로덕션만)
 */
export function enforceHttps(): void {
  if (import.meta.env.PROD && window.location.protocol !== 'https:') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
}

/**
 * Mixed Content 감지
 */
export function detectMixedContent(): void {
  if (import.meta.env.PROD && window.location.protocol === 'https:') {
    // HTTP 리소스 로딩 감지
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;

        if (resource.name.startsWith('http:')) {
          console.warn('[Mixed Content] Insecure resource:', resource.name);

          // 모니터링 서비스로 전송
          logger.warn('Mixed content detected', {
            resource: resource.name
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

/**
 * CSP 위반 사항 수집
 */
export function initializeCSPReporter(): void {
  document.addEventListener('securitypolicyviolation', (e) => {
    const violation = {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      effectiveDirective: e.effectiveDirective,
      originalPolicy: e.originalPolicy,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
      columnNumber: e.columnNumber,
      timestamp: new Date().toISOString()
    };

    // 로깅
    console.error('[CSP Violation]', violation);
    logger.error('CSP Violation', violation);

    // 프로덕션에서는 외부 서비스로 전송
    if (import.meta.env.PROD) {
      reportCSPViolation(violation);
    }
  });
}

async function reportCSPViolation(violation: any): Promise<void> {
  try {
    // 외부 모니터링 서비스로 전송 (향후 서버 추가 시)
    // await fetch('/api/csp-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(violation)
    // });

    // 현재는 로그만
    logger.error('CSP Violation reported', violation);
  } catch (error) {
    console.error('[CSP Reporter] Failed to send report:', error);
  }
}
