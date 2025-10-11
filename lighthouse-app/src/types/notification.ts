/**
 * 알림 타입 정의
 */

export type NotificationType =
  | 'STUDY_REMINDER'      // 학습 시작 알림
  | 'BREAK_REMINDER'      // 휴식 알림
  | 'REFLECTION_REMINDER' // 성찰 작성 알림
  | 'GOAL_REMINDER'       // 목표 확인 알림
  | 'DAILY_SUMMARY'       // 일일 요약 알림

export type NotificationPriority = 'low' | 'normal' | 'high'

export type NotificationScheduleType = 'once' | 'daily' | 'weekly' | 'custom'

export interface NotificationSchedule {
  type: NotificationScheduleType
  time?: string // HH:MM 형식
  daysOfWeek?: number[] // 0 (일요일) - 6 (토요일)
  date?: string // ISO 날짜 (일회성 알림용)
}

export interface Notification {
  id: number
  type: NotificationType
  title: string
  body: string
  priority: NotificationPriority
  schedule: NotificationSchedule
  enabled: boolean
  lastTriggered?: string // ISO 날짜시간
  createdAt: string
  updatedAt: string
}

export interface NotificationPreset {
  id: string
  type: NotificationType
  title: string
  body: string
  description: string
  defaultSchedule: NotificationSchedule
  icon?: string
}

/**
 * 알림 프리셋 목록
 */
export const NOTIFICATION_PRESETS: NotificationPreset[] = [
  {
    id: 'morning-study',
    type: 'STUDY_REMINDER',
    title: '🌅 아침 학습 시간입니다',
    body: '새로운 하루를 시작해볼까요? 오늘의 학습 목표를 달성해봅시다!',
    description: '매일 아침 학습 시작을 알려줍니다',
    defaultSchedule: {
      type: 'daily',
      time: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5] // 월-금
    },
    icon: '☀️'
  },
  {
    id: 'evening-study',
    type: 'STUDY_REMINDER',
    title: '🌙 저녁 학습 시간입니다',
    body: '하루를 마무리하며 학습해볼까요? 오늘 공부한 내용을 복습해봅시다!',
    description: '매일 저녁 학습 시작을 알려줍니다',
    defaultSchedule: {
      type: 'daily',
      time: '20:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    },
    icon: '🌙'
  },
  {
    id: 'break-reminder',
    type: 'BREAK_REMINDER',
    title: '☕ 휴식 시간입니다',
    body: '50분 학습하셨네요! 10분 정도 휴식을 취하세요.',
    description: '일정 시간 학습 후 휴식을 권장합니다',
    defaultSchedule: {
      type: 'custom' // 학습 세션 중에 동적으로 설정
    },
    icon: '☕'
  },
  {
    id: 'daily-reflection',
    type: 'REFLECTION_REMINDER',
    title: '📝 오늘의 성찰 시간입니다',
    body: '오늘 하루는 어땠나요? 학습 내용을 돌아보며 성찰을 작성해보세요.',
    description: '매일 저녁 성찰 작성을 알려줍니다',
    defaultSchedule: {
      type: 'daily',
      time: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    },
    icon: '📝'
  },
  {
    id: 'weekly-goal',
    type: 'GOAL_REMINDER',
    title: '🎯 주간 목표를 확인하세요',
    body: '이번 주 목표 달성률을 확인하고 다음 주를 준비해봅시다!',
    description: '매주 일요일 저녁 목표 확인을 알려줍니다',
    defaultSchedule: {
      type: 'weekly',
      time: '20:00',
      daysOfWeek: [0] // 일요일
    },
    icon: '🎯'
  },
  {
    id: 'daily-summary',
    type: 'DAILY_SUMMARY',
    title: '📊 오늘의 학습 요약',
    body: '오늘 총 N시간 학습하셨습니다. 수고하셨어요!',
    description: '매일 자정 전 학습 요약을 제공합니다',
    defaultSchedule: {
      type: 'daily',
      time: '23:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    },
    icon: '📊'
  }
]

/**
 * 알림 권한 상태
 */
export type NotificationPermission = 'default' | 'granted' | 'denied'

/**
 * 알림 통계
 */
export interface NotificationStats {
  totalScheduled: number
  totalTriggered: number
  enabledCount: number
  disabledCount: number
  byType: Record<NotificationType, number>
}
