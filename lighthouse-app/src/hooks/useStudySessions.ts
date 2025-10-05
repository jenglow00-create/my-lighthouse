// Study Sessions용 React Hook
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { db } from '@/db/schema'
import {
  createSession,
  updateSession,
  deleteSession,
  getRecentSessions,
  getTotalHoursBySubject
} from '@/db/operations'
import type { StudySession } from '@/types'

/**
 * 학습 세션 관리 Hook
 *
 * @param options - 조회 옵션
 * @returns 세션 데이터 및 CRUD 함수
 */
export function useStudySessions(options?: {
  date?: string
  subjectId?: string
  limit?: number
}) {
  // 실시간 쿼리
  const sessions = useLiveQuery(
    () => {
      if (options?.date) {
        return db.sessions.where('date').equals(options.date).toArray()
      }
      if (options?.subjectId) {
        return db.sessions.where('subjectId').equals(options.subjectId).toArray()
      }
      return db.sessions
        .orderBy('timestamp')
        .reverse()
        .limit(options?.limit || 50)
        .toArray()
    },
    [options?.date, options?.subjectId, options?.limit]
  )

  // 세션 생성
  const create = useCallback(
    async (session: Omit<StudySession, 'id' | 'timestamp'>) => {
      try {
        const id = await createSession(session)
        return id
      } catch (error) {
        console.error('세션 생성 실패:', error)
        throw error
      }
    },
    []
  )

  // 세션 업데이트
  const update = useCallback(async (id: number, updates: Partial<StudySession>) => {
    try {
      const success = await updateSession(id, updates)
      if (!success) {
        throw new Error('세션 업데이트 실패')
      }
      return success
    } catch (error) {
      console.error('세션 업데이트 실패:', error)
      throw error
    }
  }, [])

  // 세션 삭제
  const remove = useCallback(async (id: number) => {
    try {
      const success = await deleteSession(id)
      if (!success) {
        throw new Error('세션 삭제 실패')
      }
      return success
    } catch (error) {
      console.error('세션 삭제 실패:', error)
      throw error
    }
  }, [])

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
    create,
    update,
    remove
  }
}

/**
 * 최근 세션 조회 Hook
 *
 * @param limit - 조회할 개수 (기본 10개)
 */
export function useRecentSessions(limit: number = 10) {
  const sessions = useLiveQuery(() => getRecentSessions(limit), [limit])

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined
  }
}

/**
 * 과목별 총 학습 시간 Hook
 *
 * @param subjectId - 과목 ID
 */
export function useSubjectTotalHours(subjectId: string) {
  const totalHours = useLiveQuery(() => getTotalHoursBySubject(subjectId), [subjectId])

  return {
    totalHours: totalHours ?? 0,
    isLoading: totalHours === undefined
  }
}
