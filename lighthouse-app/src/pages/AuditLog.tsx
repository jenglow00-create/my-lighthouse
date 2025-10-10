import { useState, useEffect } from 'react'
import { getAuditLogs, getAuditStats, exportAuditLogs, cleanOldAuditLogs } from '@/db/audit'
import type { AuditLog, AuditStats } from '@/types/audit'
import { FileDown, Trash2, Activity } from 'lucide-react'

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState({
    entity: '',
    action: '',
    limit: 50
  })

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    setIsLoading(true)
    try {
      const [auditLogs, auditStats] = await Promise.all([
        getAuditLogs({
          entity: filter.entity || undefined as any,
          action: filter.action || undefined as any,
          limit: filter.limit
        }),
        getAuditStats('') // TODO: 현재 사용자 ID
      ])
      setLogs(auditLogs)
      setStats(auditStats)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleExport() {
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const csv = await exportAuditLogs(
        sevenDaysAgo.toISOString(),
        now.toISOString()
      )

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${now.toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      alert('내보내기 실패')
    }
  }

  async function handleCleanOld() {
    if (!confirm('90일 이전의 감사 로그를 삭제하시겠습니까?')) return

    try {
      const deleted = await cleanOldAuditLogs(90)
      alert(`${deleted}개의 로그가 삭제되었습니다.`)
      loadData()
    } catch (error) {
      console.error('Failed to clean old logs:', error)
      alert('삭제 실패')
    }
  }

  const actionColors: Record<string, string> = {
    create: 'text-green-600',
    update: 'text-blue-600',
    delete: 'text-red-600',
    read: 'text-gray-600'
  }

  return (
    <main className="audit-log-page" style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          <Activity size={32} style={{ display: 'inline', marginRight: '0.5rem' }} />
          감사 로그
        </h1>

        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>총 활동</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalActions}</div>
            </div>
            {Object.entries(stats.byAction).map(([action, count]) => (
              <div key={action} style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{action}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{count}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filter.entity}
            onChange={(e) => setFilter(f => ({ ...f, entity: e.target.value }))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">모든 엔티티</option>
            <option value="session">Session</option>
            <option value="subject">Subject</option>
            <option value="reflection">Reflection</option>
            <option value="user">User</option>
          </select>

          <select
            value={filter.action}
            onChange={(e) => setFilter(f => ({ ...f, action: e.target.value }))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">모든 작업</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>

          <select
            value={filter.limit}
            onChange={(e) => setFilter(f => ({ ...f, limit: Number(e.target.value) }))}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="50">50개</option>
            <option value="100">100개</option>
            <option value="200">200개</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleExport}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileDown size={16} />
              CSV 내보내기
            </button>
            <button
              onClick={handleCleanOld}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Trash2 size={16} />
              오래된 로그 삭제
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>시간</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>작업</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>엔티티</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>엔티티 ID</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>변경 사항</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem' }}>
                    {new Date(log.timestamp).toLocaleString('ko-KR')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={actionColors[log.action] || ''} style={{ fontWeight: '600' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{log.entity}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{log.entityId}</td>
                  <td style={{ padding: '1rem' }}>
                    {log.before && (
                      <details style={{ marginBottom: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#6b7280' }}>이전</summary>
                        <pre style={{
                          fontSize: '0.75rem',
                          background: '#f9fafb',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          marginTop: '0.5rem',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.after && (
                      <details style={{ marginBottom: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#6b7280' }}>이후</summary>
                        <pre style={{
                          fontSize: '0.75rem',
                          background: '#f0fdf4',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          marginTop: '0.5rem',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.reason && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                        사유: {log.reason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              감사 로그가 없습니다.
            </div>
          )}
        </div>
      )}
    </main>
  )
}
