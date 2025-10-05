// IndexedDB 데이터베이스 초기화 및 유틸리티
import { db } from './schema'
import type { StudySession, Reflection, Subject, AuditLog } from '@/types'

/**
 * 데이터베이스 초기화
 *
 * @returns Promise<void>
 * @throws Error - 데이터베이스 초기화 실패 시
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // 데이터베이스 연결 테스트
    await db.open()
    console.log('✅ IndexedDB 초기화 성공:', db.name, 'version', db.verno)
  } catch (error) {
    console.error('❌ IndexedDB 초기화 실패:', error)
    throw new Error('데이터베이스를 초기화할 수 없습니다.')
  }
}

/**
 * 데이터베이스 초기화 (기존 데이터 모두 삭제)
 * 주의: 이 함수는 모든 데이터를 삭제합니다!
 */
export async function resetDatabase(): Promise<void> {
  try {
    await db.delete()
    console.log('🗑️ 데이터베이스 초기화 완료')
    await db.open()
    console.log('✅ 데이터베이스 재생성 완료')
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error)
    throw error
  }
}

/**
 * 데이터베이스 통계 조회
 */
export async function getDatabaseStats() {
  try {
    const [sessionCount, reflectionCount, subjectCount, auditLogCount] = await Promise.all([
      db.sessions.count(),
      db.reflections.count(),
      db.subjects.count(),
      db.auditLogs.count()
    ])

    return {
      sessions: sessionCount,
      reflections: reflectionCount,
      subjects: subjectCount,
      auditLogs: auditLogCount,
      total: sessionCount + reflectionCount + subjectCount + auditLogCount
    }
  } catch (error) {
    console.error('❌ 데이터베이스 통계 조회 실패:', error)
    throw error
  }
}

/**
 * 데이터베이스 상태 확인
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.open()
    return db.isOpen()
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error)
    return false
  }
}

/**
 * 에러 핸들러
 */
export function handleDatabaseError(error: unknown, context: string): never {
  console.error(`❌ 데이터베이스 에러 [${context}]:`, error)

  if (error instanceof Error) {
    throw new Error(`${context}: ${error.message}`)
  }

  throw new Error(`${context}: 알 수 없는 에러`)
}

// DB 인스턴스 export
export { db }

// 타입 export (편의를 위해)
export type {
  StudySession,
  Reflection,
  Subject,
  AuditLog
}
