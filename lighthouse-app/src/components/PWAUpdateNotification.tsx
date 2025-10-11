import { RefreshCw, X } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import '../styles/PWAUpdateNotification.css'

export default function PWAUpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = usePWA()

  const handleUpdate = async () => {
    await updateServiceWorker(true) // true = 페이지 자동 새로고침
  }

  const handleDismiss = async () => {
    // 업데이트를 건너뛰고 나중에 다시 알림
    await updateServiceWorker(false)
  }

  if (!isUpdateAvailable) {
    return null
  }

  return (
    <div className="pwa-update-notification">
      <div className="pwa-update-notification__content">
        <button
          className="pwa-update-notification__close"
          onClick={handleDismiss}
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        <div className="pwa-update-notification__header">
          <RefreshCw size={24} className="pwa-update-notification__icon" />
          <div>
            <h4 className="pwa-update-notification__title">새 버전이 있습니다</h4>
            <p className="pwa-update-notification__description">
              더 나은 경험을 위해 업데이트를 권장합니다.
            </p>
          </div>
        </div>

        <div className="pwa-update-notification__actions">
          <button
            className="pwa-update-notification__button pwa-update-notification__button--update"
            onClick={handleUpdate}
          >
            지금 업데이트
          </button>
          <button
            className="pwa-update-notification__button pwa-update-notification__button--dismiss"
            onClick={handleDismiss}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
