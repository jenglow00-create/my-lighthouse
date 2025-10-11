import { logger } from '@/utils/logger';
import { useUIStore } from '@/store';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

/**
 * 알림 서비스
 */
class NotificationService {
  /**
   * 알림 지원 여부
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * 현재 권한 상태
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  }

  /**
   * 권한 요청
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      logger.warn('Notifications not supported');
      return 'denied';
    }

    if (this.getPermission() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();

      logger.info('Notification permission', { permission });

      if (permission === 'granted') {
        useUIStore.getState().addToast(
          '알림 권한이 허용되었습니다',
          'success'
        );
      } else if (permission === 'denied') {
        useUIStore.getState().addToast(
          '알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.',
          'warning'
        );
      }

      return permission as NotificationPermission;
    } catch (error) {
      logger.error('Failed to request notification permission', error as Error);
      return 'denied';
    }
  }

  /**
   * 알림 표시
   */
  async show(options: NotificationOptions): Promise<Notification | null> {
    // 권한 확인
    if (this.getPermission() !== 'granted') {
      logger.warn('Notification permission not granted');
      return null;
    }

    try {
      // Service Worker를 통한 알림 (PWA)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          badge: options.badge || '/icon-192.png',
          image: options.image,
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          data: options.data,
          vibrate: [200, 100, 200],
          timestamp: Date.now()
        });

        logger.info('Notification shown via Service Worker', {
          title: options.title
        });

        return null; // Service Worker 알림은 Notification 객체 반환 안 함
      }

      // 일반 브라우저 알림
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data
      });

      // 클릭 이벤트
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();

        // 데이터에 URL이 있으면 이동
        if (options.data?.url) {
          window.location.href = options.data.url;
        }

        notification.close();
      };

      logger.info('Notification shown', { title: options.title });

      return notification;
    } catch (error) {
      logger.error('Failed to show notification', error as Error);
      return null;
    }
  }

  /**
   * 테스트 알림
   */
  async showTestNotification(): Promise<void> {
    await this.show({
      title: '나의 등대',
      body: '알림이 정상적으로 작동합니다! 🎉',
      tag: 'test-notification'
    });
  }

  /**
   * 모든 알림 닫기
   */
  async closeAll(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();

      notifications.forEach(notification => notification.close());

      logger.info(`Closed ${notifications.length} notifications`);
    } catch (error) {
      logger.error('Failed to close notifications', error as Error);
    }
  }
}

export const notificationService = new NotificationService();
