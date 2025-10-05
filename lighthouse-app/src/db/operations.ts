// IndexedDB CRUD 작업 함수들
import { db } from './schema'
import type { StudySession, Reflection, Subject, AuditLog, Rating, DailyStats, WeeklyStats } from '@/types'

// ============================================================================
// Sessions 관련 함수
// ============================================================================

/**
 * 새 학습 세션 생성
 *
 * @param session - 학습 세션 데이터 (id, timestamp 제외)
 * @returns 생성된 세션 ID
 * @throws {Error} 세션 저장 실패 시
 */
export async function createSession(
  session: Omit<StudySession, 'id' | 'timestamp'>
): Promise<string> {
  try {
    const newSession: StudySession = {
      ...session,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }

    await db.sessions.add(newSession)
    console.log('✅ Session 생성:', newSession.id)

    // 감사 로그 추가
    await createAuditLog({
      entity: 'session',
      entityId: String(newSession.id),
      action: 'create',
      metadata: { subjectId: session.subjectId, duration: session.duration }
    })

    return String(newSession.id)
  } catch (error) {
    console.error('❌ Session 생성 실패:', error)
    throw new Error('학습 세션 저장에 실패했습니다.')
  }
}

/**
 * 특정 날짜의 세션 조회
 *
 * @param date - YYYY-MM-DD 형식의 날짜
 * @returns 해당 날짜의 모든 세션
 */
export async function getSessionsByDate(date: string): Promise<StudySession[]> {
  try {
    return await db.sessions.where('date').equals(date).toArray()
  } catch (error) {
    console.error('❌ Session 조회 실패:', error)
    return []
  }
}

/**
 * 특정 과목의 세션 조회
 *
 * @param subjectId - 과목 ID
 * @returns 해당 과목의 모든 세션
 */
export async function getSessionsBySubject(subjectId: string): Promise<StudySession[]> {
  try {
    return await db.sessions.where('subjectId').equals(subjectId).toArray()
  } catch (error) {
    console.error('❌ Session 조회 실패:', error)
    return []
  }
}

/**
 * 날짜 범위로 세션 조회
 *
 * @param startDate - 시작 날짜 (YYYY-MM-DD)
 * @param endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns 해당 범위의 모든 세션
 */
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<StudySession[]> {
  try {
    return await db.sessions
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()
  } catch (error) {
    console.error('❌ Session 조회 실패:', error)
    return []
  }
}

/**
 * 세션 업데이트
 *
 * @param id - 세션 ID
 * @param updates - 업데이트할 필드
 * @returns 업데이트 성공 여부
 */
export async function updateSession(
  id: number,
  updates: Partial<StudySession>
): Promise<boolean> {
  try {
    await db.sessions.update(id, updates)
    console.log('✅ Session 업데이트:', id)

    await createAuditLog({
      entity: 'session',
      entityId: String(id),
      action: 'update',
      metadata: updates
    })

    return true
  } catch (error) {
    console.error('❌ Session 업데이트 실패:', error)
    return false
  }
}

/**
 * 세션 삭제
 *
 * @param id - 세션 ID
 * @returns 삭제 성공 여부
 */
export async function deleteSession(id: number): Promise<boolean> {
  try {
    await db.sessions.delete(id)
    console.log('✅ Session 삭제:', id)

    await createAuditLog({
      entity: 'session',
      entityId: String(id),
      action: 'delete'
    })

    return true
  } catch (error) {
    console.error('❌ Session 삭제 실패:', error)
    return false
  }
}

/**
 * 최근 세션 조회
 *
 * @param limit - 조회할 개수 (기본 10개)
 * @returns 최근 세션 목록
 */
export async function getRecentSessions(limit: number = 10): Promise<StudySession[]> {
  try {
    return await db.sessions.orderBy('timestamp').reverse().limit(limit).toArray()
  } catch (error) {
    console.error('❌ Recent sessions 조회 실패:', error)
    return []
  }
}

/**
 * 과목별 총 학습 시간 계산
 *
 * @param subjectId - 과목 ID
 * @returns 총 학습 시간 (시간 단위)
 */
export async function getTotalHoursBySubject(subjectId: string): Promise<number> {
  try {
    const sessions = await db.sessions.where('subjectId').equals(subjectId).toArray()
    return sessions.reduce((sum, s) => sum + s.duration, 0)
  } catch (error) {
    console.error('❌ 총 학습 시간 계산 실패:', error)
    return 0
  }
}

// ============================================================================
// Reflections 관련 함수
// ============================================================================

/**
 * 새 성찰 생성
 *
 * @param reflection - 성찰 데이터 (id, timestamp 제외)
 * @returns 생성된 성찰 ID
 * @throws {Error} 성찰 저장 실패 시
 */
export async function createReflection(
  reflection: Omit<Reflection, 'id' | 'timestamp'>
): Promise<string> {
  try {
    const newReflection: Reflection = {
      ...reflection,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }

    await db.reflections.add(newReflection)
    console.log('✅ Reflection 생성:', newReflection.id)

    await createAuditLog({
      entity: 'reflection',
      entityId: String(newReflection.id),
      action: 'create',
      metadata: { topic: reflection.selectedTopic, rating: reflection.learningRating }
    })

    return String(newReflection.id)
  } catch (error) {
    console.error('❌ Reflection 생성 실패:', error)
    throw new Error('성찰 기록 저장에 실패했습니다.')
  }
}

/**
 * 특정 날짜의 성찰 조회
 *
 * @param date - YYYY-MM-DD 형식의 날짜
 * @returns 해당 날짜의 모든 성찰
 */
export async function getReflectionsByDate(date: string): Promise<Reflection[]> {
  try {
    return await db.reflections.where('date').equals(date).toArray()
  } catch (error) {
    console.error('❌ Reflection 조회 실패:', error)
    return []
  }
}

/**
 * 검색어로 성찰 검색
 *
 * @param query - 검색어
 * @returns 검색 결과
 */
export async function searchReflections(query: string): Promise<Reflection[]> {
  try {
    const lowerQuery = query.toLowerCase()

    return await db.reflections
      .filter(
        r =>
          r.selectedTopic?.toLowerCase().includes(lowerQuery) ||
          r.recallContent?.toLowerCase().includes(lowerQuery) ||
          r.tomorrowPlan?.toLowerCase().includes(lowerQuery)
      )
      .toArray()
  } catch (error) {
    console.error('❌ Reflection 검색 실패:', error)
    return []
  }
}

/**
 * 평가 점수로 필터링
 *
 * @param rating - 학습 평가 점수 (1-5)
 * @returns 해당 점수의 성찰 목록
 */
export async function filterReflectionsByRating(rating: Rating): Promise<Reflection[]> {
  try {
    return await db.reflections.where('learningRating').equals(rating).toArray()
  } catch (error) {
    console.error('❌ Reflection 필터링 실패:', error)
    return []
  }
}

/**
 * 최근 성찰 조회
 *
 * @param limit - 조회할 개수 (기본 10개)
 * @returns 최근 성찰 목록
 */
export async function getRecentReflections(limit: number = 10): Promise<Reflection[]> {
  try {
    return await db.reflections.orderBy('timestamp').reverse().limit(limit).toArray()
  } catch (error) {
    console.error('❌ Recent reflections 조회 실패:', error)
    return []
  }
}

// ============================================================================
// Subjects 관련 함수
// ============================================================================

/**
 * 새 과목 생성
 *
 * @param subject - 과목 데이터
 * @returns 생성된 과목 ID
 * @throws {Error} 과목 저장 실패 시
 */
export async function createSubject(subject: Subject): Promise<string> {
  try {
    await db.subjects.add(subject)
    console.log('✅ Subject 생성:', subject.id)

    await createAuditLog({
      entity: 'subject',
      entityId: subject.id,
      action: 'create',
      metadata: { name: subject.name, examType: subject.examType }
    })

    return subject.id
  } catch (error) {
    console.error('❌ Subject 생성 실패:', error)
    throw new Error('과목 저장에 실패했습니다.')
  }
}

/**
 * 모든 과목 조회
 *
 * @returns 모든 과목 목록
 */
export async function getAllSubjects(): Promise<Subject[]> {
  try {
    return await db.subjects.toArray()
  } catch (error) {
    console.error('❌ Subjects 조회 실패:', error)
    return []
  }
}

/**
 * 특정 과목 조회
 *
 * @param id - 과목 ID
 * @returns 과목 데이터 또는 undefined
 */
export async function getSubjectById(id: string): Promise<Subject | undefined> {
  try {
    return await db.subjects.get(id)
  } catch (error) {
    console.error('❌ Subject 조회 실패:', error)
    return undefined
  }
}

/**
 * 과목 업데이트
 *
 * @param id - 과목 ID
 * @param updates - 업데이트할 필드
 * @returns 업데이트 성공 여부
 */
export async function updateSubject(id: string, updates: Partial<Subject>): Promise<boolean> {
  try {
    await db.subjects.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    console.log('✅ Subject 업데이트:', id)

    await createAuditLog({
      entity: 'subject',
      entityId: id,
      action: 'update',
      metadata: updates
    })

    return true
  } catch (error) {
    console.error('❌ Subject 업데이트 실패:', error)
    return false
  }
}

/**
 * 과목 삭제
 *
 * @param id - 과목 ID
 * @returns 삭제 성공 여부
 */
export async function deleteSubject(id: string): Promise<boolean> {
  try {
    await db.subjects.delete(id)
    console.log('✅ Subject 삭제:', id)

    await createAuditLog({
      entity: 'subject',
      entityId: id,
      action: 'delete'
    })

    return true
  } catch (error) {
    console.error('❌ Subject 삭제 실패:', error)
    return false
  }
}

// ============================================================================
// 통계 관련 함수
// ============================================================================

/**
 * 일일 통계 조회
 *
 * @param date - YYYY-MM-DD 형식의 날짜
 * @returns 일일 통계
 */
export async function getDailyStats(date: string): Promise<DailyStats> {
  try {
    const sessions = await getSessionsByDate(date)

    const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0)
    const sessionCount = sessions.length

    const subjectBreakdown: Record<string, number> = {}
    sessions.forEach(s => {
      subjectBreakdown[s.subjectId] = (subjectBreakdown[s.subjectId] || 0) + s.duration
    })

    const avgConcentration =
      sessions.reduce((sum, s) => sum + s.concentration, 0) / (sessionCount || 1)
    const avgUnderstanding =
      sessions.reduce((sum, s) => sum + s.understanding, 0) / (sessionCount || 1)
    const avgFatigue = sessions.reduce((sum, s) => sum + s.fatigue, 0) / (sessionCount || 1)

    return {
      date,
      totalHours,
      sessionCount,
      subjectBreakdown,
      averageConcentration: avgConcentration,
      averageUnderstanding: avgUnderstanding,
      averageFatigue: avgFatigue
    }
  } catch (error) {
    console.error('❌ Daily stats 조회 실패:', error)
    throw error
  }
}

/**
 * 주간 통계 조회
 *
 * @param startDate - 주의 시작 날짜 (월요일, YYYY-MM-DD)
 * @returns 주간 통계
 */
export async function getWeeklyStats(startDate: string): Promise<WeeklyStats> {
  try {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 6) // 일요일까지

    const sessions = await getSessionsByDateRange(startDate, end.toISOString().split('T')[0])

    const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0)
    const dailyAverage = totalHours / 7

    const subjectHours: Record<string, number> = {}
    sessions.forEach(s => {
      subjectHours[s.subjectId] = (subjectHours[s.subjectId] || 0) + s.duration
    })

    const mostStudiedSubject =
      Object.entries(subjectHours).sort(([, a], [, b]) => b - a)[0]?.[0] || ''

    const studyTypeBreakdown: Partial<Record<string, number>> = {}
    sessions.forEach(s => {
      studyTypeBreakdown[s.studyType] = (studyTypeBreakdown[s.studyType] || 0) + s.duration
    })

    return {
      weekStart: startDate,
      weekEnd: end.toISOString().split('T')[0],
      totalHours,
      dailyAverage,
      mostStudiedSubject,
      studyTypeBreakdown: studyTypeBreakdown as any
    }
  } catch (error) {
    console.error('❌ Weekly stats 조회 실패:', error)
    throw error
  }
}

// ============================================================================
// 감사 로그 관련 함수
// ============================================================================

/**
 * 감사 로그 생성 (내부 함수)
 */
async function createAuditLog(data: {
  entity: AuditLog['entity']
  entityId: string
  action: AuditLog['action']
  metadata?: Record<string, any>
}): Promise<void> {
  try {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: 'current_user', // TODO: 실제 사용자 ID로 교체
      entity: data.entity,
      entityId: data.entityId,
      action: data.action,
      metadata: data.metadata
    }

    await db.auditLogs.add(auditLog)
  } catch (error) {
    // 감사 로그 실패는 무시 (메인 작업에 영향 없음)
    console.warn('⚠️ Audit log 생성 실패:', error)
  }
}

/**
 * 감사 로그 조회
 *
 * @param limit - 조회할 개수 (기본 100개)
 * @returns 감사 로그 목록
 */
export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  try {
    return await db.auditLogs.orderBy('timestamp').reverse().limit(limit).toArray()
  } catch (error) {
    console.error('❌ Audit logs 조회 실패:', error)
    return []
  }
}
