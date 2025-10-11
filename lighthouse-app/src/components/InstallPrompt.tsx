import { useState, useEffect } from 'react';
import { installPromptService } from '@/services/installPrompt.service';
import { logger } from '@/utils/logger';
import './InstallPrompt.css';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  useEffect(() => {
    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      logger.info('PWA already installed, hiding prompt');
      return;
    }

    // 이전에 dismiss했는지 확인
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < DISMISS_DURATION) {
        logger.info('Install prompt was recently dismissed');
        return;
      }
    }

    // 플랫폼 감지
    const ua = navigator.userAgent;
    let detectedPlatform: 'ios' | 'android' | 'desktop' | null = null;

    if (/iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)) {
      detectedPlatform = 'ios';
    } else if (/Android/.test(ua)) {
      detectedPlatform = 'android';
    } else if (!/Mobile/.test(ua)) {
      detectedPlatform = 'desktop';
    }

    setPlatform(detectedPlatform);

    // 설치 안내 메시지 가져오기
    const msg = installPromptService.getInstallInstructions();
    setInstructions(msg);

    // iOS는 항상 표시, 다른 플랫폼은 beforeinstallprompt 이벤트 대기
    if (detectedPlatform === 'ios') {
      setIsVisible(true);
    } else {
      // 약간의 딜레이 후 표시 (사용자가 앱을 둘러본 후)
      const timer = setTimeout(() => {
        // beforeinstallprompt 이벤트가 발생했는지 확인
        const canInstall = installPromptService.getCanInstall();
        if (canInstall || detectedPlatform === 'desktop') {
          setIsVisible(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    if (platform === 'ios') {
      // iOS는 수동 안내만 표시
      return;
    }

    try {
      const installed = await installPromptService.showInstallPrompt();
      if (installed) {
        logger.info('PWA installed successfully');
        setIsVisible(false);
      }
    } catch (error) {
      logger.error('Failed to show install prompt', error as Error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
    logger.info('Install prompt dismissed');
  };

  if (!isVisible || !platform) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button
          className="install-prompt-close"
          onClick={handleDismiss}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="install-prompt-icon">
          🏮
        </div>

        <h3 className="install-prompt-title">
          등대 앱 설치하기
        </h3>

        <p className="install-prompt-description">
          홈 화면에 추가하고 더 빠르고 편리하게 사용하세요
        </p>

        <div className="install-prompt-benefits">
          <div className="benefit">
            <span className="benefit-icon">⚡</span>
            <span className="benefit-text">빠른 실행</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">📱</span>
            <span className="benefit-text">앱처럼 사용</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔒</span>
            <span className="benefit-text">오프라인 지원</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔔</span>
            <span className="benefit-text">알림 받기</span>
          </div>
        </div>

        {platform === 'ios' && instructions && (
          <div className="install-prompt-instructions">
            <p className="instructions-text">{instructions}</p>
            <div className="ios-install-steps">
              <div className="step">1. Safari 하단의 <strong>공유</strong> 버튼 탭</div>
              <div className="step">2. <strong>홈 화면에 추가</strong> 선택</div>
              <div className="step">3. <strong>추가</strong> 버튼 탭</div>
            </div>
          </div>
        )}

        {platform !== 'ios' && (
          <div className="install-prompt-actions">
            <button
              className="btn-install"
              onClick={handleInstall}
            >
              지금 설치
            </button>
            <button
              className="btn-later"
              onClick={handleDismiss}
            >
              나중에
            </button>
          </div>
        )}

        {platform === 'ios' && (
          <div className="install-prompt-actions">
            <button
              className="btn-later"
              onClick={handleDismiss}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
