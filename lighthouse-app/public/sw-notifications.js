/**
 * Service Worker 알림 핸들링
 * Workbox와 함께 작동하는 커스텀 알림 로직
 */

// 알림 스케줄 저장소
const notificationSchedules = new Map()

/**
 * 메시지 핸들러
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'SCHEDULE_NOTIFICATION':
      scheduleNotification(payload.notificationId, payload.notification)
      break

    case 'UNSCHEDULE_NOTIFICATION':
      unscheduleNotification(payload.notificationId)
      break

    case 'SKIP_WAITING':
      self.skipWaiting()
      break
  }
})

/**
 * 알림 스케줄링
 */
function scheduleNotification(notificationId, notification) {
  // 기존 스케줄 취소
  unscheduleNotification(notificationId)

  const nextTriggerTime = calculateNextTriggerTime(notification.schedule)
  if (!nextTriggerTime) {
    return
  }

  const delay = nextTriggerTime.getTime() - Date.now()
  if (delay < 0) {
    return // 이미 지난 시간
  }

  const timerId = setTimeout(() => {
    showNotification(notification)
    notificationSchedules.delete(notificationId)

    // 반복 알림인 경우 다시 스케줄링
    if (notification.schedule.type !== 'once') {
      scheduleNotification(notificationId, notification)
    }
  }, delay)

  notificationSchedules.set(notificationId, timerId)
}

/**
 * 알림 스케줄 취소
 */
function unscheduleNotification(notificationId) {
  const timerId = notificationSchedules.get(notificationId)
  if (timerId) {
    clearTimeout(timerId)
    notificationSchedules.delete(notificationId)
  }
}

/**
 * 다음 트리거 시간 계산
 */
function calculateNextTriggerTime(schedule) {
  const now = new Date()

  if (schedule.type === 'once' && schedule.date) {
    const targetDate = new Date(schedule.date)
    return targetDate > now ? targetDate : null
  }

  if (schedule.type === 'daily' && schedule.time) {
    const [hours, minutes] = schedule.time.split(':').map(Number)
    const next = new Date(now)
    next.setHours(hours, minutes, 0, 0)

    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
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

    const currentDay = now.getDay()
    const targetDays = schedule.daysOfWeek.sort((a, b) => a - b)

    let daysToAdd = 0
    for (const targetDay of targetDays) {
      if (targetDay > currentDay || (targetDay === currentDay && next > now)) {
        daysToAdd = targetDay - currentDay
        break
      }
    }

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
async function showNotification(notification) {
  await self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `notification-${notification.id}`,
    requireInteraction: notification.priority === 'high',
    data: {
      notificationId: notification.id,
      type: notification.type,
      url: getNotificationUrl(notification.type)
    },
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' }
    ]
  })
}

/**
 * 알림 타입에 따른 URL 반환
 */
function getNotificationUrl(type) {
  const urls = {
    STUDY_REMINDER: '/study',
    BREAK_REMINDER: '/study',
    REFLECTION_REMINDER: '/metacognition',
    GOAL_REMINDER: '/goals',
    DAILY_SUMMARY: '/dashboard'
  }

  return urls[type] || '/'
}

/**
 * 알림 클릭 핸들러
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { action, data } = event

  if (action === 'close') {
    return
  }

  // 앱 열기 또는 포커스
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if (data && data.url) {
              return client.navigate(data.url)
            }
          })
        }
      }

      // 없으면 새 창 열기
      if (clients.openWindow) {
        const url = data && data.url ? data.url : '/'
        return clients.openWindow(url)
      }
    })
  )
})

/**
 * 알림 닫기 핸들러
 */
self.addEventListener('notificationclose', (event) => {
  console.log('알림이 닫혔습니다:', event.notification.tag)
})

/**
 * Push 알림 핸들러 (향후 확장용)
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data
    })
  )
})
