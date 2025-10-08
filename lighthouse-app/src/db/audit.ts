import { db } from './schema'
import type { AuditLog, AuditLogFilter, AuditStats, AuditAction, AuditEntity } from '@/types/audit'

/**
 * 감사 로그 기록
 */
export async function logAudit(
  params: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<string> {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...params
  }

  try {
    await db.auditLogs.add(log)
    console.log('[Audit]', log.action, log.entity, log.entityId)
    return log.id
  } catch (error) {
    console.error('[Audit] Failed to log:', error)
    // 로깅 실패가 메인 작업을 막으면 안 됨
    return ''
  }
}

/**
 * 감사 로그 조회
 */
export async function getAuditLogs(filters?: AuditLogFilter): Promise<AuditLog[]> {
  let query = db.auditLogs.orderBy('timestamp').reverse()

  if (filters?.userId) {
    query = db.auditLogs.where('userId').equals(filters.userId) as any
  }

  if (filters?.entity) {
    query = db.auditLogs.where('entity').equals(filters.entity) as any
  }

  let logs = await query.toArray()

  // 추가 필터링
  if (filters?.action) {
    logs = logs.filter(log => log.action === filters.action)
  }

  if (filters?.startDate && filters?.endDate) {
    logs = logs.filter(
      log => log.timestamp >= filters.startDate! &&
             log.timestamp <= filters.endDate!
    )
  }

  if (filters?.limit) {
    logs = logs.slice(0, filters.limit)
  }

  return logs
}

/**
 * 감사 로그 검색
 */
export async function searchAuditLogs(query: string): Promise<AuditLog[]> {
  const allLogs = await db.auditLogs.toArray()
  const lowerQuery = query.toLowerCase()

  return allLogs.filter(log =>
    log.entityId.toLowerCase().includes(lowerQuery) ||
    log.action.toLowerCase().includes(lowerQuery) ||
    log.entity.toLowerCase().includes(lowerQuery) ||
    log.reason?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * 감사 로그 내보내기 (CSV)
 */
export async function exportAuditLogs(
  startDate: string,
  endDate: string
): Promise<string> {
  const logs = await getAuditLogs({ startDate, endDate })

  // CSV 헤더
  const headers = [
    'ID',
    'Timestamp',
    'User ID',
    'Action',
    'Entity',
    'Entity ID',
    'Before',
    'After',
    'Reason'
  ]

  // CSV 행
  const rows = logs.map(log => [
    log.id,
    log.timestamp,
    log.userId,
    log.action,
    log.entity,
    log.entityId,
    JSON.stringify(log.before || ''),
    JSON.stringify(log.after || ''),
    log.reason || ''
  ])

  // CSV 문자열 생성
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell =>
        typeof cell === 'string' && cell.includes(',')
          ? `"${cell}"`
          : cell
      ).join(',')
    )
  ].join('\n')

  return csv
}

/**
 * 감사 로그 통계
 */
export async function getAuditStats(userId: string): Promise<AuditStats> {
  const logs = await getAuditLogs({ userId, limit: 1000 })

  const byAction = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {} as Record<AuditAction, number>)

  const byEntity = logs.reduce((acc, log) => {
    acc[log.entity] = (acc[log.entity] || 0) + 1
    return acc
  }, {} as Record<AuditEntity, number>)

  return {
    totalActions: logs.length,
    byAction,
    byEntity,
    recentActivity: logs.slice(0, 10)
  }
}

/**
 * 오래된 감사 로그 정리 (90일 이전)
 */
export async function cleanOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  const cutoffTimestamp = cutoffDate.toISOString()

  const oldLogs = await db.auditLogs
    .where('timestamp')
    .below(cutoffTimestamp)
    .toArray()

  await db.auditLogs
    .where('timestamp')
    .below(cutoffTimestamp)
    .delete()

  console.log(`[Audit] Cleaned ${oldLogs.length} old logs`)
  return oldLogs.length
}
