import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isUpdateAvailable: boolean
  isOffline: boolean
  promptInstall: () => Promise<void>
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

export function usePWA(): PWAState {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Service Worker 등록 및 업데이트 확인
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg)
        console.log('✅ Service Worker 등록됨')

        // 1시간마다 업데이트 확인
        setInterval(() => {
          reg.update()
        }, 60 * 60 * 1000)

        // 업데이트 감지
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true)
                console.log('🔄 업데이트 가능')
              }
            })
          }
        })
      }).catch((error) => {
        console.error('❌ Service Worker 등록 실패:', error)
      })
    }

    // PWA 설치 가능 여부 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
      console.log('📱 PWA 설치 가능')
    }

    // PWA 설치 완료 감지
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('✅ PWA 설치 완료')
    }

    // 온라인/오프라인 상태 감지
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 이미 설치되어 있는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ 설치 프롬프트를 사용할 수 없습니다')
      return
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('✅ 사용자가 PWA 설치를 수락했습니다')
    } else {
      console.log('❌ 사용자가 PWA 설치를 거부했습니다')
    }

    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  const updateServiceWorker = async (reloadPage = false) => {
    if (!registration || !registration.waiting) {
      return
    }

    // 새 Service Worker 활성화
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    if (reloadPage) {
      window.location.reload()
    }
  }

  return {
    isInstallable,
    isInstalled,
    isUpdateAvailable,
    isOffline,
    promptInstall,
    updateServiceWorker,
  }
}
