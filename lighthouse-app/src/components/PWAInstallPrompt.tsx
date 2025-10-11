import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import '../styles/PWAInstallPrompt.css'

export default function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // localStorage에서 이전 거부 기록 확인
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      // 7일이 지나면 다시 표시
      if (daysSinceDismissed < 7) {
        setIsDismissed(true)
        return
      }
    }

    // 설치 가능하면 3초 후에 프롬프트 표시
    if (isInstallable && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isDismissed])

  const handleInstall = async () => {
    await promptInstall()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setIsDismissed(true)
    setShowPrompt(false)
  }

  if (!showPrompt || !isInstallable || isDismissed) {
    return null
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-prompt__content">
        <button
          className="pwa-install-prompt__close"
          onClick={handleDismiss}
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        <div className="pwa-install-prompt__header">
          <Download size={32} className="pwa-install-prompt__icon" />
          <h3 className="pwa-install-prompt__title">앱으로 설치하기</h3>
        </div>

        <p className="pwa-install-prompt__description">
          나의 등대를 홈 화면에 추가하고 앱처럼 사용하세요. 더 빠르고 편리하게 학습을 관리할 수 있습니다.
        </p>

        <ul className="pwa-install-prompt__benefits">
          <li>📱 홈 화면에서 바로 접속</li>
          <li>⚡ 빠른 로딩 속도</li>
          <li>📶 오프라인에서도 사용 가능</li>
          <li>🔔 학습 알림 받기</li>
        </ul>

        <div className="pwa-install-prompt__actions">
          <button
            className="pwa-install-prompt__button pwa-install-prompt__button--install"
            onClick={handleInstall}
          >
            지금 설치하기
          </button>
          <button
            className="pwa-install-prompt__button pwa-install-prompt__button--dismiss"
            onClick={handleDismiss}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
