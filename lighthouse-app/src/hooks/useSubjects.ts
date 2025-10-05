// Subjects용 React Hook
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useMemo } from 'react'
import { db } from '@/db/schema'
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getTotalHoursBySubject
} from '@/db/operations'
import type { Subject } from '@/types'

/**
 * 과목 관리 Hook
 *
 * @returns 과목 데이터 및 CRUD 함수
 */
export function useSubjects() {
  // 실시간 쿼리
  const subjects = useLiveQuery(() => getAllSubjects(), [])

  // 과목 생성
  const create = useCallback(async (subject: Subject) => {
    try {
      const id = await createSubject(subject)
      return id
    } catch (error) {
      console.error('과목 생성 실패:', error)
      throw error
    }
  }, [])

  // 과목 업데이트
  const update = useCallback(async (id: string, updates: Partial<Subject>) => {
    try {
      const success = await updateSubject(id, updates)
      if (!success) {
        throw new Error('과목 업데이트 실패')
      }
      return success
    } catch (error) {
      console.error('과목 업데이트 실패:', error)
      throw error
    }
  }, [])

  // 과목 삭제
  const remove = useCallback(async (id: string) => {
    try {
      const success = await deleteSubject(id)
      if (!success) {
        throw new Error('과목 삭제 실패')
      }
      return success
    } catch (error) {
      console.error('과목 삭제 실패:', error)
      throw error
    }
  }, [])

  // 과목 목록 (Record → Array 변환)
  const subjectList = useMemo(() => {
    return subjects ?? []
  }, [subjects])

  // 과목 맵 (id → subject)
  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {}
    subjectList.forEach(subject => {
      map[subject.id] = subject
    })
    return map
  }, [subjectList])

  return {
    subjects: subjectList,
    subjectMap,
    isLoading: subjects === undefined,
    create,
    update,
    remove
  }
}

/**
 * 특정 과목 조회 Hook
 *
 * @param id - 과목 ID
 */
export function useSubject(id: string) {
  const subject = useLiveQuery(() => getSubjectById(id), [id])

  return {
    subject,
    isLoading: subject === undefined
  }
}

/**
 * 과목별 통계 Hook
 *
 * @param subjectId - 과목 ID
 */
export function useSubjectStats(subjectId: string) {
  // 총 학습 시간
  const totalHours = useLiveQuery(() => getTotalHoursBySubject(subjectId), [subjectId])

  // 세션 개수
  const sessionCount = useLiveQuery(
    () => db.sessions.where('subjectId').equals(subjectId).count(),
    [subjectId]
  )

  // 평균 학습 시간
  const avgHours = useMemo(() => {
    if (!totalHours || !sessionCount || sessionCount === 0) return 0
    return totalHours / sessionCount
  }, [totalHours, sessionCount])

  return {
    totalHours: totalHours ?? 0,
    sessionCount: sessionCount ?? 0,
    avgHours,
    isLoading: totalHours === undefined || sessionCount === undefined
  }
}
