// Statistics용 React Hook
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { getDailyStats, getWeeklyStats } from '@/db/operations'
import type { WeeklyStats } from '@/types'

/**
 * 일일 통계 Hook
 *
 * @param date - YYYY-MM-DD 형식의 날짜
 * @returns 일일 통계 데이터
 */
export function useDailyStats(date: string) {
  const stats = useLiveQuery(() => getDailyStats(date), [date])

  return {
    stats,
    isLoading: stats === undefined
  }
}

/**
 * 주간 통계 Hook
 *
 * @param startDate - 주의 시작 날짜 (월요일, YYYY-MM-DD)
 * @returns 주간 통계 데이터
 */
export function useWeeklyStats(startDate: string) {
  const stats = useLiveQuery(() => getWeeklyStats(startDate), [startDate])

  return {
    stats,
    isLoading: stats === undefined
  }
}

/**
 * 월간 통계 Hook (여러 주의 데이터 집계)
 *
 * @param year - 연도
 * @param month - 월 (1-12)
 * @returns 월간 통계 데이터
 */
export function useMonthlyStats(year: number, month: number) {
  const stats = useLiveQuery(
    async () => {
      // 해당 월의 모든 주 데이터 수집
      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0)

      const weeks: WeeklyStats[] = []
      let currentDate = new Date(firstDay)

      // 월요일부터 시작하도록 조정
      while (currentDate.getDay() !== 1) {
        currentDate.setDate(currentDate.getDate() - 1)
      }

      // 각 주의 통계 수집
      while (currentDate <= lastDay) {
        const weekStart = currentDate.toISOString().split('T')[0]
        const weekStats = await getWeeklyStats(weekStart)
        weeks.push(weekStats)
        currentDate.setDate(currentDate.getDate() + 7)
      }

      // 월간 통계 계산
      const totalHours = weeks.reduce((sum, w) => sum + w.totalHours, 0)
      const avgDailyHours = totalHours / lastDay.getDate()

      return {
        year,
        month,
        totalHours,
        avgDailyHours,
        weeks
      }
    },
    [year, month]
  )

  return {
    stats,
    isLoading: stats === undefined
  }
}

/**
 * 기간별 비교 통계 Hook
 *
 * @param startDate - 시작 날짜 (YYYY-MM-DD)
 * @param endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns 기간별 비교 통계
 */
export function useComparisonStats(startDate: string, _endDate: string) {
  const thisWeek = useLiveQuery(() => getWeeklyStats(startDate), [startDate])

  // 이전 주 계산
  const prevWeekStart = useMemo(() => {
    const date = new Date(startDate)
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  }, [startDate])

  const lastWeek = useLiveQuery(() => getWeeklyStats(prevWeekStart), [prevWeekStart])

  // 변화율 계산
  const comparison = useMemo(() => {
    if (!thisWeek || !lastWeek) return null

    const hoursDiff = thisWeek.totalHours - lastWeek.totalHours
    const hoursChange =
      lastWeek.totalHours > 0 ? ((hoursDiff / lastWeek.totalHours) * 100).toFixed(1) : '0'

    return {
      thisWeek,
      lastWeek,
      hoursDiff,
      hoursChange: `${hoursChange}%`,
      isImproving: hoursDiff > 0
    }
  }, [thisWeek, lastWeek])

  return {
    comparison,
    isLoading: thisWeek === undefined || lastWeek === undefined
  }
}

/**
 * 오늘 통계 Hook (간편 버전)
 *
 * @returns 오늘의 통계 데이터
 */
export function useTodayStats() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  return useDailyStats(today)
}

/**
 * 이번 주 통계 Hook (간편 버전)
 *
 * @returns 이번 주의 통계 데이터
 */
export function useThisWeekStats() {
  const weekStart = useMemo(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day // 월요일로 조정
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return monday.toISOString().split('T')[0]
  }, [])

  return useWeeklyStats(weekStart)
}
