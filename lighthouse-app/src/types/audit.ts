// 감사 로그 타입 정의

/** 감사 로그 액션 타입 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'read'

/** 감사 로그 엔티티 타입 */
export type AuditEntity =
  | 'session'
  | 'reflection'
  | 'subject'
  | 'user'
  | 'goal'

/** 감사 로그 */
export interface AuditLog {
  id: string                    // UUID
  timestamp: string             // ISO 8601
  userId: string                // 사용자 ID (익명화된 ID)
  entity: AuditEntity          // 엔티티 타입
  entityId: string             // 엔티티 ID
  action: AuditAction          // 액션
  changes?: Record<string, any> // 변경 내용 (선택적)
  metadata?: Record<string, any> // 메타데이터 (선택적)
}

/** 감사 로그 필터 */
export interface AuditLogFilter {
  startDate?: string           // YYYY-MM-DD
  endDate?: string             // YYYY-MM-DD
  userId?: string
  entity?: AuditEntity
  action?: AuditAction
}

/** 감사 로그 통계 */
export interface AuditLogStats {
  totalCount: number
  actionBreakdown: Record<AuditAction, number>
  entityBreakdown: Record<AuditEntity, number>
  recentLogs: AuditLog[]
}
