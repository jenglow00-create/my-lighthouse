import { Workbox } from 'workbox-window';
import { useUIStore } from '@/store';
import { logger } from './logger';

let wb: Workbox | undefined;

/**
 * Service Worker 등록
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service Worker not supported');
    return;
  }

  // Workbox 인스턴스 생성
  wb = new Workbox('/sw.js');

  // 업데이트 감지
  wb.addEventListener('waiting', () => {
    logger.info('New service worker waiting');
    showUpdatePrompt();
  });

  // 활성화 완료
  wb.addEventListener('activated', (event) => {
    if (!event.isUpdate) {
      logger.info('Service worker activated for the first time');
    } else {
      logger.info('Service worker updated');
    }
  });

  // 네트워크 에러 처리
  wb.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      logger.info('Cache updated:', event.data.payload);
    }
  });

  // 등록
  wb.register()
    .then((registration) => {
      logger.info('Service worker registered', {
        scope: registration?.scope
      });
    })
    .catch((error) => {
      logger.error('Service worker registration failed', error);
    });

  // 주기적 업데이트 확인 (1시간마다)
  setInterval(() => {
    wb?.update();
  }, 60 * 60 * 1000);
}

/**
 * 업데이트 프롬프트 표시
 */
function showUpdatePrompt(): void {
  const { addToast } = useUIStore.getState();

  addToast(
    '새 버전이 있습니다',
    'info',
    {
      duration: 0, // 무한
      action: {
        label: '새로고침',
        onClick: () => {
          applyUpdate();
        }
      }
    }
  );
}

/**
 * 업데이트 적용
 */
export function applyUpdate(): void {
  if (!wb) {
    window.location.reload();
    return;
  }

  wb.addEventListener('controlling', () => {
    window.location.reload();
  });

  // skipWaiting 메시지 전송
  wb.messageSkipWaiting();
}

/**
 * Service Worker 상태 확인
 */
export async function getServiceWorkerStatus(): Promise<{
  registered: boolean;
  updateAvailable: boolean;
  scope?: string;
}> {
  if (!('serviceWorker' in navigator)) {
    return {
      registered: false,
      updateAvailable: false
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();

  return {
    registered: !!registration,
    updateAvailable: !!registration?.waiting,
    scope: registration?.scope
  };
}

/**
 * Service Worker 제거 (디버깅용)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    await registration.unregister();
    logger.info('Service worker unregistered');

    // 캐시 삭제
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );

    logger.info('Caches cleared');
  }
}
