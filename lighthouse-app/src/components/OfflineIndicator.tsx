import { WifiOff, Wifi } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import { useState, useEffect } from 'react'
import '../styles/OfflineIndicator.css'

export default function OfflineIndicator() {
  const { isOffline } = usePWA()
  const [showOnlineMessage, setShowOnlineMessage] = useState(false)

  useEffect(() => {
    if (!isOffline && showOnlineMessage) {
      // 온라인으로 전환되면 3초간 메시지 표시
      const timer = setTimeout(() => {
        setShowOnlineMessage(false)
      }, 3000)

      return () => clearTimeout(timer)
    }

    if (!isOffline) {
      setShowOnlineMessage(true)
    }
  }, [isOffline, showOnlineMessage])

  if (!isOffline && !showOnlineMessage) {
    return null
  }

  return (
    <div
      className={`offline-indicator ${isOffline ? 'offline-indicator--offline' : 'offline-indicator--online'}`}
      role="status"
      aria-live="polite"
    >
      <div className="offline-indicator__content">
        {isOffline ? (
          <>
            <WifiOff size={18} />
            <span>오프라인 모드</span>
          </>
        ) : (
          <>
            <Wifi size={18} />
            <span>다시 온라인입니다</span>
          </>
        )}
      </div>
    </div>
  )
}
