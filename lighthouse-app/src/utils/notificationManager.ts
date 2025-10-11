/**
 * 알림 관리 시스템
 * Web Notifications API와 Service Worker를 사용한 알림 관리
 */

import { db } from '@/db/schema'
import type {
  Notification,
  NotificationType,
  NotificationSchedule,
  NotificationPermission as CustomNotificationPermission
} from '@/types/notification'

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<CustomNotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission as CustomNotificationPermission
}

/**
 * 알림 권한 상태 확인
 */
export function getNotificationPermission(): CustomNotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }

  return Notification.permission as CustomNotificationPermission
}

/**
 * 알림 생성
 */
export async function createNotification(
  type: NotificationType,
  title: string,
  body: string,
  schedule: NotificationSchedule,
  enabled = true
): Promise<number> {
  const now = new Date().toISOString()

  const notification: Omit<Notification, 'id'> = {
    type,
    title,
    body,
    priority: 'normal',
    schedule,
    enabled,
    createdAt: now,
    updatedAt: now
  }

  const id = await db.notifications.add(notification as Notification)

  // 알림이 활성화되어 있으면 스케줄링
  if (enabled) {
    await scheduleNotification(id)
  }

  return id
}

/**
 * 알림 업데이트
 */
export async function updateNotification(
  id: number,
  updates: Partial<Omit<Notification, 'id' | 'createdAt'>>
): Promise<void> {
  const notification = await db.notifications.get(id)
  if (!notification) {
    throw new Error(`알림 ID ${id}를 찾을 수 없습니다`)
  }

  const updatedNotification = {
    ...updates,
    updatedAt: new Date().toISOString()
  }

  await db.notifications.update(id, updatedNotification)

  // 스케줄 재설정
  if (updates.enabled !== undefined || updates.schedule) {
    if (updates.enabled === false) {
      await unscheduleNotification(id)
    } else {
      await scheduleNotification(id)
    }
  }
}

/**
 * 알림 삭제
 */
export async function deleteNotification(id: number): Promise<void> {
  await unscheduleNotification(id)
  await db.notifications.delete(id)
}

/**
 * 모든 알림 조회
 */
export async function getAllNotifications(): Promise<Notification[]> {
  return await db.notifications.toArray()
}

/**
 * 활성화된 알림만 조회
 */
export async function getEnabledNotifications(): Promise<Notification[]> {
  return await db.notifications.where('enabled').equals(1).toArray()
}

/**
 * 타입별 알림 조회
 */
export async function getNotificationsByType(type: NotificationType): Promise<Notification[]> {
  return await db.notifications.where('type').equals(type).toArray()
}

/**
 * 알림 스케줄링 (Service Worker 사용)
 */
async function scheduleNotification(id: number): Promise<void> {
  const notification = await db.notifications.get(id)
  if (!notification || !notification.enabled) {
    return
  }

  // Service Worker에 메시지 전송
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      payload: { notificationId: id, notification }
    })
  }

  // 로컬 스케줄링 (Service Worker 백업)
  scheduleLocalNotification(notification)
}

/**
 * 알림 스케줄 취소
 */
async function unscheduleNotification(id: number): Promise<void> {
  // Service Worker에 취소 메시지 전송
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UNSCHEDULE_NOTIFICATION',
      payload: { notificationId: id }
    })
  }

  // 로컬 타이머 취소
  const timerId = notificationTimers.get(id)
  if (timerId) {
    clearTimeout(timerId)
    notificationTimers.delete(id)
  }
}

/**
 * 로컬 알림 타이머 저장소
 */
const notificationTimers = new Map<number, NodeJS.Timeout>()

/**
 * 로컬 알림 스케줄링 (브라우저가 활성화되어 있을 때)
 */
function scheduleLocalNotification(notification: Notification): void {
  const nextTriggerTime = calculateNextTriggerTime(notification.schedule)
  if (!nextTriggerTime) {
    return
  }

  const delay = nextTriggerTime.getTime() - Date.now()
  if (delay < 0) {
    return // 이미 지난 시간
  }

  // 기존 타이머 취소
  const existingTimer = notificationTimers.get(notification.id)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  // 새 타이머 설정
  const timerId = setTimeout(() => {
    showNotification(notification)
    notificationTimers.delete(notification.id)

    // 반복 알림인 경우 다시 스케줄링
    if (notification.schedule.type !== 'once') {
      scheduleLocalNotification(notification)
    }
  }, delay)

  notificationTimers.set(notification.id, timerId)
}

/**
 * 다음 알림 트리거 시간 계산
 */
function calculateNextTriggerTime(schedule: NotificationSchedule): Date | null {
  const now = new Date()

  if (schedule.type === 'once' && schedule.date) {
    const targetDate = new Date(schedule.date)
    return targetDate > now ? targetDate : null
  }

  if (schedule.type === 'daily' && schedule.time) {
    const [hours, minutes] = schedule.time.split(':').map(Number)
    const next = new Date(now)
    next.setHours(hours, minutes, 0, 0)

    // 오늘 시간이 지났으면 내일로
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    // 요일 확인
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      // 다음 해당 요일 찾기
      while (!schedule.daysOfWeek.includes(next.getDay())) {
        next.setDate(next.getDate() + 1)
      }
    }

    return next
  }

  if (schedule.type === 'weekly' && schedule.time && schedule.daysOfWeek) {
    const [hours, minutes] = schedule.time.split(':').map(Number)
    const next = new Date(now)
    next.setHours(hours, minutes, 0, 0)

    // 다음 해당 요일 찾기
    const currentDay = now.getDay()
    const targetDays = schedule.daysOfWeek.sort((a, b) => a - b)

    let daysToAdd = 0
    for (const targetDay of targetDays) {
      if (targetDay > currentDay || (targetDay === currentDay && next > now)) {
        daysToAdd = targetDay - currentDay
        break
      }
    }

    // 모든 요일이 지났으면 다음 주 첫 요일로
    if (daysToAdd === 0) {
      daysToAdd = 7 - currentDay + targetDays[0]
    }

    next.setDate(next.getDate() + daysToAdd)
    return next
  }

  return null
}

/**
 * 알림 표시
 */
export async function showNotification(notification: Notification): Promise<void> {
  const permission = getNotificationPermission()
  if (permission !== 'granted') {
    console.warn('알림 권한이 없습니다')
    return
  }

  // Service Worker를 통해 알림 표시
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `notification-${notification.id}`,
      requireInteraction: notification.priority === 'high',
      data: {
        notificationId: notification.id,
        type: notification.type
      }
    })

    // 마지막 트리거 시간 업데이트
    await db.notifications.update(notification.id, {
      lastTriggered: new Date().toISOString()
    })
  }
}

/**
 * 즉시 알림 표시 (테스트용)
 */
export async function showTestNotification(
  title: string,
  body: string
): Promise<void> {
  const permission = getNotificationPermission()
  if (permission !== 'granted') {
    const newPermission = await requestNotificationPermission()
    if (newPermission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다')
    }
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-notification'
    })
  }
}

/**
 * 모든 알림 다시 스케줄링 (앱 시작 시 호출)
 */
export async function rescheduleAllNotifications(): Promise<void> {
  const enabledNotifications = await getEnabledNotifications()

  for (const notification of enabledNotifications) {
    await scheduleNotification(notification.id)
  }

  console.log(`✅ ${enabledNotifications.length}개의 알림이 스케줄링되었습니다`)
}

/**
 * 알림 통계 조회
 */
export async function getNotificationStats() {
  const allNotifications = await getAllNotifications()

  const stats = {
    totalScheduled: allNotifications.length,
    totalTriggered: allNotifications.filter(n => n.lastTriggered).length,
    enabledCount: allNotifications.filter(n => n.enabled).length,
    disabledCount: allNotifications.filter(n => !n.enabled).length,
    byType: {} as Record<string, number>
  }

  for (const notification of allNotifications) {
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
  }

  return stats
}
