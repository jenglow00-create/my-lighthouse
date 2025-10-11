import { onCLS, onLCP, onTTFB, onFCP, onINP } from 'web-vitals'
import { logger } from './logger'
import { db } from '@/db/schema'

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: string
  page: string
  delta?: number
}

/**
 * Web Vitals 모니터링 초기화
 */
export function initializePerformanceMonitoring(): void {
  // LCP (Largest Contentful Paint)
  onLCP((metric) => {
    reportMetric('LCP', metric.value, metric.delta, metric.rating)
  })

  // CLS (Cumulative Layout Shift)
  onCLS((metric) => {
    reportMetric('CLS', metric.value, metric.delta, metric.rating)
  })

  // TTFB (Time to First Byte)
  onTTFB((metric) => {
    reportMetric('TTFB', metric.value, metric.delta, metric.rating)
  })

  // FCP (First Contentful Paint)
  onFCP((metric) => {
    reportMetric('FCP', metric.value, metric.delta, metric.rating)
  })

  // INP (Interaction to Next Paint) - FID 대체
  onINP((metric) => {
    reportMetric('INP', metric.value, metric.delta, metric.rating)
  })

  logger.info('Performance monitoring initialized')
}

/**
 * 메트릭 리포트
 */
async function reportMetric(
  name: string,
  value: number,
  delta: number | undefined,
  rating: 'good' | 'needs-improvement' | 'poor'
): Promise<void> {
  const metric: PerformanceMetric = {
    id: crypto.randomUUID(),
    name,
    value,
    rating,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    delta
  }

  // 로깅
  logger.info(`Performance: ${name}`, {
    value: `${value.toFixed(2)}ms`,
    rating,
    page: metric.page
  })

  // DB 저장 (프로덕션만)
  if (import.meta.env.PROD) {
    try {
      await db.performanceMetrics.add(metric)

      // 오래된 메트릭 정리 (최근 1000개만)
      const count = await db.performanceMetrics.count()
      if (count > 1000) {
        const oldMetrics = await db.performanceMetrics
          .orderBy('timestamp')
          .limit(count - 1000)
          .toArray()

        await Promise.all(
          oldMetrics.map(m => db.performanceMetrics.delete(m.id))
        )
      }
    } catch (error) {
      console.error('[Performance] Failed to save metric:', error)
    }
  }

  // 성능 문제 감지
  if (rating === 'poor') {
    logger.warn(`Poor ${name} performance detected`, {
      value: `${value.toFixed(2)}ms`,
      page: metric.page
    })

    // 사용자에게 알림 (선택적)
    if (name === 'LCP' && value > 4000) {
      // 4초 이상 걸리면 심각
      console.warn('Page load is very slow. Consider optimization.')
    }
  }
}

/**
 * 커스텀 성능 측정
 */
export class CustomPerformanceMonitor {
  private marks: Map<string, number> = new Map()

  /**
   * 측정 시작
   */
  start(label: string): void {
    this.marks.set(label, performance.now())
    performance.mark(`${label}-start`)
  }

  /**
   * 측정 종료
   */
  async end(label: string): Promise<number> {
    const startTime = this.marks.get(label)
    if (!startTime) {
      logger.warn(`Performance mark "${label}" not found`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)

    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)

    // 로깅
    logger.debug(`Custom Performance: ${label}`, {
      duration: `${duration.toFixed(2)}ms`
    })

    // DB 저장
    if (import.meta.env.PROD && duration > 100) {
      // 100ms 이상만 저장
      const rating = this.getRating(label, duration)

      await reportMetric(label, duration, undefined, rating)
    }

    return duration
  }

  /**
   * 비동기 함수 측정
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      await this.end(label)
      return result
    } catch (error) {
      await this.end(label)
      throw error
    }
  }

  /**
   * 레이팅 계산
   */
  private getRating(
    label: string,
    duration: number
  ): 'good' | 'needs-improvement' | 'poor' {
    // 커스텀 임계값 (레이블별)
    const thresholds: Record<string, { good: number; poor: number }> = {
      'page-load': { good: 1000, poor: 3000 },
      'component-render': { good: 50, poor: 200 },
      'db-query': { good: 100, poor: 500 },
      'api-call': { good: 200, poor: 1000 }
    }

    const threshold = thresholds[label] || { good: 100, poor: 500 }

    if (duration <= threshold.good) return 'good'
    if (duration <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }
}

export const perfMonitor = new CustomPerformanceMonitor()

/**
 * 성능 메트릭 조회
 */
export async function getPerformanceMetrics(filters?: {
  name?: string
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<PerformanceMetric[]> {
  try {
    let metrics = await db.performanceMetrics.orderBy('timestamp').reverse().toArray()

    // 이름 필터
    if (filters?.name) {
      metrics = metrics.filter(m => m.name === filters.name)
    }

    // 날짜 필터
    if (filters?.startDate) {
      metrics = metrics.filter(m => m.timestamp >= filters.startDate!)
    }
    if (filters?.endDate) {
      metrics = metrics.filter(m => m.timestamp <= filters.endDate!)
    }

    // 개수 제한
    if (filters?.limit) {
      metrics = metrics.slice(0, filters.limit)
    }

    return metrics
  } catch (error) {
    console.error('[Performance] Failed to get metrics:', error)
    return []
  }
}

/**
 * 성능 통계 계산
 */
export async function getPerformanceStats(
  name?: string
): Promise<{
  name: string
  count: number
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  goodCount: number
  poorCount: number
}> {
  const metrics = await getPerformanceMetrics({ name, limit: 1000 })

  if (metrics.length === 0) {
    return {
      name: name || 'All',
      count: 0,
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      goodCount: 0,
      poorCount: 0
    }
  }

  const values = metrics.map(m => m.value).sort((a, b) => a - b)
  const sum = values.reduce((acc, v) => acc + v, 0)

  return {
    name: name || 'All',
    count: metrics.length,
    avg: sum / values.length,
    min: values[0],
    max: values[values.length - 1],
    p50: values[Math.floor(values.length * 0.5)],
    p95: values[Math.floor(values.length * 0.95)],
    goodCount: metrics.filter(m => m.rating === 'good').length,
    poorCount: metrics.filter(m => m.rating === 'poor').length
  }
}

/**
 * 최적화 제안
 */
export async function getOptimizationSuggestions(): Promise<string[]> {
  const suggestions: string[] = []

  // LCP 체크
  const lcpStats = await getPerformanceStats('LCP')
  if (lcpStats.count > 0 && lcpStats.avg > 2500) {
    suggestions.push(
      '⚠️ 페이지 로딩이 느립니다. 이미지 최적화를 고려하세요.'
    )
  }

  // CLS 체크
  const clsStats = await getPerformanceStats('CLS')
  if (clsStats.count > 0 && clsStats.avg > 0.1) {
    suggestions.push(
      '⚠️ 레이아웃 이동이 많습니다. 이미지에 width/height를 명시하세요.'
    )
  }

  // INP 체크
  const inpStats = await getPerformanceStats('INP')
  if (inpStats.count > 0 && inpStats.avg > 200) {
    suggestions.push(
      '⚠️ 인터랙션 응답이 느립니다. JavaScript 실행 시간을 줄이세요.'
    )
  }

  // 커스텀 메트릭 체크
  const dbStats = await getPerformanceStats('db-query')
  if (dbStats.count > 0 && dbStats.avg > 200) {
    suggestions.push(
      '⚠️ 데이터베이스 쿼리가 느립니다. 인덱스를 추가하세요.'
    )
  }

  if (suggestions.length === 0) {
    suggestions.push('✅ 성능이 양호합니다!')
  }

  return suggestions
}
