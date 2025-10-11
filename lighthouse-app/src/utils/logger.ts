import { db } from '@/db/schema'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  userId?: string
  page?: string
  stack?: string
}

/**
 * 로거 클래스
 */
class Logger {
  private isDev: boolean
  private maxLogsInDB: number = 1000

  constructor() {
    this.isDev = import.meta.env.DEV
  }

  /**
   * Debug 로그 (개발 환경만)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDev) {
      this.log('debug', message, context)
    }
  }

  /**
   * Info 로그
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  /**
   * Warning 로그
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  /**
   * Error 로그
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack
    })
  }

  /**
   * 공통 로그 메서드
   */
  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
      page: window.location.pathname,
      stack: level === 'error' ? new Error().stack : undefined
    }

    // 콘솔 출력
    this.logToConsole(entry)

    // DB 저장 (프로덕션만, 심각한 로그만)
    if (!this.isDev && (level === 'error' || level === 'warn')) {
      await this.logToDB(entry)
    }
  }

  /**
   * 콘솔 출력
   */
  private logToConsole(entry: LogEntry): void {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[entry.level]

    const style = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444; font-weight: bold'
    }[entry.level]

    const logMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    }[entry.level]

    logMethod(
      `%c${emoji} [${entry.level.toUpperCase()}] ${entry.message}`,
      style,
      entry.context || ''
    )
  }

  /**
   * IndexedDB에 저장
   */
  private async logToDB(entry: LogEntry): Promise<void> {
    try {
      await db.logs.add(entry)

      // 오래된 로그 정리 (최근 1000개만 유지)
      const count = await db.logs.count()
      if (count > this.maxLogsInDB) {
        const oldLogs = await db.logs
          .orderBy('timestamp')
          .limit(count - this.maxLogsInDB)
          .toArray()

        await Promise.all(
          oldLogs.map(log => db.logs.delete(log.id))
        )
      }
    } catch (error) {
      // 로깅 실패는 무시 (무한 루프 방지)
      console.error('[Logger] Failed to save log:', error)
    }
  }

  /**
   * 현재 사용자 ID 가져오기
   */
  private getCurrentUserId(): string | undefined {
    try {
      const userStr = localStorage.getItem('lighthouse-current-user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.id
      }
    } catch {
      return undefined
    }
  }

  /**
   * 모든 로그 조회
   */
  async getLogs(filters?: {
    level?: LogLevel
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<LogEntry[]> {
    try {
      let logs = await db.logs.orderBy('timestamp').reverse().toArray()

      // 레벨 필터
      if (filters?.level) {
        logs = logs.filter(log => log.level === filters.level)
      }

      // 날짜 필터
      if (filters?.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!)
      }
      if (filters?.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!)
      }

      // 개수 제한
      if (filters?.limit) {
        logs = logs.slice(0, filters.limit)
      }

      return logs
    } catch (error) {
      console.error('[Logger] Failed to get logs:', error)
      return []
    }
  }

  /**
   * 로그 내보내기 (JSON)
   */
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs({ limit: 1000 })
    return JSON.stringify(logs, null, 2)
  }

  /**
   * 로그 삭제
   */
  async clearLogs(): Promise<void> {
    try {
      await db.logs.clear()
      this.info('Logs cleared')
    } catch (error) {
      console.error('[Logger] Failed to clear logs:', error)
    }
  }
}

// 싱글톤 인스턴스
export const logger = new Logger()

/**
 * 성능 측정 유틸리티
 */
export class PerformanceLogger {
  private marks: Map<string, number> = new Map()

  /**
   * 측정 시작
   */
  start(label: string): void {
    this.marks.set(label, performance.now())
  }

  /**
   * 측정 종료 및 로깅
   */
  end(label: string): number {
    const startTime = this.marks.get(label)
    if (!startTime) {
      logger.warn(`Performance mark "${label}" not found`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)

    logger.info(`Performance: ${label}`, {
      duration: `${duration.toFixed(2)}ms`
    })

    return duration
  }

  /**
   * 비동기 함수 실행 시간 측정
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      this.end(label)
      return result
    } catch (error) {
      this.end(label)
      throw error
    }
  }
}

export const perfLogger = new PerformanceLogger()
