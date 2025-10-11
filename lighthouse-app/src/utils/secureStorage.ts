import { logger } from './logger';

/**
 * 저장 아이템 인터페이스
 */
interface StorageItem<T> {
  value: T;
  expiry?: number; // timestamp
  encrypted?: boolean;
}

/**
 * 안전한 localStorage 래퍼
 */
class SecureStorage {
  /**
   * 데이터 저장
   */
  setItem<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number; // 초 단위
      encrypt?: boolean;
    }
  ): void {
    try {
      const item: StorageItem<T> = {
        value
      };

      // TTL 설정
      if (options?.ttl) {
        item.expiry = Date.now() + (options.ttl * 1000);
      }

      // 암호화 플래그 (실제 암호화는 encryptionService 사용)
      if (options?.encrypt) {
        item.encrypted = true;
      }

      const serialized = JSON.stringify(item);

      // 크기 확인 (5MB 제한)
      if (serialized.length > 5 * 1024 * 1024) {
        throw new Error('Data too large for localStorage');
      }

      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.error('localStorage quota exceeded', error);
        this.cleanup();
        throw new Error('저장 공간이 부족합니다. 설정에서 데이터를 정리해주세요.');
      }

      logger.error(`Failed to set item: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * 데이터 조회
   */
  getItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(raw);

      // 만료 확인
      if (item.expiry && Date.now() > item.expiry) {
        logger.debug(`Item expired: ${key}`);
        this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      logger.error(`Failed to get item: ${key}`, error as Error);

      // 파싱 에러 시 해당 키 삭제
      this.removeItem(key);
      return null;
    }
  }

  /**
   * 데이터 삭제
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error(`Failed to remove item: ${key}`, error as Error);
    }
  }

  /**
   * 전체 삭제
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('Failed to clear localStorage', error as Error);
    }
  }

  /**
   * 만료된 데이터 정리
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;

          const item: StorageItem<any> = JSON.parse(raw);

          // 만료된 항목 삭제
          if (item.expiry && Date.now() > item.expiry) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch {
          // 파싱 불가능한 항목 삭제
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned ${cleanedCount} expired items from localStorage`);
    } catch (error) {
      logger.error('Failed to cleanup localStorage', error as Error);
    }
  }

  /**
   * 저장소 사용량 확인
   */
  getUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          used += value.length + key.length;
        }
      }

      // 대부분 브라우저는 5MB 제한
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch (error) {
      logger.error('Failed to get storage usage', error as Error);
      return { used: 0, total: 5 * 1024 * 1024, percentage: 0 };
    }
  }

  /**
   * 저장소 백업 (JSON 파일로)
   */
  backup(): string {
    try {
      const backup: Record<string, any> = {};
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        // 민감한 키는 제외
        if (this.isSensitiveKey(key)) {
          continue;
        }

        backup[key] = localStorage.getItem(key);
      }

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      logger.error('Failed to backup localStorage', error as Error);
      throw error;
    }
  }

  /**
   * 백업에서 복원
   */
  restore(backupData: string): void {
    try {
      const data = JSON.parse(backupData);

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      }

      logger.info('localStorage restored from backup');
    } catch (error) {
      logger.error('Failed to restore localStorage', error as Error);
      throw new Error('백업 복원에 실패했습니다');
    }
  }

  /**
   * 민감한 키 확인
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'key',
      'credential'
    ];

    return sensitivePatterns.some(pattern =>
      key.toLowerCase().includes(pattern)
    );
  }
}

export const secureStorage = new SecureStorage();

/**
 * 정기적 정리 (1시간마다)
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    secureStorage.cleanup();
  }, 60 * 60 * 1000);
}
