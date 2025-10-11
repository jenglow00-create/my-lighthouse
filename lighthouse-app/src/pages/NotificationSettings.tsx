import { useState, useEffect } from 'react'
import { Bell, BellOff, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import {
  getAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  getNotificationPermission,
  requestNotificationPermission,
  showTestNotification,
  rescheduleAllNotifications
} from '@/utils/notificationManager'
import { NOTIFICATION_PRESETS } from '@/types/notification'
import type { Notification, NotificationPreset } from '@/types/notification'
import '../styles/NotificationSettings.css'

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permission, setPermission] = useState(getNotificationPermission())
  const [showPresets, setShowPresets] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    rescheduleAllNotifications()
  }, [])

  async function loadNotifications() {
    setIsLoading(true)
    const data = await getAllNotifications()
    setNotifications(data)
    setIsLoading(false)
  }

  async function handleRequestPermission() {
    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)

    if (newPermission === 'granted') {
      await showTestNotification(
        '알림이 활성화되었습니다!',
        '이제 학습 알림을 받을 수 있습니다.'
      )
    }
  }

  async function handleAddFromPreset(preset: NotificationPreset) {
    await createNotification(
      preset.type,
      preset.title,
      preset.body,
      preset.defaultSchedule,
      true
    )
    await loadNotifications()
    setShowPresets(false)
  }

  async function handleToggleEnabled(id: number, enabled: boolean) {
    await updateNotification(id, { enabled })
    await loadNotifications()
  }

  async function handleDelete(id: number) {
    if (confirm('이 알림을 삭제하시겠습니까?')) {
      await deleteNotification(id)
      await loadNotifications()
    }
  }

  async function handleTest(notification: Notification) {
    await showTestNotification(notification.title, notification.body)
  }

  if (permission === 'denied') {
    return (
      <div className="notification-settings">
        <div className="notification-permission-blocked">
          <BellOff size={64} />
          <h2>알림 권한이 차단되었습니다</h2>
          <p>브라우저 설정에서 알림 권한을 허용해주세요.</p>
          <div className="permission-steps">
            <h3>권한 허용 방법:</h3>
            <ol>
              <li>브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하세요</li>
              <li>"알림" 또는 "Notifications" 설정을 찾으세요</li>
              <li>"허용" 또는 "Allow"로 변경하세요</li>
              <li>페이지를 새로고침하세요</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notification-settings">
      <header className="notification-settings__header">
        <h1>
          <Bell size={28} />
          알림 설정
        </h1>
        <p>학습을 도와줄 알림을 설정하세요</p>
      </header>

      {permission === 'default' && (
        <div className="notification-permission-request">
          <Bell size={48} />
          <h3>알림을 받으시겠습니까?</h3>
          <p>학습 시간, 휴식, 성찰 작성 등을 알려드립니다.</p>
          <button
            className="btn-primary"
            onClick={handleRequestPermission}
          >
            알림 허용하기
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <>
          <div className="notification-actions">
            <button
              className="btn-primary"
              onClick={() => setShowPresets(!showPresets)}
            >
              <Plus size={20} />
              알림 추가
            </button>
          </div>

          {showPresets && (
            <div className="notification-presets">
              <h2>프리셋 선택</h2>
              <div className="presets-grid">
                {NOTIFICATION_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="preset-card"
                    onClick={() => handleAddFromPreset(preset)}
                  >
                    <div className="preset-icon">{preset.icon}</div>
                    <h3>{preset.title}</h3>
                    <p>{preset.description}</p>
                    <div className="preset-schedule">
                      {preset.defaultSchedule.type === 'daily' && (
                        <span>매일 {preset.defaultSchedule.time}</span>
                      )}
                      {preset.defaultSchedule.type === 'weekly' && (
                        <span>매주 {preset.defaultSchedule.time}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="notifications-list">
            {isLoading ? (
              <div className="loading">알림 목록을 불러오는 중...</div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={64} />
                <h3>알림이 없습니다</h3>
                <p>위의 "알림 추가" 버튼을 눌러 알림을 추가해보세요.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  isEditing={editingId === notification.id}
                  onToggle={(enabled) => handleToggleEnabled(notification.id, enabled)}
                  onEdit={() => setEditingId(notification.id)}
                  onSave={() => {
                    setEditingId(null)
                    loadNotifications()
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(notification.id)}
                  onTest={() => handleTest(notification)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification
  isEditing: boolean
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onTest: () => void
}

function NotificationCard({
  notification,
  isEditing,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onTest
}: NotificationCardProps) {
  const [title, setTitle] = useState(notification.title)
  const [body, setBody] = useState(notification.body)
  const [time, setTime] = useState(notification.schedule.time || '09:00')

  async function handleSave() {
    await updateNotification(notification.id, {
      title,
      body,
      schedule: {
        ...notification.schedule,
        time
      }
    })
    onSave()
  }

  const typeLabels = {
    STUDY_REMINDER: '학습 알림',
    BREAK_REMINDER: '휴식 알림',
    REFLECTION_REMINDER: '성찰 알림',
    GOAL_REMINDER: '목표 알림',
    DAILY_SUMMARY: '일일 요약'
  }

  return (
    <div className={`notification-card ${notification.enabled ? 'enabled' : 'disabled'}`}>
      <div className="notification-card__header">
        <span className="notification-type">{typeLabels[notification.type]}</span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={notification.enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {isEditing ? (
        <div className="notification-card__edit">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="input-title"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용"
            className="input-body"
            rows={3}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input-time"
          />
          <div className="edit-actions">
            <button className="btn-save" onClick={handleSave}>
              <Check size={18} />
              저장
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              <X size={18} />
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="notification-card__content">
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
          <div className="notification-schedule">
            {notification.schedule.type === 'daily' && (
              <span>매일 {notification.schedule.time}</span>
            )}
            {notification.schedule.type === 'weekly' && (
              <span>매주 {notification.schedule.time}</span>
            )}
            {notification.lastTriggered && (
              <span className="last-triggered">
                마지막: {new Date(notification.lastTriggered).toLocaleString('ko-KR')}
              </span>
            )}
          </div>
          <div className="notification-actions">
            <button className="btn-icon" onClick={onEdit} title="수정">
              <Edit2 size={18} />
            </button>
            <button className="btn-icon" onClick={onTest} title="테스트">
              <Bell size={18} />
            </button>
            <button className="btn-icon btn-danger" onClick={onDelete} title="삭제">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
