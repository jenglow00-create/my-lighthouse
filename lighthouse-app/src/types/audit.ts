// 감사 로그 관련 타입 정의

/**
 * 감사 로그 액션
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

/**
 * 감사 로그 엔티티
 */
export type AuditEntity = 'session' | 'subject' | 'reflection' | 'profile' | 'settings'

/**
 * 감사 로그
 */
export interface AuditLog {
  id: string
  timestamp: string          // ISO 8601
  userId: string
  action: AuditAction
  entity: AuditEntity
  entityId: string
  before: unknown | null      // 변경 전 값
  after: unknown | null       // 변경 후 값
  reason?: string            // 선택적 변경 사유
  ipAddress?: string         // 추가 보안 정보
}

/**
 * 감사 로그 필터
 */
export interface AuditLogFilter {
  userId?: string
  entity?: AuditEntity
  action?: AuditAction
  startDate?: string         // YYYY-MM-DD
  endDate?: string           // YYYY-MM-DD
  limit?: number
}

/**
 * 감사 로그 통계
 */
export interface AuditStats {
  totalActions: number
  byAction: Record<AuditAction, number>
  byEntity: Record<AuditEntity, number>
  recentActivity: AuditLog[]
}
