import { logger } from '@/utils/logger';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * PWA 설치 프롬프트 서비스
 */
class InstallPromptService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private canInstall = false;

  /**
   * 초기화
   */
  initialize(): void {
    // beforeinstallprompt 이벤트 캡처
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall = true;

      logger.info('Install prompt available');
    });

    // 설치 완료 감지
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;

      logger.info('PWA installed');
    });

    // 이미 설치되었는지 확인
    this.checkInstallStatus();
  }

  /**
   * 설치 상태 확인
   */
  private checkInstallStatus(): void {
    // Standalone 모드 = 설치됨
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      logger.info('PWA running in standalone mode');
    }

    // iOS Safari
    if ((navigator as any).standalone) {
      this.isInstalled = true;
      logger.info('PWA running on iOS standalone');
    }
  }

  /**
   * 설치 프롬프트 표시
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      logger.warn('Install prompt not available');
      return false;
    }

    try {
      // 브라우저 기본 프롬프트 표시
      await this.deferredPrompt.prompt();

      // 사용자 선택 대기
      const { outcome } = await this.deferredPrompt.userChoice;

      logger.info('Install prompt outcome', { outcome });

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to show install prompt', error as Error);
      return false;
    }
  }

  /**
   * 설치 가능 여부
   */
  getCanInstall(): boolean {
    return this.canInstall && !this.isInstalled;
  }

  /**
   * 설치됨 여부
   */
  getIsInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * 플랫폼별 설치 안내 메시지
   */
  getInstallInstructions(): string | null {
    const ua = navigator.userAgent;

    // iOS Safari
    if (/iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)) {
      return 'Safari 하단의 "공유" 버튼을 누른 후 "홈 화면에 추가"를 선택하세요.';
    }

    // Android Chrome (프롬프트 가능)
    if (this.canInstall) {
      return null; // 커스텀 프롬프트 표시
    }

    // Desktop Chrome
    if (/Chrome/.test(ua) && !/Mobile/.test(ua)) {
      return '주소창 오른쪽의 설치 아이콘을 클릭하세요.';
    }

    return '이 브라우저는 PWA 설치를 지원하지 않습니다.';
  }
}

export const installPromptService = new InstallPromptService();

// 초기화
if (typeof window !== 'undefined') {
  installPromptService.initialize();
}
