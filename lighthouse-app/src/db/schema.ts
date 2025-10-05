// IndexedDB 스키마 정의 (Dexie)
import Dexie, { type EntityTable } from 'dexie'
import type { StudySession, Reflection, Subject, AuditLog } from '@/types'

/**
 * Lighthouse 데이터베이스 스키마
 *
 * 버전 관리:
 * - version 1: 초기 스키마 (sessions, reflections, subjects, auditLogs)
 *
 * 인덱스 전략:
 * - 자주 조회하는 필드에만 인덱스 추가
 * - [date+subjectId] 같은 복합 인덱스로 쿼리 최적화
 */
export class LighthouseDB extends Dexie {
  // 테이블 타입 정의
  sessions!: EntityTable<StudySession, 'id'>
  reflections!: EntityTable<Reflection, 'id'>
  subjects!: EntityTable<Subject, 'id'>
  auditLogs!: EntityTable<AuditLog, 'id'>

  constructor() {
    super('LighthouseDB')

    /**
     * Version 1: 초기 스키마
     *
     * 인덱스 설명:
     * - sessions: date (날짜별 조회), subjectId (과목별 조회),
     *             [date+subjectId] (특정 날짜+과목 조합 조회),
     *             timestamp (생성 시간순 정렬)
     * - reflections: date (날짜별 조회), learningRating (평가별 필터링),
     *                selectedTopic (주제별 검색)
     * - subjects: name (이름 검색), examType (시험 유형별 필터링)
     * - auditLogs: timestamp (시간순 조회), userId (사용자별 조회),
     *              entity (엔티티별 필터링), action (액션별 필터링)
     */
    this.version(1).stores({
      sessions: 'id, date, subjectId, [date+subjectId], timestamp',
      reflections: 'id, date, learningRating, selectedTopic',
      subjects: 'id, name, examType',
      auditLogs: 'id, timestamp, userId, entity, action'
    })
  }
}

// 데이터베이스 인스턴스 (싱글톤)
export const db = new LighthouseDB()
