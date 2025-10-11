// IndexedDB 스키마 정의 (Dexie)
import Dexie, { type EntityTable, type Table } from 'dexie'
import type { StudySession, Reflection, Subject, AuditLog } from '@/types'
import type { Notification } from '@/types/notification'
import type { LogEntry } from '@/utils/logger'
import type { PerformanceMetric } from '@/utils/performanceMonitor'

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

/**
 * Lighthouse 데이터베이스 스키마
 *
 * 버전 관리:
 * - version 1: 초기 스키마 (sessions, reflections, subjects, auditLogs)
 * - version 2: 알림 시스템 추가 (notifications)
 * - version 3: 로그 시스템 추가 (logs)
 * - version 4: 성능 메트릭 추가 (performanceMetrics)
 * - version 5: 오프라인 큐 추가 (offlineQueue)
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
  notifications!: EntityTable<Notification, 'id'>
  logs!: Table<LogEntry, string>
  performanceMetrics!: Table<PerformanceMetric, string>
  offlineQueue!: Table<QueuedRequest, string>

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

    /**
     * Version 2: 알림 시스템 추가
     *
     * 인덱스 설명:
     * - notifications: type (타입별 필터링), enabled (활성화 여부),
     *                  lastTriggered (마지막 트리거 시간),
     *                  createdAt (생성 시간순 정렬)
     */
    this.version(2).stores({
      sessions: 'id, date, subjectId, [date+subjectId], timestamp',
      reflections: 'id, date, learningRating, selectedTopic',
      subjects: 'id, name, examType',
      auditLogs: 'id, timestamp, userId, entity, action',
      notifications: 'id, type, enabled, lastTriggered, createdAt'
    })

    /**
     * Version 3: 로그 시스템 추가
     *
     * 인덱스 설명:
     * - logs: timestamp (시간순 조회), level (레벨별 필터링),
     *         userId (사용자별 조회), page (페이지별 필터링)
     */
    this.version(3).stores({
      sessions: 'id, date, subjectId, [date+subjectId], timestamp',
      reflections: 'id, date, learningRating, selectedTopic',
      subjects: 'id, name, examType',
      auditLogs: 'id, timestamp, userId, entity, action',
      notifications: 'id, type, enabled, lastTriggered, createdAt',
      logs: 'id, timestamp, level, userId, page'
    })

    /**
     * Version 4: 성능 메트릭 추가
     *
     * 인덱스 설명:
     * - performanceMetrics: timestamp (시간순 조회), name (메트릭별 필터링),
     *                       rating (등급별 필터링), page (페이지별 필터링)
     */
    this.version(4).stores({
      sessions: 'id, date, subjectId, [date+subjectId], timestamp',
      reflections: 'id, date, learningRating, selectedTopic',
      subjects: 'id, name, examType',
      auditLogs: 'id, timestamp, userId, entity, action',
      notifications: 'id, type, enabled, lastTriggered, createdAt',
      logs: 'id, timestamp, level, userId, page',
      performanceMetrics: 'id, timestamp, name, rating, page'
    })

    /**
     * Version 5: 오프라인 큐 추가
     *
     * 인덱스 설명:
     * - offlineQueue: status (상태별 필터링), timestamp (시간순 조회)
     */
    this.version(5).stores({
      sessions: 'id, date, subjectId, [date+subjectId], timestamp',
      reflections: 'id, date, learningRating, selectedTopic',
      subjects: 'id, name, examType',
      auditLogs: 'id, timestamp, userId, entity, action',
      notifications: 'id, type, enabled, lastTriggered, createdAt',
      logs: 'id, timestamp, level, userId, page',
      performanceMetrics: 'id, timestamp, name, rating, page',
      offlineQueue: 'id, status, timestamp'
    })
  }
}

// 데이터베이스 인스턴스 (싱글톤)
export const db = new LighthouseDB()
