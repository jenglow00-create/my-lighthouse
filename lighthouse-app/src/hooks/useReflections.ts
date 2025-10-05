// Reflections용 React Hook
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState } from 'react'
import { db } from '@/db/schema'
import {
  createReflection,
  searchReflections,
  filterReflectionsByRating,
  getRecentReflections
} from '@/db/operations'
import type { Reflection, Rating } from '@/types'

/**
 * 성찰 관리 Hook
 *
 * @param options - 조회 옵션
 * @returns 성찰 데이터 및 CRUD 함수
 */
export function useReflections(options?: {
  date?: string
  rating?: Rating
  limit?: number
}) {
  // 실시간 쿼리
  const reflections = useLiveQuery(
    () => {
      if (options?.date) {
        return db.reflections.where('date').equals(options.date).toArray()
      }
      if (options?.rating) {
        return db.reflections.where('learningRating').equals(options.rating).toArray()
      }
      return db.reflections
        .orderBy('timestamp')
        .reverse()
        .limit(options?.limit || 50)
        .toArray()
    },
    [options?.date, options?.rating, options?.limit]
  )

  // 성찰 생성
  const create = useCallback(
    async (reflection: Omit<Reflection, 'id' | 'timestamp'>) => {
      try {
        const id = await createReflection(reflection)
        return id
      } catch (error) {
        console.error('성찰 생성 실패:', error)
        throw error
      }
    },
    []
  )

  return {
    reflections: reflections ?? [],
    isLoading: reflections === undefined,
    create
  }
}

/**
 * 최근 성찰 조회 Hook
 *
 * @param limit - 조회할 개수 (기본 10개)
 */
export function useRecentReflections(limit: number = 10) {
  const reflections = useLiveQuery(() => getRecentReflections(limit), [limit])

  return {
    reflections: reflections ?? [],
    isLoading: reflections === undefined
  }
}

/**
 * 성찰 검색 Hook
 */
export function useReflectionSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const results = useLiveQuery(
    async () => {
      if (!searchQuery.trim()) return []
      setIsSearching(true)
      const result = await searchReflections(searchQuery)
      setIsSearching(false)
      return result
    },
    [searchQuery]
  )

  const search = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const clear = useCallback(() => {
    setSearchQuery('')
  }, [])

  return {
    results: results ?? [],
    isSearching,
    search,
    clear,
    query: searchQuery
  }
}

/**
 * 평가 점수별 필터링 Hook
 *
 * @param rating - 학습 평가 점수 (1-5)
 */
export function useReflectionsByRating(rating: Rating) {
  const reflections = useLiveQuery(() => filterReflectionsByRating(rating), [rating])

  return {
    reflections: reflections ?? [],
    isLoading: reflections === undefined
  }
}
