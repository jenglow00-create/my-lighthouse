// 날짜 처리 유틸리티 함수

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환
 * @param date - 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
 * @param str - YYYY-MM-DD 형식의 문자열
 * @returns Date 객체
 */
export function parseDate(str: string): Date {
  const date = new Date(str)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${str}`)
  }
  return date
}

/**
 * 두 날짜 사이의 일수 계산
 * @param start - 시작 날짜
 * @param end - 종료 날짜
 * @returns 일수 (양수: end가 미래, 음수: end가 과거)
 */
export function getDaysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const startMs = start.getTime()
  const endMs = end.getTime()
  return Math.ceil((endMs - startMs) / msPerDay)
}

/**
 * 날짜의 주차 번호 계산 (ISO 8601 기준)
 * @param date - 계산할 날짜
 * @returns 주차 번호 (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function getTodayString(): string {
  return formatDate(new Date())
}

/**
 * ISO 8601 형식의 타임스탬프 생성
 * @returns ISO 8601 형식의 문자열
 */
export function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 특정 날짜로부터 N일 후의 날짜 계산
 * @param date - 기준 날짜
 * @param days - 더할 일수 (음수 가능)
 * @returns N일 후의 Date 객체
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * 주의 시작일(월요일) 계산
 * @param date - 기준 날짜
 * @returns 해당 주의 월요일 Date 객체
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day // 일요일이면 -6, 아니면 1-day
  result.setDate(result.getDate() + diff)
  return result
}

/**
 * 주의 종료일(일요일) 계산
 * @param date - 기준 날짜
 * @returns 해당 주의 일요일 Date 객체
 */
export function getWeekEnd(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? 0 : 7 - day
  result.setDate(result.getDate() + diff)
  return result
}

/**
 * 두 날짜가 같은 날인지 확인
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 같은 날이면 true
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2)
}

/**
 * 날짜가 오늘인지 확인
 * @param date - 확인할 날짜
 * @returns 오늘이면 true
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * 날짜가 과거인지 확인
 * @param date - 확인할 날짜
 * @returns 과거면 true
 */
export function isPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * 날짜가 미래인지 확인
 * @param date - 확인할 날짜
 * @returns 미래면 true
 */
export function isFuture(date: Date): boolean {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

/**
 * 상대적 날짜 표현 (예: "3일 전", "1주일 후")
 * @param date - 기준 날짜
 * @returns 상대적 날짜 문자열
 */
export function getRelativeDate(date: Date): string {
  const today = new Date()
  const days = getDaysBetween(today, date)

  if (days === 0) return '오늘'
  if (days === 1) return '내일'
  if (days === -1) return '어제'
  if (days > 0 && days <= 7) return `${days}일 후`
  if (days < 0 && days >= -7) return `${Math.abs(days)}일 전`
  if (days > 7 && days <= 30) return `${Math.floor(days / 7)}주 후`
  if (days < -7 && days >= -30) return `${Math.floor(Math.abs(days) / 7)}주 전`
  if (days > 30) return `${Math.floor(days / 30)}개월 후`
  return `${Math.floor(Math.abs(days) / 30)}개월 전`
}
