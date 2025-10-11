import { useState, useEffect, useMemo, useCallback } from 'react'
import { List } from 'react-window'
import { db } from '@/db/schema'
import type { LogEntry } from '@/utils/logger'
import { logger } from '@/utils/logger'
import Navigation from '@/components/Navigation'
import '../styles/LogViewer.css'

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [pageFilter, setPageFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // 로그 불러오기
  useEffect(() => {
    loadLogs()
  }, [])

  // 로그 불러오기 (useCallback으로 최적화)
  const loadLogs = useCallback(async () => {
    try {
      const allLogs = await db.logs.orderBy('timestamp').reverse().toArray()
      setLogs(allLogs)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load logs:', error)
      logger.error('Failed to load logs', error as Error)
      setLoading(false)
    }
  }, [])

  // 필터링 (useMemo로 최적화)
  const filteredLogsData = useMemo(() => {
    let filtered = [...logs]

    // 레벨 필터
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    // 페이지 필터
    if (pageFilter !== 'all') {
      filtered = filtered.filter(log => log.page === pageFilter)
    }

    // 검색
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        JSON.stringify(log.context).toLowerCase().includes(term)
      )
    }

    return filtered
  }, [logs, levelFilter, searchTerm, pageFilter])

  // filteredLogs state를 useMemo 결과로 동기화
  useEffect(() => {
    setFilteredLogs(filteredLogsData)
  }, [filteredLogsData])

  const exportLogs = useCallback(() => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `lighthouse-logs-${new Date().toISOString()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    logger.info('Logs exported', { count: filteredLogs.length })
  }, [filteredLogs])

  const clearLogs = useCallback(async () => {
    if (confirm('모든 로그를 삭제하시겠습니까?')) {
      try {
        await db.logs.clear()
        setLogs([])
        logger.info('All logs cleared')
      } catch (error) {
        console.error('Failed to clear logs:', error)
        logger.error('Failed to clear logs', error as Error)
      }
    }
  }, [])

  const generateTestLogs = useCallback(() => {
    logger.debug('Test debug message', { test: true })
    logger.info('Test info message', { test: true })
    logger.warn('Test warning message', { test: true })
    logger.error('Test error message', new Error('Test error'))

    // 로그 새로고침
    setTimeout(() => loadLogs(), 100)
  }, [loadLogs])

  // 고유 페이지 목록 (useMemo로 최적화)
  const uniquePages = useMemo(
    () => Array.from(new Set(logs.map(log => log.page).filter(Boolean))),
    [logs]
  )

  // 로그 레벨별 색상
  const getLevelColor = useCallback((level: string): string => {
    switch (level) {
      case 'debug': return 'var(--color-text-secondary)'
      case 'info': return 'var(--color-primary)'
      case 'warn': return 'var(--color-warning)'
      case 'error': return 'var(--color-danger)'
      default: return 'var(--color-text)'
    }
  }, [])

  // 로그 레벨별 이모지
  const getLevelEmoji = useCallback((level: string): string => {
    switch (level) {
      case 'debug': return '🔍'
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      default: return '📝'
    }
  }, [])

  // react-window용 로그 행 렌더링 컴포넌트
  const LogRow = useCallback(({ index }: { index: number }) => {
    const log = filteredLogs[index]

    return (
      <div className={`log-entry log-level-${log.level}`}>
        <div className="log-entry-header">
          <span className="log-level" style={{ color: getLevelColor(log.level) }}>
            {getLevelEmoji(log.level)} {log.level.toUpperCase()}
          </span>
          <span className="log-timestamp">
            {new Date(log.timestamp).toLocaleString('ko-KR')}
          </span>
          {log.page && (
            <span className="log-page">📄 {log.page}</span>
          )}
          {log.userId && (
            <span className="log-user">👤 {log.userId}</span>
          )}
        </div>

        <div className="log-message">{log.message}</div>

        {log.error && (
          <details className="log-error-details">
            <summary>에러 상세</summary>
            <pre>{log.error}</pre>
          </details>
        )}

        {log.context && Object.keys(log.context).length > 0 && (
          <details className="log-context-details">
            <summary>컨텍스트</summary>
            <pre>{JSON.stringify(log.context, null, 2)}</pre>
          </details>
        )}
      </div>
    )
  }, [filteredLogs, getLevelColor, getLevelEmoji])

  return (
    <div className="log-viewer">
      <Navigation />

      <div className="log-viewer-container">
        <header className="log-viewer-header">
          <h1>📋 로그 뷰어</h1>
          <p>시스템 로그를 확인하고 관리합니다</p>
        </header>

        <div className="log-controls">
          <div className="log-filters">
            {/* 레벨 필터 */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="log-filter-select"
            >
              <option value="all">모든 레벨</option>
              <option value="debug">🔍 Debug</option>
              <option value="info">ℹ️ Info</option>
              <option value="warn">⚠️ Warn</option>
              <option value="error">❌ Error</option>
            </select>

            {/* 페이지 필터 */}
            <select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className="log-filter-select"
            >
              <option value="all">모든 페이지</option>
              {uniquePages.map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>

            {/* 검색 */}
            <input
              type="text"
              placeholder="로그 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="log-search-input"
            />
          </div>

          <div className="log-actions">
            <button onClick={generateTestLogs} className="btn-secondary">
              테스트 로그 생성
            </button>
            <button onClick={exportLogs} className="btn-primary">
              내보내기 ({filteredLogs.length})
            </button>
            <button onClick={clearLogs} className="btn-danger">
              전체 삭제
            </button>
          </div>
        </div>

        <div className="log-stats">
          <div className="stat-item">
            <span className="stat-label">전체 로그:</span>
            <span className="stat-value">{logs.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">필터링된 로그:</span>
            <span className="stat-value">{filteredLogs.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">🔍 Debug:</span>
            <span className="stat-value">{logs.filter(l => l.level === 'debug').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ℹ️ Info:</span>
            <span className="stat-value">{logs.filter(l => l.level === 'info').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">⚠️ Warn:</span>
            <span className="stat-value">{logs.filter(l => l.level === 'warn').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">❌ Error:</span>
            <span className="stat-value">{logs.filter(l => l.level === 'error').length}</span>
          </div>
        </div>

        {loading ? (
          <div className="log-loading">로그를 불러오는 중...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="log-empty">
            <p>로그가 없습니다.</p>
            <button onClick={generateTestLogs} className="btn-primary">
              테스트 로그 생성
            </button>
          </div>
        ) : filteredLogs.length >= 100 ? (
          // 100개 이상일 때 가상화 리스트 사용
          <div className="log-list-virtualized" style={{ height: 'calc(100vh - 450px)', minHeight: '400px' }}>
            <List
              defaultHeight={Math.max(400, window.innerHeight - 450)}
              rowCount={filteredLogs.length}
              rowHeight={180}
              rowComponent={LogRow}
              overscanCount={5}
            />
          </div>
        ) : (
          // 100개 미만일 때 일반 렌더링
          <div className="log-list">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`log-entry log-level-${log.level}`}
              >
                <div className="log-entry-header">
                  <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                    {getLevelEmoji(log.level)} {log.level.toUpperCase()}
                  </span>
                  <span className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString('ko-KR')}
                  </span>
                  {log.page && (
                    <span className="log-page">📄 {log.page}</span>
                  )}
                  {log.userId && (
                    <span className="log-user">👤 {log.userId}</span>
                  )}
                </div>

                <div className="log-message">{log.message}</div>

                {log.error && (
                  <details className="log-error-details">
                    <summary>에러 상세</summary>
                    <pre>{log.error}</pre>
                  </details>
                )}

                {log.context && Object.keys(log.context).length > 0 && (
                  <details className="log-context-details">
                    <summary>컨텍스트</summary>
                    <pre>{JSON.stringify(log.context, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
